import express from "express";
import {
  signin,
  signup,
  updateUserProfile,
  uploadImage,
  userProfile,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/verifyUser.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = express.Router();

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.get("/user-profile", verifyToken, userProfile);
router.put("/update-profile", verifyToken, updateUserProfile);
router.post("/upload-image", verifyToken, upload.single("image"), uploadImage);

export default router;
