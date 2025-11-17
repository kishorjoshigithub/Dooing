import express from "express";
const router = express.Router();
import {
  adminOnly,
  verifyToken,
} from "../middlewares/verifyUser.middleware.js";
import { getUserById, getUsers } from "../controllers/user.controller.js";

router.get("/get-users", verifyToken, adminOnly, getUsers);
router.get("/:id", verifyToken, getUserById);

export default router;
