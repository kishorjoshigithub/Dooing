import express from "express";
import {
  verifyToken,
  adminOnly,
} from "../middlewares/verifyUser.middleware.js";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/task.controller.js";
const router = express.Router();

router.post("/create", verifyToken, adminOnly, createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id", verifyToken, getTaskById);
router.put("/:id", verifyToken, adminOnly, updateTask);
router.delete("/:id", verifyToken, adminOnly, deleteTask);
router.put("/:id/status", verifyToken, updateTaskStatus);
export default router;
