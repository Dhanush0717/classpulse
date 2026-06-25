const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true
    },
    respondentKey: {
      type: String,
      required: true,
      select: false
    },
    pace: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    understanding: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  { timestamps: true }
);

feedbackSchema.index(
  { sessionId: 1, respondentKey: 1 },
  { unique: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
