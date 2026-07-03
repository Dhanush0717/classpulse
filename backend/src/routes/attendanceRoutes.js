const express = require("express");
const {
  markAttendance,
  getDashboard,
  getHistory,
  getSessionAttendance,
  getTeacherShortageRoster,
  markManualAttendance
} = require("../controllers/attendanceController");
const protect = require("../middleware/authMiddleware");
const protectStudent = require("../middleware/studentAuthMiddleware");

const router = express.Router();

router.post("/mark", protectStudent, markAttendance);
router.post("/manual", protect, markManualAttendance);
router.get("/dashboard", protect, getDashboard);
router.get("/history", protect, getHistory);
router.get("/shortages", protect, getTeacherShortageRoster);
router.get("/session/:sessionId", protect, getSessionAttendance);

module.exports = router;
