const Doubt = require("../models/Doubt");
const Session = require("../models/Session");
const Student = require("../models/Student");

const createDoubt = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Doubt text is required" });
    }
    if (text.trim().length > 500) {
      return res.status(400).json({ message: "Doubt text must be at most 500 characters" });
    }

    const session = await Session.findOne({ _id: req.student.sessionId, status: "active" });
    if (!session) {
      return res.status(404).json({ message: "Active lecture session not found" });
    }

    const doubt = await Doubt.create({
      sessionId: session._id,
      text: text.trim()
    });

    // Real-time socket notification
    const io = req.app.get("io");
    if (io) {
      io.to(session._id.toString()).emit("newDoubt", doubt);
    }

    res.status(201).json(doubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionDoubts = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (req.teacher) {
      const session = await Session.findOne({
        _id: sessionId,
        teacherId: req.teacher.id
      });
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
    } else if (req.student) {
      const student = await Student.findOne({
        _id: req.student.id,
        sessionId: sessionId
      });
      if (!student) {
        return res.status(403).json({ message: "Unauthorized to access doubts for this session" });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doubts = await Doubt.find({ sessionId }).sort({ createdAt: -1 });
    res.json(doubts);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

const resolveDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) {
      return res.status(404).json({ message: "Doubt not found" });
    }

    // Verify session teacher
    const session = await Session.findOne({
      _id: doubt.sessionId,
      teacherId: req.teacher.id
    });
    if (!session) {
      return res.status(403).json({ message: "Unauthorized to resolve doubts in this session" });
    }

    doubt.isResolved = true;
    await doubt.save();

    // Real-time socket notification
    const io = req.app.get("io");
    if (io) {
      io.to(session._id.toString()).emit("doubtResolved", doubt);
    }

    res.json({ message: "Doubt marked as resolved", doubt });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid doubt ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

const upvoteDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) {
      return res.status(404).json({ message: "Doubt not found" });
    }

    const studentId = req.student.id;
    const index = doubt.upvotes.indexOf(studentId);
    if (index > -1) {
      doubt.upvotes.splice(index, 1); // toggle: remove upvote
    } else {
      doubt.upvotes.push(studentId); // toggle: add upvote
    }

    await doubt.save();

    // Real-time socket notification
    const io = req.app.get("io");
    if (io) {
      io.to(doubt.sessionId.toString()).emit("doubtUpvoted", doubt);
    }

    res.json(doubt);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid doubt ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDoubt, getSessionDoubts, resolveDoubt, upvoteDoubt };
