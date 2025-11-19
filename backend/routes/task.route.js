import express from "express";
import {
  verifyToken,
  adminOnly,
} from "../middlewares/verifyUser.middleware.js";
import {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../controllers/task.controller.js";
const router = express.Router();

router.post("/create", verifyToken, adminOnly, createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id", verifyToken, getTaskById);
router.put("/:id", verifyToken, adminOnly, updateTask);
export default router;
