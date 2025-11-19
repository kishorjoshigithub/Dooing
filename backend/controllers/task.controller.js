import Task from "../models/task.model.js";
import { errorHandler } from "../middlewares/error.middleware.js";
import mongoose from "mongoose";

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;
    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
      return next(errorHandler(400, "assignedTo must be a non-empty array"));
    }

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
      createdBy: req.user._id,
    });
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (req.user.role !== "admin") {
      filter.assignedTo = req.user._id;
    }

    let tasks = await Task.find(filter).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    tasks = tasks.map((task) => {
      const completedCount = task.todoChecklist.filter(
        (item) => item.completed
      ).length;
      return { ...task._doc, completedCount };
    });

    const countTasks = (taskStatus) => {
      const summaryFilter = { ...filter };
      if (taskStatus) summaryFilter.status = taskStatus;
      return Task.countDocuments(summaryFilter);
    };

    const [allTasks, pendingTasks, inProgressTasks, completedTasks] =
      await Promise.all([
        countTasks(),
        countTasks("Pending"),
        countTasks("In Progress"),
        countTasks("Completed"),
      ]);

    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      tasks,
      statusSummary: {
        allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }
    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.status = req.body.status || task.status;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.assignedTo = req.body.assignedTo || task.assignedTo;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;

    if (!Array.isArray(task.assignedTo) || task.assignedTo.length === 0) {
      return next(errorHandler(400, "assignedTo must be a non-empty array"));
    }
    const updatedTask = await task.save();
    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }
    await task.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    const isAssigned = task.assignedTo.some((userId) => {
      userId.toString() === req.user._id.toString();
    });
    if (!isAssigned && req.user.role !== "admin") {
      return next(
        errorHandler(403, "You are not authorized to update this task status")
      );
    }

    task.status = req.body.status || task.status;
    if (task.status === "Completed") {
      task.todoChecklist.forEach((item) => {
        item.completed = true;
      });
    }

    await task.save();
    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskChecklist = async (req, res, next) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(errorHandler(404, "Task not found"));
    }

    if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
      return next(
        errorHandler(
          403,
          "You are not authorized to update this task checklist"
        )
      );
    }

    task.todoChecklist = todoChecklist || task.todoChecklist;

    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;

    const totalItems = task.todoChecklist.length;

    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0 && task.progress < 100) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }
    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
    res.status(200).json({
      message: "Task check list updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardData = async (req, res, next) => {
  try {
    //Fetch Stats
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const inProgressTasks = await Task.countDocuments({
      status: "In Progress",
    });
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
    });

    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRow = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRow.find((row) => row._id === status)?.count || 0;
      return acc;
    }, {});

    taskDistribution["All"] = totalTasks;

    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityDistributionRow = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPriorityDistribution = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityDistributionRow.find((row) => row._id === priority)
          ?.count || 0;
      return acc;
    }, {});

    //recent 5 tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority dueDate createdAt");

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      charts: {
        taskDistribution,
        taskPriorityDistribution,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (req.user.role === "admin") {
      return next(
        errorHandler(
          403,
          "You are not authorized to access user dashboard data"
        )
      );
    }

    //Fetch Stats
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Completed",
    });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Pending",
    });
    const inProgressTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "In Progress",
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "$ne: Completed",
      dueDate: { $lt: new Date() },
    });

    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRow = await Task.aggregate([
      {
        $match: {
          assignedTo: userObjectId,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRow.find((row) => row._id === status)?.count || 0;
      return acc;
    }, {});

    taskDistribution["All"] = totalTasks;

    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityDistributionRow = await Task.aggregate([
      {
        $match: {
          assignedTo: userObjectId,
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPriorityDistribution = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityDistributionRow.find((row) => row._id === priority)
          ?.count || 0;
      return acc;
    }, {});

    //recent 5 tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority dueDate createdAt");

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      charts: {
        taskDistribution,
        taskPriorityDistribution,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
