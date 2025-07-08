const { Activity, User, Todo } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all recent activities
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      where: { '$todo.user_id$': req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'], // Only send user's name
        },
        {
          model: Todo,
          as: 'todo',
          attributes: ['title'], // Only send todo's title
          paranoid: false, // Include soft-deleted todos
        },
      ],
    });

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};
