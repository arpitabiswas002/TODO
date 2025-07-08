const { Op } = require('sequelize');
const { Todo, Activity, User, sequelize } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all todos for a user
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.findAll({
      where: { [Op.or]: [{ userId: req.user.id }, { assigneeId: req.user.id }] },
      include: [{ model: User, as: 'creator' }, { model: User, as: 'assignee' }],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { title, description, status, assigneeId } = req.body;

    // Check for unique title for this user
    const existingTodo = await Todo.findOne({ where: { title, userId: req.user.id } });
    if (existingTodo) {
      return next(new ErrorResponse('A todo with this title already exists', 400));
    }

    const todo = await Todo.create({
      title,
      description,
            status: status || 'todo',
      userId: req.user.id,
      assigneeId: assigneeId || null
    }, { transaction: t });

    // Log activity
    const activity = await Activity.create({
      type: 'CREATE_TODO',
      details: `User '${req.user.name}' created task '${todo.title}'.`,
      userId: req.user.id,
      todoId: todo.id
    }, { transaction: t });
        req.io.emit('activity', activity);

    await t.commit();

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findByPk(req.params.id);

    if (!todo) {
      return next(new ErrorResponse('Todo not found', 404));
    }

    // Check if user is the creator or the assignee
    if (todo.userId !== req.user.id && todo.assigneeId !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this todo', 401));
    }

    const oldValues = { ...todo.get({ plain: true }) };

    // Update todo with new values
    const updatedTodo = await todo.update(req.body);

    // Log activity for each changed field
    const changes = [];
    if (oldValues.title !== updatedTodo.title) {
      changes.push(`renamed task from '${oldValues.title}' to '${updatedTodo.title}'`);
    }
    if (oldValues.status !== updatedTodo.status) {
      changes.push(`moved task from '${oldValues.status}' to '${updatedTodo.status}'`);
    }
    if (oldValues.assigneeId !== updatedTodo.assigneeId) {
        const oldAssignee = oldValues.assigneeId ? (await db.User.findByPk(oldValues.assigneeId))?.name : 'unassigned';
        const newAssignee = updatedTodo.assigneeId ? (await db.User.findByPk(updatedTodo.assigneeId))?.name : 'unassigned';
        changes.push(`reassigned task from ${oldAssignee} to ${newAssignee}`);
    }

    if (changes.length > 0) {
      const newActivity = await Activity.create({
        type: 'UPDATE_TODO',
        details: `User '${req.user.name}' ${changes.join(', ')}.`.replace(/,([^,]*)$/, ' and$1'),
        userId: req.user.id,
        todoId: todo.id
      });
          req.io.emit('activity', newActivity);
    }

    res.status(200).json({
      success: true,
      data: updatedTodo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findByPk(req.params.id);

    if (!todo) {
      return next(new ErrorResponse('Todo not found', 404));
    }

    // Check if user is the creator or the assignee
    if (todo.userId !== req.user.id && todo.assigneeId !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this todo', 401));
    }

    const todoTitle = todo.title;

    // Log activity before deleting
    const activity = await Activity.create({
      type: 'DELETE_TODO',
      details: `User '${req.user.name}' deleted task '${todoTitle}'.`,
      userId: req.user.id,
      todoId: todo.id
    });
        req.io.emit('activity', activity);

    await todo.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Smart assign a todo
// @route   PUT /api/todos/:id/smart-assign
// @access  Private
exports.smartAssign = async (req, res, next) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo) {
      return next(new ErrorResponse('Todo not found', 404));
    }

    // Find the user with the fewest assigned, incomplete tasks using a raw query
    const [users] = await sequelize.query(`
      SELECT
        u.id,
        u.name
      FROM Users AS u
      LEFT JOIN Todos AS t ON u.id = t.assignee_id AND t.status != 'done'
      GROUP BY u.id, u.name
      ORDER BY COUNT(t.assignee_id) ASC
      LIMIT 1;
    `);

    if (users.length === 0) {
      return next(new ErrorResponse('No users available for assignment', 400));
    }

    const bestUser = users[0];
    const oldAssigneeId = todo.assigneeId;
    await todo.update({ assigneeId: bestUser.id });

    // Log activity
    const oldAssignee = oldAssigneeId ? (await User.findByPk(oldAssigneeId))?.name : 'unassigned';
    const activity = await Activity.create({
      type: 'SMART_ASSIGN',
      details: `User '${req.user.name}' smart-assigned task '${todo.title}' from ${oldAssignee} to '${bestUser.name}'.`,
      userId: req.user.id,
      todoId: todo.id
    });
        req.io.emit('activity', activity);
    req.io.emit('task_updated');

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    next(error);
  }
};
