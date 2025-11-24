import express from "express";
import {
  getOverviewStats,
  getUserStats,
  getCooperativeStats,
  getResultsStats,
  getCategoryPerformance,
  getRecommendationsAnalytics,
  getDashboardAnalytics,
} from "./analytics.controller.js";
import { authenticate, authorize } from "../../middlwares/auth.middleware.js";

const router = express.Router();

// All analytics routes require authentication
// Most are admin-only for security

// Dashboard - comprehensive overview (admin only)
router.get(
  "/dashboard",
  authenticate,
  authorize("admin"),
  getDashboardAnalytics
);

// Overview statistics (admin only)
router.get("/overview", authenticate, authorize("admin"), getOverviewStats);

// User analytics (admin only)
router.get("/users", authenticate, authorize("admin"), getUserStats);

// Cooperative analytics (admin only)
router.get(
  "/cooperatives",
  authenticate,
  authorize("admin"),
  getCooperativeStats
);

// Results analytics - MAIN FOCUS (admin only)
router.get("/results", authenticate, authorize("admin"), getResultsStats);

// Category performance analytics (admin only)
router.get(
  "/results/categories",
  authenticate,
  authorize("admin"),
  getCategoryPerformance
);

// Recommendations analytics (admin only)
router.get(
  "/results/recommendations",
  authenticate,
  authorize("admin"),
  getRecommendationsAnalytics
);

export default router;
