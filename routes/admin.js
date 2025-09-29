const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Call = require('../models/Call');
const CallNote = require('../models/CallNote');
const SystemSettings = require('../models/SystemSettings');
const { requireAdmin, requireUserManagement, requireSystemAccess } = require('../middleware/auth');

// Get system statistics (admin only)
router.get('/stats', requireSystemAccess, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        admins: await User.countDocuments({ role: 'admin' }),
        regular: await User.countDocuments({ role: 'user' }),
        recent: await User.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        })
      },
      calls: {
        total: await Call.countDocuments(),
        today: await Call.countDocuments({
          startTime: { $gte: new Date().setHours(0, 0, 0, 0) }
        }),
        thisWeek: await Call.countDocuments({
          startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        assistantCalls: await Call.countDocuments({ isAssistantCall: true })
      },
      notes: {
        total: await CallNote.countDocuments(),
        fromStream: await CallNote.countDocuments({ source: 'audio_stream' }),
        fromRecording: await CallNote.countDocuments({ source: 'recording' }),
        recent: await CallNote.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Get all users (admin only)
router.get('/users', requireUserManagement, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user (admin only)
router.get('/users/:userId', requireUserManagement, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's call statistics
    const userCalls = await Call.countDocuments({ 
      $or: [
        { from: user.email },
        { to: user.email }
      ]
    });

    const userNotes = await CallNote.countDocuments({
      callSid: { $in: await Call.find({
        $or: [{ from: user.email }, { to: user.email }]
      }).distinct('callSid') }
    });

    res.json({
      user,
      statistics: {
        totalCalls: userCalls,
        totalNotes: userNotes,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.put('/users/:userId', requireUserManagement, async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    const updates = {};
    
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (role && ['admin', 'user'].includes(role)) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', requireUserManagement, async (req, res) => {
  try {
    // Prevent deleting the last admin
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all calls with admin view (admin only)
router.get('/calls', requireSystemAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const calls = await Call.find()
      .sort({ startTime: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Call.countDocuments();

    res.json({
      calls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Get system logs (admin only)
router.get('/logs', requireSystemAccess, async (req, res) => {
  try {
    // This would typically fetch from a logging system
    // For now, return recent database activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email role createdAt lastLogin');

    const recentCalls = await Call.find()
      .sort({ startTime: -1 })
      .limit(10)
      .select('callSid from to status startTime endTime');

    const recentNotes = await CallNote.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('callSid source audioChunks createdAt');

    res.json({
      recentActivity: {
        users: recentUsers,
        calls: recentCalls,
        notes: recentNotes
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
});

// Bulk user operations (admin only)
router.post('/users/bulk', requireUserManagement, async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Invalid bulk operation parameters' });
    }

    let result;
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
      case 'delete':
        // Prevent deleting admins or self
        const usersToDelete = await User.find({ _id: { $in: userIds } });
        const adminIds = usersToDelete.filter(u => u.role === 'admin').map(u => u._id);
        const selfId = req.user._id;
        
        if (adminIds.length > 0) {
          return res.status(400).json({ error: 'Cannot delete admin users' });
        }
        if (userIds.includes(selfId.toString())) {
          return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        result = await User.deleteMany({ _id: { $in: userIds } });
        break;
      default:
        return res.status(400).json({ error: 'Invalid bulk action' });
    }

    res.json({ 
      message: `Bulk ${action} completed successfully`,
      affected: result.modifiedCount || result.deletedCount || 0
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

// System Settings Management (admin only)

// Get all system settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await SystemSettings.find({}).sort({ setting: 1 });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Get specific setting
router.get('/settings/:settingName', requireAdmin, async (req, res) => {
  try {
    const { settingName } = req.params;
    const setting = await SystemSettings.findOne({ setting: settingName });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update system setting
router.put('/settings/:settingName', requireAdmin, async (req, res) => {
  try {
    const { settingName } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Setting value is required' });
    }

    const setting = await SystemSettings.setSetting(
      settingName,
      value,
      description || '',
      req.user._id
    );

    // Log the setting change
    console.log(`🔧 Setting changed by ${req.user.username}: ${settingName} = ${value}`);

    res.json({
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Toggle registration setting (convenience endpoint)
router.post('/settings/registration/toggle', requireAdmin, async (req, res) => {
  try {
    const currentValue = await SystemSettings.getSetting('registration_enabled', false);
    const newValue = !currentValue;

    const setting = await SystemSettings.setSetting(
      'registration_enabled',
      newValue,
      'Allow new user registration',
      req.user._id
    );

    console.log(`🔧 Registration ${newValue ? 'enabled' : 'disabled'} by ${req.user.username}`);

    res.json({
      message: `Registration ${newValue ? 'enabled' : 'disabled'} successfully`,
      setting,
      registrationEnabled: newValue
    });
  } catch (error) {
    console.error('Error toggling registration:', error);
    res.status(500).json({ error: 'Failed to toggle registration setting' });
  }
});

module.exports = router;