import express from "express";
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

const app = express();
const port = process.env.PORT;

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

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.use("/api/auth", authRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1", progressRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/instructor", instructorRoutes);
app.use("/api/v1/certificates", certificateRoutes);
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

app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});
