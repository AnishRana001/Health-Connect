import ActivityLog from '../models/ActivityLog.js';

// @desc  Get recent activity logs (admin only)
// @route GET /api/admin/activity?limit=20
// @access Private/Admin
export const getActivityLogs = async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 20);

    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email');

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
