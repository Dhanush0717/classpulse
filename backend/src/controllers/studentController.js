const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");

const createStudentToken = (student, session) =>
  jwt.sign(
    {
      id: student._id,
      sessionId: session._id,
      role: "student"
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

const joinSession = async (req, res) => {
  try {
    const { name, usn, classCode } = req.body;
    if (!name?.trim() || !usn?.trim() || !classCode?.trim()) {
      return res.status(400).json({
        message: "Name, USN and class code are required"
      });
    }

    const session = await Session.findOne({
      classCode: classCode.trim().toUpperCase(),
      status: "active"
    });
    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }

    const normalizedUsn = usn.trim().toUpperCase();
    const normalizedName = name.trim();
    let student = await Student.findOne({
      sessionId: session._id,
      usn: normalizedUsn
    });

    if (student) {
      if (student.name.trim().toLowerCase() !== normalizedName.toLowerCase()) {
        return res.status(409).json({
          message: "This USN is already registered for the session"
        });
      }

      return res.json({
        message: "Session access restored",
        accessToken: createStudentToken(student, session),
        student
      });
    }

    student = await Student.create({
      name: normalizedName,
      usn: normalizedUsn,
      sessionId: session._id
    });

    // Notify room via socket.io
    const io = req.app.get("io");
    if (io) {
      const allInstances = await Student.find({ usn: student.usn }).select("_id");
      const ids = allInstances.map(i => i._id);
      const presentCount = await Attendance.countDocuments({ studentId: { $in: ids } });
      const joinedCount = allInstances.length;
      const rate = joinedCount > 0 ? Math.round((presentCount / joinedCount) * 100) : 100;

      const studentData = {
        _id: student._id,
        name: student.name,
        usn: student.usn,
        joinedAt: student.joinedAt,
        cumulativeRate: rate,
        isShortage: rate < 75
      };
      io.to(session._id.toString()).emit("studentJoined", studentData);
    }

    res.status(201).json({
      message: "Joined successfully",
      accessToken: createStudentToken(student, session),
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Student already joined this session"
      });
    }
    res.status(500).json({ message: error.message });
  }
};

const getStudentStatus = async (req, res) => {
  try {
    const crypto = require("crypto");
    const Attendance = require("../models/Attendance");
    const Feedback = require("../models/Feedback");

    const student = await Student.findOne({
      _id: req.student.id,
      sessionId: req.student.sessionId
    });
    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const session = await Session.findById(req.student.sessionId).select(
      "subject classCode status location attendanceRadius otpExpiresAt"
    );
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const attendance = await Attendance.findOne({
      sessionId: session._id,
      studentId: student._id
    });

    const respondentKey = crypto
      .createHmac("sha256", process.env.ANONYMITY_SECRET || process.env.JWT_SECRET)
      .update(`${session._id}:${student._id}`)
      .digest("hex");

    const feedback = await Feedback.findOne({
      sessionId: session._id,
      respondentKey
    }).select("pace understanding comment");

    // Calculate cumulative attendance percentage for student shortage checks
    const allStudentInstances = await Student.find({ usn: student.usn }).select("_id");
    const instanceIds = allStudentInstances.map(s => s._id);

    const [totalJoinedSessions, totalPresentSessions] = await Promise.all([
      Student.countDocuments({ usn: student.usn }),
      Attendance.countDocuments({ studentId: { $in: instanceIds } })
    ]);

    const cumulativeRate = totalJoinedSessions > 0 
      ? Math.round((totalPresentSessions / totalJoinedSessions) * 100) 
      : 100;

    res.json({
      student: {
        id: student._id,
        name: student.name,
        usn: student.usn,
        otpAttempts: student.otpAttempts
      },
      session,
      attendanceMarked: !!attendance,
      attendanceDetails: attendance ? { markedAt: attendance.markedAt, distance: attendance.distance } : null,
      feedback: feedback ? { pace: feedback.pace, understanding: feedback.understanding, comment: feedback.comment } : null,
      cumulativeAttendance: {
        totalJoined: totalJoinedSessions,
        totalPresent: totalPresentSessions,
        rate: cumulativeRate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { joinSession, getStudentStatus };
