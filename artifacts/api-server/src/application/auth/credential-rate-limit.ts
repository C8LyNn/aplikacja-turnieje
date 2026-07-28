import { and, eq, inArray, sql } from "drizzle-orm";
import {
  authCredentialRateLimitsTable,
  db,
} from "@workspace/db";
import { fingerprintRequestSource } from "../../auth";

export const AUTH_CREDENTIAL_RATE_LIMIT_POLICY = Object.freeze({
  sourceMaxFailures: 5,
  tournamentMaxFailures: 25,
  windowMs: 15 * 60 * 1_000,
  blockMs: 15 * 60 * 1_000,
  retentionMs: 7 * 24 * 60 * 60 * 1_000,
  cleanupBatchSize: 50,
});

export const NEW_CREDENTIAL_MIN_LENGTH = 8;
export const AUTH_DUMMY_PASSWORD_HASH =
  "00000000000000000000000000000000:775984fcea1b97cf086d5b73c3de6f849a6d47baa68e2b4da52fc608f668e619544479d2100d2ea7264f89f92b357ba65f6a3c96c7e715c47c0322cd7818d6ee";

export type CredentialType =
  | "organizer"
  | "viewer"
  | "support"
  | "legacy_upgrade";

export interface CredentialRateLimitPolicy {
  sourceMaxFailures: number;
  tournamentMaxFailures: number;
  windowMs: number;
  blockMs: number;
  retentionMs: number;
  cleanupBatchSize: number;
}

export interface CredentialVerificationSuccess<T> {
  ok: true;
  value: T;
}

export interface CredentialVerificationFailure {
  ok: false;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class InvalidCredentialError extends Error {
  readonly code = "INVALID_CREDENTIALS";

  constructor() {
    super("Nie udało się zweryfikować poświadczeń.");
  }
}

export class CredentialRateLimitError extends Error {
  readonly code = "AUTH_RATE_LIMITED";

  constructor(readonly retryAfterSeconds: number) {
    super("Zbyt wiele prób. Spróbuj ponownie później.");
  }
}

export function fingerprintCredentialSource(source: string): string {
  return fingerprintRequestSource(source);
}

interface AttemptInput<T> {
  tournamentId: number;
  credentialType: CredentialType;
  sourceFingerprint: string;
  verify: (
    tx: Transaction,
  ) => Promise<CredentialVerificationSuccess<T> | CredentialVerificationFailure>;
  policy?: CredentialRateLimitPolicy;
}

interface ScopeState {
  scopeType: "source" | "tournament";
  sourceFingerprint: string;
  maxFailures: number;
  failureCount: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
}

function addMilliseconds(value: Date, milliseconds: number): Date {
  return new Date(value.getTime() + milliseconds);
}

function retryAfterSeconds(now: Date, blockedUntil: Date): number {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1_000));
}

async function cleanupExpiredRows(
  tx: Transaction,
  now: Date,
  policy: CredentialRateLimitPolicy,
): Promise<void> {
  const cutoff = addMilliseconds(now, -policy.retentionMs);
  await tx.execute(sql`
    DELETE FROM ${authCredentialRateLimitsTable}
    WHERE ctid IN (
      SELECT ctid
      FROM ${authCredentialRateLimitsTable}
      WHERE ${authCredentialRateLimitsTable.lastUpdatedAt} < ${cutoff}
      ORDER BY ${authCredentialRateLimitsTable.lastUpdatedAt}
      LIMIT ${policy.cleanupBatchSize}
    )
  `);
}

export async function executeCredentialAttempt<T>(
  input: AttemptInput<T>,
): Promise<T> {
  const policy = input.policy ?? AUTH_CREDENTIAL_RATE_LIMIT_POLICY;
  const result = await db.transaction(async (tx) => {
    const clockResult = await tx.execute<{ now: Date | string }>(
      sql`SELECT CURRENT_TIMESTAMP AS now`,
    );
    const now = new Date(clockResult.rows[0]!.now);
    await cleanupExpiredRows(tx, now, policy);

    const scopes = [
      {
        scopeType: "source" as const,
        sourceFingerprint: input.sourceFingerprint,
        maxFailures: policy.sourceMaxFailures,
      },
      {
        scopeType: "tournament" as const,
        sourceFingerprint: "global",
        maxFailures: policy.tournamentMaxFailures,
      },
    ];

    await tx
      .insert(authCredentialRateLimitsTable)
      .values(
        scopes.map((scope) => ({
          scopeType: scope.scopeType,
          tournamentId: input.tournamentId,
          credentialType: input.credentialType,
          sourceFingerprint: scope.sourceFingerprint,
          windowStartedAt: now,
          failureCount: 0,
          blockedUntil: null,
          lastUpdatedAt: now,
        })),
      )
      .onConflictDoNothing();

    const stored = await tx
      .select()
      .from(authCredentialRateLimitsTable)
      .where(
        and(
          eq(authCredentialRateLimitsTable.tournamentId, input.tournamentId),
          eq(
            authCredentialRateLimitsTable.credentialType,
            input.credentialType,
          ),
          inArray(
            authCredentialRateLimitsTable.scopeType,
            scopes.map((scope) => scope.scopeType),
          ),
          inArray(
            authCredentialRateLimitsTable.sourceFingerprint,
            scopes.map((scope) => scope.sourceFingerprint),
          ),
        ),
      )
      .orderBy(authCredentialRateLimitsTable.scopeType)
      .for("update");

    const states: ScopeState[] = scopes.map((scope) => {
      const row = stored.find(
        (candidate) =>
          candidate.scopeType === scope.scopeType &&
          candidate.sourceFingerprint === scope.sourceFingerprint,
      );
      if (!row) throw new Error("Credential rate-limit state was not created.");
      const blockedUntil =
        row.blockedUntil && row.blockedUntil.getTime() > now.getTime()
          ? row.blockedUntil
          : null;
      const windowExpired =
        row.windowStartedAt.getTime() + policy.windowMs <= now.getTime();
      return {
        ...scope,
        failureCount: windowExpired && !blockedUntil ? 0 : row.failureCount,
        windowStartedAt:
          windowExpired && !blockedUntil ? now : row.windowStartedAt,
        blockedUntil,
      };
    });

    const activeBlocks = states
      .map((state) => state.blockedUntil)
      .filter((value): value is Date => value !== null);
    if (activeBlocks.length > 0) {
      const longest = activeBlocks.reduce((left, right) =>
        left.getTime() > right.getTime() ? left : right,
      );
      return {
        status: "limited" as const,
        retryAfterSeconds: retryAfterSeconds(now, longest),
      };
    }

    const verification = await input.verify(tx);
    if (!verification.ok) {
      let longestBlock: Date | null = null;
      for (const state of states) {
        const failureCount = state.failureCount + 1;
        const blockedUntil =
          failureCount >= state.maxFailures
            ? addMilliseconds(now, policy.blockMs)
            : null;
        if (
          blockedUntil &&
          (!longestBlock || blockedUntil.getTime() > longestBlock.getTime())
        ) {
          longestBlock = blockedUntil;
        }
        await tx
          .update(authCredentialRateLimitsTable)
          .set({
            windowStartedAt: state.windowStartedAt,
            failureCount,
            blockedUntil,
            lastUpdatedAt: now,
          })
          .where(
            and(
              eq(authCredentialRateLimitsTable.scopeType, state.scopeType),
              eq(
                authCredentialRateLimitsTable.tournamentId,
                input.tournamentId,
              ),
              eq(
                authCredentialRateLimitsTable.credentialType,
                input.credentialType,
              ),
              eq(
                authCredentialRateLimitsTable.sourceFingerprint,
                state.sourceFingerprint,
              ),
            ),
          );
      }
      return longestBlock
        ? {
            status: "limited" as const,
            retryAfterSeconds: retryAfterSeconds(now, longestBlock),
          }
        : { status: "invalid" as const };
    }

    for (const state of states) {
      await tx
        .update(authCredentialRateLimitsTable)
        .set({
          windowStartedAt: now,
          failureCount: 0,
          blockedUntil: null,
          lastUpdatedAt: now,
        })
        .where(
          and(
            eq(authCredentialRateLimitsTable.scopeType, state.scopeType),
            eq(
              authCredentialRateLimitsTable.tournamentId,
              input.tournamentId,
            ),
            eq(
              authCredentialRateLimitsTable.credentialType,
              input.credentialType,
            ),
            eq(
              authCredentialRateLimitsTable.sourceFingerprint,
              state.sourceFingerprint,
            ),
          ),
        );
    }
    return { status: "ok" as const, value: verification.value };
  });

  if (result.status === "limited") {
    throw new CredentialRateLimitError(result.retryAfterSeconds);
  }
  if (result.status === "invalid") throw new InvalidCredentialError();
  return result.value;
}

export async function deleteExpiredCredentialRateLimitRowsForTest(
  now: Date,
  policy: CredentialRateLimitPolicy = AUTH_CREDENTIAL_RATE_LIMIT_POLICY,
): Promise<void> {
  await db.transaction((tx) => cleanupExpiredRows(tx, now, policy));
}
