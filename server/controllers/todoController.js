const Todo = require('../models/Todo');
const Activity = require('../models/Activity');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all todos
// @route   GET /api/todos
// @access  Private
exports.getTodos = asyncHandler(async (req, res, next) => {
  const todos = await Todo.find({
    $or: [{ creator: req.user.id }, { assignee: req.user.id }],
  }).populate([
    { path: 'creator', select: 'name email' },
    { path: 'assignee', select: 'name email' },
  ]);

  res.status(200).json({
    success: true,
    count: todos.length,
    data: todos,
  });
});

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = asyncHandler(async (req, res, next) => {
  // Add creator to req.body
  req.body.creator = req.user.id;

  const todo = await Todo.create(req.body);

  const activity = await Activity.create({
    type: 'CREATE_TODO',
    details: `Task '${todo.title}' was created.`,
    user: req.user.id,
    todo: todo._id,
  });

  req.io.emit('activityCreated', activity);

  res.status(201).json({
    success: true,
    data: todo,
  });
});

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodo = asyncHandler(async (req, res, next) => {
  let todo = await Todo.findById(req.params.id).populate([
    { path: 'creator', select: 'name email' },
    { path: 'assignee', select: 'name email' },
  ]);

  if (!todo) {
    return next(
      new ErrorResponse(`Todo not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the creator or assignee
  if (todo.creator.id.toString() !== req.user.id && (!todo.assignee || todo.assignee.id.toString() !== req.user.id)) {
    return next(
      new ErrorResponse(`User not authorized to update this todo`, 401)
    );
  }

  todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'creator', select: 'name email' },
    { path: 'assignee', select: 'name email' },
  ]);

  // We can add activity logging here if needed

  req.io.emit('todoUpdated', todo);

  res.status(200).json({ success: true, data: todo });
});

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = asyncHandler(async (req, res, next) => {
  const todo = await Todo.findById(req.params.id).populate('creator');

  if (!todo) {
    return next(
      new ErrorResponse(`Todo not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the creator
  if (todo.creator.id.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to delete this todo`, 401)
    );
  }

  await Todo.findByIdAndDelete(req.params.id);

  // We can add activity logging here if needed

  req.io.emit('todoDeleted', { id: req.params.id });

  res.status(200).json({ success: true, data: {} });
});

// @desc    Smart assign a todo
// @route   PUT /api/todos/:id/smart-assign
// @access  Private
exports.smartAssign = asyncHandler(async (req, res, next) => {
  const todo = await Todo.findById(req.params.id);
  if (!todo) {
    return next(new ErrorResponse('Todo not found', 404));
  }

  // Aggregation pipeline to find the user with the fewest assigned, incomplete tasks
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'todos',
        localField: '_id',
        foreignField: 'assignee',
        as: 'assignedTasks',
      },
    },
    {
      $project: {
        name: 1,
        taskCount: {
          $size: {
            $filter: {
              input: '$assignedTasks',
              as: 'task',
              cond: { $ne: ['$$task.status', 'done'] },
            },
          },
        },
      },
    },
    { $sort: { taskCount: 1 } },
    { $limit: 1 },
  ]);

  if (users.length === 0) {
    return next(new ErrorResponse('No users available for assignment', 400));
  }

  const bestUser = users[0];
  todo.assignee = bestUser._id;
  await todo.save();

  // Log activity
  const activity = await Activity.create({
    type: 'SMART_ASSIGN',
    details: `Task '${todo.title}' was smart-assigned to '${bestUser.name}'.`,
    user: req.user.id,
    todo: todo._id,
  });

  req.io.emit('activityCreated', activity);
  req.io.emit('todoUpdated', todo);

  res.status(200).json({ success: true, data: todo });
});
