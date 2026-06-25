const Session = require("../models/Session");
const generateClassCode = require("../utils/generateClassCode");
const generateOTP = require("../utils/generateOTP");

const createSession = async (req, res) => {
  try {
    const { subject, latitude, longitude } = req.body;
    if (
      !subject ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return res.status(400).json({
        message: "Subject and valid coordinates are required"
      });
    }

    const session = await Session.create({
      teacherId: req.teacher.id,
      subject,
      classCode: generateClassCode(),
      otp: generateOTP(),
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      otpExpiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      {
        _id: req.params.sessionId,
        teacherId: req.teacher.id,
        status: "active"
      },
      { status: "ended", endedAt: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }

    // Trigger Gemini AI Summary Generation
    try {
      const Feedback = require("../models/Feedback");
      const Doubt = require("../models/Doubt");
      const { generateSessionSummary } = require("../utils/geminiService");

      const [feedbacks, doubts] = await Promise.all([
        Feedback.find({ sessionId: session._id }),
        Doubt.find({ sessionId: session._id })
      ]);

      const aiSummary = await generateSessionSummary(session, feedbacks, doubts);
      session.aiSummary = aiSummary;
      await session.save();
    } catch (aiErr) {
      console.error("⚠️ AI Summarization failed during session close:", aiErr.message);
    }

    // Broadcast sessionEnded event via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(session._id.toString()).emit("sessionEnded", { 
        sessionId: session._id, 
        aiSummary: session.aiSummary,
        session
      });
    }

    res.json({ message: "Session ended successfully", session });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSession, endSession };
