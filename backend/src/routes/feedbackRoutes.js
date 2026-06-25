const express = require("express");
const {
  submitFeedback,
  getMyFeedback,
  getSessionFeedback
} = require("../controllers/feedbackController");
const protectTeacher = require("../middleware/authMiddleware");
const protectStudent = require("../middleware/studentAuthMiddleware");

const router = express.Router();

router.post("/", protectStudent, submitFeedback);
router.get("/me", protectStudent, getMyFeedback);
router.get("/session/:sessionId", protectTeacher, getSessionFeedback);

module.exports = router;
