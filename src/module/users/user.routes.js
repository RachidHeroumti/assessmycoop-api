import express from "express";
import {
  register,
  login,
  createUserByAdmin,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "./user.controller.js";
import { authenticate, authorize } from "../../middlwares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.post("/create", authenticate, authorize("admin"), createUserByAdmin);
router.get("/", authenticate, authorize("admin"), getAllUsers);
router.get("/me", authenticate, getMe);
router.get("/:id", authenticate, getUserById);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

export default router;

