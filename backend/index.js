import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

const app = express();
const port = process.env.PORT || 3000;

//Middlewares
app.use(
  cors({
    origin: process.env.FRONT_END_URL || "http://localhost:5173/",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

//Routes
import authRouter from "./routes/auth.route.js";

app.use("/api/auth", authRouter);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });
