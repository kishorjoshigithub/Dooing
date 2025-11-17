import jwt from "jsonwebtoken";
import { errorHandler } from "./error.middleware.js";

export const verifyToken = (req, res, next) => {
  const token =
    req.cookies.access_token ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return next(errorHandler(401, "Access denied. No token provided."));
  }
  try {
    jwt.verify(token, process.env.JWT_SECRETKEY, (err, user) => {
      if (err) return next(errorHandler(401, "Access denied. Invalid token."));
      req.user = user;
      next();
    });
  } catch (error) {
    console.log(error);
    return next(errorHandler(401, "Access denied. Invalid token."));
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(errorHandler(403, "Access denied. Admins only."));
  }
  next();
};
