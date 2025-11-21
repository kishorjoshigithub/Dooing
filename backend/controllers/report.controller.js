import Task from "../models/task.model.js";
import excelJs from "exceljs";
import User from "../models/user.model.js";

export const exportTaskReport = async (req, res, next) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email");
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("Tasks");
    worksheet.columns = [
      { header: "Task Id", key: "_id", width: 30 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
      { header: "Priority", key: "priority", width: 20 },
      { header: "Due Date", key: "dueDate", width: 30 },
      { header: "Status", key: "status", width: 30 },
    ];

    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        .map((user) => `${user.name} | ${user.email}`)
        .join(", ");
      worksheet.addRow({
        _id: task._id,
        title: task.title,
        description: task.description,
        assignedTo: assignedTo || "Unassigned",
        priority: task.priority,
        dueDate: task.dueDate.toString().split("T")[0],
        status: task.status,
      });
    });
    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=tasks_report.xlsx"
      );
      res.send(buffer);
    });
  } catch (error) {
    next(error);
  }
};

export const exportUserReport = async (req, res, next) => {
  try {
    const users = await User.find().select("name email _id").lean();
    const userTasks = await Task.find()
      .populate("assignedTo", "name email _id")
      .lean();
    const userTasksMap = {};

    users.forEach((user) => {
      userTasksMap[user._id] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
      };
    });
    userTasks.forEach((task) => {
      const user = userTasksMap[task.assignedTo._id];
      if (task.status === "pending") {
        user.pendingTasks++;
      } else if (task.status === "completed") {
        user.completedTasks++;
      } else {
        user.inProgressTasks++;
      }
      user.taskCount++;
    });
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("Users");
    worksheet.columns = [
      { header: "User Id", key: "_id", width: 30 },
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Task Count", key: "taskCount", width: 30 },
      { header: "Pending Tasks", key: "pendingTasks", width: 30 },
      { header: "Completed Tasks", key: "completedTasks", width: 30 },
      { header: "In Progress Tasks", key: "inProgressTasks", width: 30 },
    ];

    Object.keys(userTasksMap).forEach((userId) => {
      const user = userTasksMap[userId];
      worksheet.addRow({
        _id: user._id,
        name: user.name,
        email: user.email,
        taskCount: user.taskCount,
        pendingTasks: user.pendingTasks,
        completedTasks: user.completedTasks,
        inProgressTasks: user.inProgressTasks,
      });
    });
    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=users_report.xlsx"
      );
      res.send(buffer);
    });
  } catch (error) {
    next(error);
  }
};
