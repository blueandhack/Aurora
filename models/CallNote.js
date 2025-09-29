const mongoose = require('mongoose');

const callNoteSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    index: true
  },
  conferenceSid: {
    type: String
  },
  streamId: {
    type: String
  },
  recordingSid: {
    type: String
  },
  recordingUrl: {
    type: String
  },
  transcript: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['audio_stream', 'recording'],
    default: 'audio_stream'
  },
  audioChunks: {
    type: Number,
    default: 0
  },
  audioSize: {
    type: Number,
    default: 0
  },
  audioFilePath: {
    type: String
  },
  audioFileName: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
callNoteSchema.index({ callSid: 1, createdAt: -1 });
callNoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CallNote', callNoteSchema);