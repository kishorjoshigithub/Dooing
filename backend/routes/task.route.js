import express from "express";
import {
  verifyToken,
  adminOnly,
} from "../middlewares/verifyUser.middleware.js";
import { createTask } from "../controllers/task.controller.js";
const router = express.Router();

router.post("/create", verifyToken, adminOnly, createTask);
export default router;
