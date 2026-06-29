import Notification from '../models/Notification.js';

// ── Notification Controller ────────────────────────────────────────────────────
// All routes are protected (req.user is guaranteed by authMiddleware).
// Notifications are scoped to the requesting user — they can never see
// or modify another user's notifications.

// @desc  Get paginated notifications for the logged-in user
// @route GET /api/notifications?page=1&limit=10
// @access Private
export const getNotifications = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name'),  // show sender name if available
      Notification.countDocuments({ recipient: req.user._id }),
    ]);

    res.json({
      notifications,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get unread notification count (used for the bell badge)
// @route GET /api/notifications/unread-count
// @access Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get latest 5 notifications (for bell dropdown preview)
// @route GET /api/notifications/latest
// @access Private
export const getLatestNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'name');

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Mark a single notification as read
// @route PUT /api/notifications/:id/read
// @access Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id }, // ownership check
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Mark ALL notifications as read
// @route PUT /api/notifications/read-all
// @access Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
