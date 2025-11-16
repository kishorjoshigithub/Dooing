import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import ManageTasks from "./pages/admin/ManageTasks.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import CreateTask from "./pages/admin/CreateTask.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";
import UserDashboard from "./pages/user/UserDashboard.jsx";
import TaskDetails from "./pages/user/TaskDetails.jsx";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Defining Admin Routes */}
        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/tasks" element={<ManageTasks />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/create-task" element={<CreateTask />} />
        </Route>

        {/* Defining User Routes */}
        <Route element={<PrivateRoute allowedRoles={["user"]} />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/tasks" element={<MYTasks />} />
          <Route path="/user/task-details/:id" element={<TaskDetails />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
