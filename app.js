const express = require("express");
const app = express();

const authRoutes = require("./src/routes/auth.routes");
const todoRoutes = require("./src/routes/todo.routes");

const errorHandler = require("./src/error");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRoutes);

app.use("/api/todo", todoRoutes);

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Todo API",
  });
});

/*404 handler*/
app.use((req, res, next) => {
  return res.status(404).json({
    path: req.originalUrl,
    message: "Page not found",
  });
});

/*Global error handler*/
app.use(errorHandler);

module.exports = app;
