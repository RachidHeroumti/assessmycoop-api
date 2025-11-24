import express from "express";
import {
  createResult,
  getAllResults,
  getResultById,
  getResultsByCooperativeId,
  updateResult,
  deleteResult,
  getQuestions,
} from "./result.controller.js";
import { authenticate, authorize } from "../../middlwares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllResults);
router.get("/questions", getQuestions);
router.get("/:id", getResultById);
router.get("/cooperative/:cooperativeId", getResultsByCooperativeId);

// Protected routes (authenticated users)
router.post("/", authenticate, createResult);
router.put("/:id", authenticate, updateResult);
router.delete("/:id", authenticate, authorize("admin"), deleteResult);

export default router;
