const express = require("express");
const path = require("path");
const app = express();
const session = require("express-session");

require("dotenv").config();

const dashboardRoutes = require("./src/routes/dashboard.route");
const authRoutes = require("./src/routes/auth.routes");
const todoRoutes = require("./src/routes/todo.routes");

const errorHandler = require("./src/error");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "src/public/uploads")));

app.set("view engine", "ejs");
app.set("views", __dirname + "/src/views");

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use("/api/auth", authRoutes);
app.use("/api/todo", todoRoutes);
app.use("/dashboard", dashboardRoutes);



app.get("/", (req, res) => {
  res.render("index");
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
