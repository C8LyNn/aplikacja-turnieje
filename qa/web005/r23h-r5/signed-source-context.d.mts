export interface VerifiedSignedRunContext {
  run_id: string; source_sha: string; plan_sha256: string;
  cluster_cert_sha256: string; system_identifier: string;
  base_database: string; base_database_oid: string;
  role_name: string; role_oid: string; host: string; port: number;
  network_mode: string; exclusive_writer: true; native_windows_pg_untouched: true;
  phase: string; action: string; expires_unix: number;
  signed_payload_sha256: string; envelope_sha256: string;
}
export declare class SourceContextHold extends Error { code: string }
export declare function requireVerifiedSourceContext(): VerifiedSignedRunContext;
export declare function verifySignedSourceContextBytes(bytes: Buffer): VerifiedSignedRunContext;
