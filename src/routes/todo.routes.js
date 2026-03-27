const express = require("express");

const todoController = require("../controller/todo.controller");
const { authenticate } = require("../middleware/Auth");

const router = express.Router();

router.post("/", authenticate, todoController.createTodo);
router.post("/:todoId", authenticate, todoController.updateTodo);
router.post("/:todoId/toggle", authenticate, todoController.toggleTodo);
router.post("/:todoId/delete", authenticate, todoController.deleteTodo);

module.exports = router;
