const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has specific role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Check if user can perform admin actions
userSchema.methods.canManageUsers = function() {
  return this.isAdmin();
};

// Check if user can access system-wide data
userSchema.methods.canAccessSystemData = function() {
  return this.isAdmin();
};

// Update last login timestamp
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to create first admin user
userSchema.statics.createAdminIfNone = async function() {
  const adminCount = await this.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    const defaultAdmin = new this({
      username: 'admin',
      email: 'admin@aurora.app',
      password: 'admin123',
      role: 'admin'
    });
    await defaultAdmin.save();
    console.log('✅ Default admin user created: admin/admin123');
    return defaultAdmin;
  }
  return null;
};

module.exports = mongoose.model('User', userSchema);