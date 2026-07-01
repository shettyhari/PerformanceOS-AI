import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import authRouter from "./routes/auth";
import dashboardRouter from "./routes/dashboard";
import analyticsRouter from "./routes/analytics";
import alertsRouter from "./routes/alerts";
import integrationsRouter from "./routes/integrations";
import athenaRouter from "./routes/athena";
import { logger } from "./lib/logger";

const app: Express = express();

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

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    logger.error("SESSION_SECRET environment variable is required in production");
    process.exit(1);
  } else {
    logger.warn("SESSION_SECRET not set — using insecure dev default. Set it before deploying.");
  }
}
app.use(session({
  secret: sessionSecret || "pmos-dev-secret-do-not-use-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/api", router);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/athena", athenaRouter);

export default app;
