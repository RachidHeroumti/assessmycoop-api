import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB, sequelize } from "./config/db.js";
import userRoutes from "./module/users/user.routes.js";
import cooperativeRoutes from "./module/cooperative/cooperative.routes.js";
import resultRoutes from "./module/results/result.routes.js";
import analyticsRoutes from "./module/analytics/analytics.routes.js";
import { errorHandler, notFound } from "./middlwares/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "AssessMyCoop API is running",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      cooperatives: "/api/cooperatives",
      results: "/api/results",
      analytics: "/api/analytics",
    },
  });
});

app.use("/api/users", userRoutes);
app.use("/api/cooperatives", cooperativeRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    await sequelize.sync({ alter: false });
    console.log("✅ Database models synchronized");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
