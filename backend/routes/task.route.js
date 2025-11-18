import express from "express";
import {
  verifyToken,
  adminOnly,
} from "../middlewares/verifyUser.middleware.js";
import { createTask, getTasks } from "../controllers/task.controller.js";
const router = express.Router();

router.post("/create", verifyToken, adminOnly, createTask);
router.get("/", verifyToken, getTasks);
export default router;
