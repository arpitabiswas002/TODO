const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/').get(getActivities);

module.exports = router;
