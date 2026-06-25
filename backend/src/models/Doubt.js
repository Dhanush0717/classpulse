const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doubt", doubtSchema);
