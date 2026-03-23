import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.js";
import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import instructorRoutes from "./routes/instructor.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import { startEnrollmentRetryJob } from "./jobs/enrollmentRetry.job.js";
import {
  attachCorrelationId,
  errorHandler,
  notFoundHandler,
  normalizeLegacyErrorResponses,
} from './middlewares/index.js';
import { logError } from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === "production";
const clientDist = path.join(__dirname, "../../client/dist");
const hasClientDist = fs.existsSync(clientDist);

const app = express();
const port = process.env.PORT ?? 3000;
const rawOrigins = process.env.FRONTEND_ORIGIN || '';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
const allowedOriginPatterns = allowedOrigins
  .filter((origin) => origin.includes('*'))
  .map((origin) => {
    const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  });
const allowedOriginExact = new Set(allowedOrigins.filter((origin) => !origin.includes('*')));

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }
  if (allowedOriginExact.has(origin)) {
    return true;
  }
  for (const pattern of allowedOriginPatterns) {
    if (pattern.test(origin)) {
      return true;
    }
  }
  return false;
}

app.set('trust proxy', 1);
app.use(
  cors({
    origin:
      allowedOrigins.length > 0
        ? (origin, cb) => {
            if (isOriginAllowed(origin)) {
              cb(null, true);
            } else {
              cb(null, false);
            }
          }
        : true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(attachCorrelationId);
app.use(normalizeLegacyErrorResponses);
app.use("/api/v1/payments", paymentRoutes);
app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LMS API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

if (!isProd || !hasClientDist) {
  app.get("/", (req, res) => {
    res.redirect("/api-docs");
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1", progressRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/instructor", instructorRoutes);
app.use("/api/v1/certificates", certificateRoutes);

if (isProd) {
  if (hasClientDist) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

startEnrollmentRetryJob();

process.on('unhandledRejection', (error) => {
  logError({
    event: 'unhandled_rejection',
    error: error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error,
  });
});

process.on('uncaughtException', (error) => {
  logError({
    event: 'uncaught_exception',
    error: { name: error.name, message: error.message, stack: error.stack },
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is listening on ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});
