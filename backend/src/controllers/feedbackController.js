const crypto = require("crypto");
const Feedback = require("../models/Feedback");
const Session = require("../models/Session");
const Student = require("../models/Student");

const getRespondentKey = (studentId, sessionId) =>
  crypto
    .createHmac(
      "sha256",
      process.env.ANONYMITY_SECRET || process.env.JWT_SECRET
    )
    .update(`${sessionId}:${studentId}`)
    .digest("hex");

const validateRating = (value) => {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

const submitFeedback = async (req, res) => {
  try {
    const { pace, understanding, comment = "" } = req.body;
    if (!validateRating(pace) || !validateRating(understanding)) {
      return res.status(400).json({
        message: "Pace and understanding must be integers from 1 to 5"
      });
    }
    if (typeof comment !== "string" || comment.trim().length > 500) {
      return res.status(400).json({
        message: "Comment must be at most 500 characters"
      });
    }

    const [session, student] = await Promise.all([
      Session.findOne({ _id: req.student.sessionId, status: "active" }),
      Student.findOne({
        _id: req.student.id,
        sessionId: req.student.sessionId
      })
    ]);
    if (!session || !student) {
      return res.status(404).json({
        message: "Active student session not found"
      });
    }

    const respondentKey = getRespondentKey(student._id, session._id);
    const feedback = await Feedback.findOneAndUpdate(
      { sessionId: session._id, respondentKey },
      {
        $set: {
          pace: Number(pace),
          understanding: Number(understanding),
          comment: comment.trim()
        },
        $setOnInsert: { sessionId: session._id, respondentKey }
      },
      { new: true, upsert: true, runValidators: true }
    ).select("sessionId pace understanding comment createdAt updatedAt");

    // Recalculate aggregates and emit real-time socket updates to teacher
    try {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(session._id)) {
        const [analytics, allFeedback] = await Promise.all([
          Feedback.aggregate([
          { $match: { sessionId: session._id } },
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    responseCount: { $sum: 1 },
                    averagePace: { $avg: "$pace" },
                    averageUnderstanding: { $avg: "$understanding" }
                  }
                },
                { $project: { _id: 0 } }
              ],
              paceDistribution: [
                { $group: { _id: "$pace", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
              ],
              understandingDistribution: [
                { $group: { _id: "$understanding", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
              ]
            }
          }
        ]),
        Feedback.find({ sessionId: session._id })
          .select("pace understanding comment createdAt updatedAt")
          .sort({ updatedAt: -1 })
          .lean()
      ]);

      const result = analytics[0] || {};
      const socketPayload = {
        summary: result.summary?.[0] || {
          responseCount: 0,
          averagePace: 0,
          averageUnderstanding: 0
        },
        paceDistribution: result.paceDistribution || [],
        understandingDistribution: result.understandingDistribution || [],
        feedback: allFeedback
      };

      const io = req.app.get("io");
      if (io) {
        io.to(session._id.toString()).emit("feedbackUpdated", socketPayload);
      }
      }
    } catch (socketErr) {
      console.error("⚠️ Failed to broadcast real-time feedback aggregates:", socketErr.message);
    }

    res.status(201).json({
      message: "Anonymous feedback saved",
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const respondentKey = getRespondentKey(
      req.student.id,
      req.student.sessionId
    );
    const feedback = await Feedback.findOne({
      sessionId: req.student.sessionId,
      respondentKey
    }).select("sessionId pace understanding comment createdAt updatedAt");

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionFeedback = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      teacherId: req.teacher.id
    }).select("subject classCode status createdAt endedAt");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const [analytics, feedback] = await Promise.all([
      Feedback.aggregate([
        { $match: { sessionId: session._id } },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  responseCount: { $sum: 1 },
                  averagePace: { $avg: "$pace" },
                  averageUnderstanding: { $avg: "$understanding" }
                }
              },
              { $project: { _id: 0 } }
            ],
            paceDistribution: [
              { $group: { _id: "$pace", count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            understandingDistribution: [
              { $group: { _id: "$understanding", count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),
      Feedback.find({ sessionId: session._id })
        .select("pace understanding comment createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .lean()
    ]);

    const result = analytics[0] || {};
    res.json({
      session,
      summary: result.summary?.[0] || {
        responseCount: 0,
        averagePace: 0,
        averageUnderstanding: 0
      },
      paceDistribution: result.paceDistribution || [],
      understandingDistribution: result.understandingDistribution || [],
      feedback
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getSessionFeedback
};
