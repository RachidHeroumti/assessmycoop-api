import express from "express";
import {
  createCooperative,
  getAllCooperatives,
  getCooperativeById,
  updateCooperative,
  deleteCooperative,
  updateCooperativeScore,
  getCooperativesByScore,
} from "./cooperative.controller.js";
import { authenticate, authorize } from "../../middlwares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCooperatives);
router.get("/search", getCooperativesByScore);
router.get("/:id", getCooperativeById);

// Protected routes (authenticated users)
router.post("/", authenticate, createCooperative);
router.put("/:id", authenticate, updateCooperative);
router.patch("/:id/score", authenticate, updateCooperativeScore);
router.delete("/:id", authenticate, authorize("admin"), deleteCooperative);

export default router;

