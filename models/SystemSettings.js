const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  setting: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method to get a setting value
systemSettingsSchema.statics.getSetting = async function(settingName, defaultValue = null) {
  try {
    const setting = await this.findOne({ setting: settingName });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${settingName}:`, error);
    return defaultValue;
  }
};

// Static method to set a setting value
systemSettingsSchema.statics.setSetting = async function(settingName, value, description = '', updatedBy = null) {
  try {
    const updateData = {
      value,
      updatedBy,
      updatedAt: new Date()
    };

    if (description) {
      updateData.description = description;
    }

    const setting = await this.findOneAndUpdate(
      { setting: settingName },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return setting;
  } catch (error) {
    console.error(`Error setting ${settingName}:`, error);
    throw error;
  }
};

// Static method to initialize default settings
systemSettingsSchema.statics.initializeDefaults = async function() {
  try {
    const defaults = [
      {
        setting: 'registration_enabled',
        value: false,
        description: 'Allow new user registration'
      },
      {
        setting: 'max_users',
        value: 100,
        description: 'Maximum number of users allowed'
      },
      {
        setting: 'maintenance_mode',
        value: false,
        description: 'System maintenance mode'
      }
    ];

    for (const defaultSetting of defaults) {
      const exists = await this.findOne({ setting: defaultSetting.setting });
      if (!exists) {
        await this.create(defaultSetting);
        console.log(`✅ Initialized default setting: ${defaultSetting.setting} = ${defaultSetting.value}`);
      }
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);