const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const authRoutes = require("./src/routes/auth.routes");
const dashboardRoutes = require("./src/routes/dashboard.route");
const todoRoutes = require("./src/routes/todo.routes");
const errorHandler = require("./src/error");
const { attachCurrentUser } = require("./src/middleware/Auth");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "src", "public", "uploads")));
app.use(attachCurrentUser);

app.get("/", (req, res) => {
  if (req.user) {
    return res.redirect("/dashboard");
  }

  return res.render("index", {
    title: "TaskFlow",
    currentPath: "/",
    currentUser: null,
  });
});

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/todos", todoRoutes);

app.use((req, res, next) => {
  const error = new Error("Page not found");
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;
