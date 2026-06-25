const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    classCode: {
      type: String,
      required: true,
      unique: true,
    },

    otp: {
      type: String,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },

    endedAt: Date,

    location: {
      latitude: Number,
      longitude: Number
    },

    attendanceRadius: {
      type: Number,
      default: 50
    },

    aiSummary: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
