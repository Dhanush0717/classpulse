const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  usn: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true
  },

  otpAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 2
  },

  joinedAt: {
    type: Date,
    default: Date.now
  }
});

studentSchema.index({ sessionId: 1, usn: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
