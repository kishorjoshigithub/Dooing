import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import { errorHandler } from "../middlewares/error.middleware.js";

export const getUsers = async (req, res, next) => {
  try {
    // Logic to get users from the database
    const users = await User.find({ role: "user" }).select("-password");

    const userWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "pending",
        });

        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "in-progress",
        });

        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "completed",
        });

        return {
          ...user._doc,
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      })
    );

    res.status(200).json({
      message: "Users fetched successfully",
      users: userWithTaskCounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};
