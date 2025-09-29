const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['incoming', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'ended']
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  },
  conferenceId: {
    type: String
  },
  isAssistantCall: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate duration before saving
callSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime - this.startTime;
  }
  next();
});

module.exports = mongoose.model('Call', callSchema);