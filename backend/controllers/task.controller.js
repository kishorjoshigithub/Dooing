import Task from "../models/task.model.js";
import { errorHandler } from "../middlewares/error.middleware.js";

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
