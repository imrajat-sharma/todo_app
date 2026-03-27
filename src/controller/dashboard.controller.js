const Todo = require("../model/todo.model");
const User = require("../model/user.model");
const AppError = require("../utils/app-error");
const asyncHandler = require("../utils/async-handler");

const buildTodoFilters = (userId, query) => {
  const filters = {
    search: typeof query.search === "string" ? query.search.trim() : "",
    status: query.status || "all",
    priority: query.priority || "all",
  };

  const mongoFilter = { userId };

  if (filters.status !== "all") {
    mongoFilter.status = filters.status;
  }

  if (filters.priority !== "all") {
    mongoFilter.priority = filters.priority;
  }

  if (filters.search) {
    mongoFilter.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
  }

  return { filters, mongoFilter };
};

const renderDashboard = asyncHandler(async (req, res) => {
  const { filters, mongoFilter } = buildTodoFilters(req.user.id, req.query);

  const [todos, totalTodos, completedTodos, inProgressTodos, pendingTodos] = await Promise.all([
    Todo.find(mongoFilter).sort({ createdAt: -1 }).lean(),
    Todo.countDocuments({ userId: req.user.id }),
    Todo.countDocuments({ userId: req.user.id, status: "completed" }),
    Todo.countDocuments({ userId: req.user.id, status: "in_progress" }),
    Todo.countDocuments({ userId: req.user.id, status: "pending" }),
  ]);

  return res.render("dashboard/index", {
    title: "Dashboard",
    currentPath: "/dashboard",
    currentUser: req.user,
    user: req.user,
    todos,
    filters,
    stats: {
      total: totalTodos,
      completed: completedTodos,
      inProgress: inProgressTodos,
      pending: pendingTodos,
      completionRate: totalTodos ? Math.round((completedTodos / totalTodos) * 100) : 0,
    },
    message: req.query.message || "",
    error: req.query.error || "",
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const username = typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!name || !username || !email) {
    return res.redirect("/dashboard?error=Name, username, and email are required");
  }

  const duplicateUser = await User.findOne({
    _id: { $ne: req.user.id },
    $or: [{ email }, { username }],
  });

  if (duplicateUser) {
    return res.redirect("/dashboard?error=Email or username is already in use");
  }

  user.name = name;
  user.username = username;
  user.email = email;

  if (req.file?.filename) {
    user.profileImage = req.file.filename;
  }

  await user.save();

  return res.redirect("/dashboard?message=Profile updated successfully");
});

module.exports = {
  renderDashboard,
  updateProfile,
};
