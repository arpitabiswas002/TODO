const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/async');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
exports.getActivities = asyncHandler(async (req, res, next) => {
  // We can filter activities based on the user if needed in the future
  // For now, we get all recent activities
  const activities = await Activity.find()
    .populate('user', 'name email')
    .populate('todo', 'title')
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities,
  });
});
