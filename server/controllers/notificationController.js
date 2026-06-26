const { Notification } = require('../models');

// GET /api/notifications - List all notifications for the user
exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });
    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('List notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/notifications/:id/read - Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id }
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await notification.update({ is_read: true });
    return res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/notifications/read-all - Mark all unread notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/notifications - Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.destroy({
      where: { user_id: req.user.id }
    });
    return res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
