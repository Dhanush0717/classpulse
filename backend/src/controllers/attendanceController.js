const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const Student = require("../models/Student");
const haversineDistance = require("../utils/haversine");

const markAttendance = async (req, res) => {
  try {
    const { otp, latitude, longitude, accuracy, deviceId } = req.body;

    const session = await Session.findOne({
      _id: req.student.sessionId,
      status: "active"
    });
    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }

    const student = await Student.findOne({
      _id: req.student.id,
      sessionId: session._id
    });
    if (!student) {
      return res.status(404).json({
        message: "Student is not registered for this session"
      });
    }

    const existingAttendance = await Attendance.findOne({
      sessionId: session._id,
      studentId: student._id
    });
    if (existingAttendance) {
      return res.status(409).json({ message: "Attendance already marked" });
    }

    if (deviceId && deviceId !== "unknown") {
      const deviceAttendance = await Attendance.findOne({
        sessionId: session._id,
        deviceId: deviceId
      });
      if (deviceAttendance) {
        return res.status(400).json({
          message: "Attendance has already been marked from this device for this session"
        });
      }
    }

    if (new Date() > session.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (student.otpAttempts >= 2) {
      return res.status(429).json({ message: "OTP retry limit reached" });
    }

    if (session.otp !== String(otp)) {
      student.otpAttempts += 1;
      await student.save();
      return res.status(400).json({
        message: "Invalid OTP",
        retriesRemaining: Math.max(0, 2 - student.otpAttempts)
      });
    }

    const coordinates = [
      session.location.latitude,
      session.location.longitude,
      Number(latitude),
      Number(longitude)
    ];
    if (!coordinates.every(Number.isFinite)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required"
      });
    }

    let distance = haversineDistance(...coordinates);
    
    // Dynamically calculate allowed radius including device location accuracies
    const teacherAccuracy = session.location.accuracy || 0;
    const studentAccuracy = Number(accuracy) || 0;
    const allowedRadius = session.attendanceRadius + teacherAccuracy + studentAccuracy;

    if (distance > allowedRadius) {
      return res.status(400).json({
        message: `Outside attendance area. Measured distance: ${Math.round(distance)}m. Allowed limit (including accuracy margin of error): ${Math.round(allowedRadius)}m.`,
        distance
      });
    }

    const attendance = await Attendance.create({
      sessionId: session._id,
      studentId: student._id,
      distance,
      status: "present",
      deviceId: deviceId || "unknown"
    });

    // Populate student info for frontend list
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("studentId", "name usn")
      .select("studentId status distance markedAt");

    // Calculate updated cumulative rate for this student
    const allInstances = await Student.find({ usn: student.usn }).select("_id");
    const ids = allInstances.map(i => i._id);
    const presentCount = await Attendance.countDocuments({ studentId: { $in: ids } });
    const joinedCount = allInstances.length;
    const rate = joinedCount > 0 ? Math.round((presentCount / joinedCount) * 100) : 100;

    const populatedAttendanceObj = populatedAttendance.toObject();
    if (populatedAttendanceObj.studentId) {
      populatedAttendanceObj.studentId.cumulativeRate = rate;
      populatedAttendanceObj.studentId.isShortage = rate < 75;
    }

    // Notify room via socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(session._id.toString()).emit("attendanceMarked", populatedAttendanceObj);
    }

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Attendance already marked" });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

const getSessionSummaries = (teacherId, filters, limit, skip) =>
  Session.aggregate([
    {
      $match: {
        teacherId: new mongoose.Types.ObjectId(teacherId),
        ...filters
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "sessionId",
        as: "students"
      }
    },
    {
      $lookup: {
        from: "attendances",
        localField: "_id",
        foreignField: "sessionId",
        as: "attendance"
      }
    },
    {
      $project: {
        subject: 1,
        classCode: 1,
        status: 1,
        createdAt: 1,
        endedAt: 1,
        joinedCount: { $size: "$students" },
        presentCount: { $size: "$attendance" },
        attendancePercentage: {
          $cond: [
            { $gt: [{ $size: "$students" }, 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $size: "$attendance" },
                        { $size: "$students" }
                      ]
                    },
                    100
                  ]
                },
                1
              ]
            },
            0
          ]
        }
      }
    }
  ]);

const getDashboard = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const [totals] = await Session.aggregate([
      { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "sessionId",
          as: "attendance"
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          totalAttendance: { $sum: { $size: "$attendance" } }
        }
      },
      { $project: { _id: 0 } }
    ]);
    const recentSessions = await getSessionSummaries(teacherId, {}, 5, 0);

    res.json({
      totals: totals || {
        totalSessions: 0,
        activeSessions: 0,
        totalAttendance: 0
      },
      recentSessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );
    const filters = {};

    if (["active", "ended"].includes(req.query.status)) {
      filters.status = req.query.status;
    }
    if (req.query.subject) {
      filters.subject = { $regex: req.query.subject, $options: "i" };
    }

    const teacherId = req.teacher.id;
    const [sessions, total] = await Promise.all([
      getSessionSummaries(teacherId, filters, limit, (page - 1) * limit),
      Session.countDocuments({ teacherId, ...filters })
    ]);

    res.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionAttendance = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      teacherId: req.teacher.id
    }).select("subject classCode otp otpExpiresAt status createdAt endedAt");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const [records, rawJoinedStudents] = await Promise.all([
      Attendance.find({ sessionId: session._id })
        .populate("studentId", "name usn")
        .select("studentId status distance markedAt")
        .sort({ markedAt: 1 }),
      Student.find({ sessionId: session._id })
        .select("name usn joinedAt")
        .sort({ name: 1 })
    ]);

    const joinedStudents = await Promise.all(rawJoinedStudents.map(async (stud) => {
      const allInstances = await Student.find({ usn: stud.usn }).select("_id");
      const ids = allInstances.map(i => i._id);
      const presentCount = await Attendance.countDocuments({ studentId: { $in: ids } });
      const joinedCount = allInstances.length;
      const rate = joinedCount > 0 ? Math.round((presentCount / joinedCount) * 100) : 100;
      
      return {
        _id: stud._id,
        name: stud.name,
        usn: stud.usn,
        joinedAt: stud.joinedAt,
        cumulativeRate: rate,
        isShortage: rate < 75
      };
    }));

    res.json({
      session,
      count: records.length,
      attendance: records,
      joinedStudents
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

const getTeacherShortageRoster = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const sessions = await Session.find({ teacherId }).select("_id");
    const sessionIds = sessions.map(s => s._id);

    const students = await Student.find({ sessionId: { $in: sessionIds } });
    
    const usnMap = new Map();
    for (const student of students) {
      if (!usnMap.has(student.usn)) {
        usnMap.set(student.usn, {
          name: student.name,
          usn: student.usn
        });
      }
    }

    const shortageList = [];
    for (const [usn, data] of usnMap.entries()) {
      const allInstances = await Student.find({ usn }).select("_id");
      const ids = allInstances.map(i => i._id);
      const presentCount = await Attendance.countDocuments({ studentId: { $in: ids } });
      const joinedCount = allInstances.length;
      const rate = joinedCount > 0 ? Math.round((presentCount / joinedCount) * 100) : 100;

      if (rate < 75) {
        shortageList.push({
          name: data.name,
          usn: usn,
          cumulativeRate: rate,
          totalJoined: joinedCount,
          totalPresent: presentCount
        });
      }
    }

    res.json(shortageList.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markManualAttendance = async (req, res) => {
  try {
    const { name, usn, sessionId, studentId } = req.body;
    
    let student;
    if (studentId) {
      student = await Student.findById(studentId);
    } else {
      if (!name?.trim() || !usn?.trim() || !sessionId) {
        return res.status(400).json({ message: "Name, USN and sessionId are required" });
      }
      const normalizedUsn = usn.trim().toUpperCase();
      const normalizedName = name.trim();
      
      // Find or create student for this session
      student = await Student.findOne({ sessionId, usn: normalizedUsn });
      if (!student) {
        student = await Student.create({
          name: normalizedName,
          usn: normalizedUsn,
          sessionId
        });
        
        // Notify socket of join
        const io = req.app.get("io");
        if (io) {
          const allInstances = await Student.find({ usn: student.usn }).select("_id");
          const ids = allInstances.map(i => i._id);
          const presentCount = await Attendance.countDocuments({ studentId: { $in: ids } });
          const joinedCount = allInstances.length;
          const rate = joinedCount > 0 ? Math.round((presentCount / joinedCount) * 100) : 100;
          
          io.to(sessionId.toString()).emit("studentJoined", {
            _id: student._id,
            name: student.name,
            usn: student.usn,
            joinedAt: student.joinedAt,
            cumulativeRate: rate,
            isShortage: rate < 75
          });
        }
      }
    }
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Check if attendance already marked
    const targetSessionId = student.sessionId || sessionId;
    const existing = await Attendance.findOne({ sessionId: targetSessionId, studentId: student._id });
    if (existing) {
      return res.status(409).json({ message: "Attendance already marked for this student" });
    }
    
    const attendance = await Attendance.create({
      sessionId: targetSessionId,
      studentId: student._id,
      distance: 0,
      status: "present",
      deviceId: "manual_teacher"
    });
    
    // Populate and emit to socket.io
    const populated = await Attendance.findById(attendance._id)
      .populate("studentId", "name usn")
      .select("studentId status distance markedAt");
      
    const allInstances = await Student.find({ usn: student.usn }).select("_id");
    const ids = allInstances.map(i => i._id);
    const presentCount = await Attendance.countDocuments({ studentId: { $in: ids } });
    const joinedCount = allInstances.length;
    const rate = joinedCount > 0 ? Math.round((presentCount / joinedCount) * 100) : 100;
    
    const populatedObj = populated.toObject();
    if (populatedObj.studentId) {
      populatedObj.studentId.cumulativeRate = rate;
      populatedObj.studentId.isShortage = rate < 75;
    }
    
    const io = req.app.get("io");
    if (io) {
      io.to(targetSessionId.toString()).emit("attendanceMarked", populatedObj);
    }
    
    res.status(201).json({
      message: "Attendance marked manually",
      attendance: populatedObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance,
  getDashboard,
  getHistory,
  getSessionAttendance,
  getTeacherShortageRoster,
  markManualAttendance
};
