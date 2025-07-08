const express = require('express');
const router = express.Router();
const { 
  getTodos, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  smartAssign
} = require('../controllers/todoController');
const { protect } = require('../middleware/auth');

// All routes are protected and require authentication
router.use(protect);

router.route('/')
  .get(getTodos)
  .post(createTodo);

router.route('/:id')
  .put(updateTodo)
  .delete(deleteTodo);

router.route('/:id/smart-assign').put(smartAssign);

module.exports = router;
