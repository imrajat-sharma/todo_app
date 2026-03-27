const Todo = require("../model/todo.model");
const AppError = require("../utils/app-error");
const asyncHandler = require("../utils/async-handler");

const sanitizeTodoPayload = (body) => {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const status = ["pending", "in_progress", "completed"].includes(body.status) ? body.status : "pending";
  const priority = ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium";
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  return {
    title,
    description,
    status,
    priority,
    dueDate: dueDate && !Number.isNaN(dueDate.valueOf()) ? dueDate : null,
  };
};

const createTodo = asyncHandler(async (req, res) => {
  const payload = sanitizeTodoPayload(req.body);

  if (!payload.title) {
    return res.redirect("/dashboard?error=Todo title is required");
  }

  await Todo.create({
    userId: req.user.id,
    ...payload,
  });

  return res.redirect("/dashboard?message=Todo created successfully");
});

const updateTodo = asyncHandler(async (req, res) => {
  const payload = sanitizeTodoPayload(req.body);

  if (!payload.title) {
    return res.redirect("/dashboard?error=Todo title is required");
  }

  const todo = await Todo.findOne({
    _id: req.params.todoId,
    userId: req.user.id,
  });

  if (!todo) {
    throw new AppError("Todo not found", 404);
  }

  todo.title = payload.title;
  todo.description = payload.description;
  todo.status = payload.status;
  todo.priority = payload.priority;
  todo.dueDate = payload.dueDate;

  await todo.save();

  return res.redirect("/dashboard?message=Todo updated successfully");
});

const toggleTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.todoId,
    userId: req.user.id,
  });

  if (!todo) {
    throw new AppError("Todo not found", 404);
  }

  todo.status = todo.status === "completed" ? "pending" : "completed";
  await todo.save();

  return res.redirect("/dashboard?message=Todo status updated");
});

const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOneAndDelete({
    _id: req.params.todoId,
    userId: req.user.id,
  });

  if (!todo) {
    throw new AppError("Todo not found", 404);
  }

  return res.redirect("/dashboard?message=Todo deleted successfully");
});

module.exports = {
  createTodo,
  deleteTodo,
  toggleTodo,
  updateTodo,
};
