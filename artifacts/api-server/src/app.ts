import { randomUUID } from "node:crypto";
import express, {
  type ErrorRequestHandler,
  type Express,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { TournamentMutationAuthorizationError } from "./access-policy";
import { configureTrustProxy } from "./http/request-source";

export function createApp(env: NodeJS.ProcessEnv = process.env): Express {
  const app: Express = express();
  configureTrustProxy(app, env);

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", router);
  // A missing endpoint is not an exception and must never reach an HTML fallback.
  app.use("/api", (_req, res) => {
    res.status(404).type("application/json").json({
      error: "API route not found",
      code: "API_NOT_FOUND",
    });
  });

  const jsonErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const requestId = String(
      (req as typeof req & { id?: unknown }).id ?? randomUUID(),
    );
    const isInvalidJson =
      error != null &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "entity.parse.failed" &&
      "status" in error &&
      error.status === 400;
    if (isInvalidJson) {
      res.status(400).type("application/json").json({
        error: "Treść żądania nie jest prawidłowym JSON-em.",
        code: "INVALID_JSON",
        requestId,
      });
      return;
    }
    if (error instanceof TournamentMutationAuthorizationError) {
      res.status(403).type("application/json").json({
        error: error.message,
        code: error.code,
        requestId,
      });
      return;
    }
    logger.error(
      {
        err: error instanceof Error ? error : new Error("Unknown request error"),
        requestId,
        method: req.method,
        path: req.path,
      },
      "Unhandled request error",
    );
    res.status(500).type("application/json").json({
      error: "Wewnętrzny błąd serwera.",
      code: "INTERNAL_SERVER_ERROR",
      requestId,
    });
  };

  app.use(jsonErrorHandler);
  return app;
}

const app = createApp();

export default app;
