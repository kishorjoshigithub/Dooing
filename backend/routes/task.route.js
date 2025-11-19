import express from "express";
import {
  verifyToken,
  adminOnly,
} from "../middlewares/verifyUser.middleware.js";
import {
  createTask,
  getTaskById,
  getTasks,
} from "../controllers/task.controller.js";
const router = express.Router();

router.post("/create", verifyToken, adminOnly, createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id", verifyToken, getTaskById);
export default router;
