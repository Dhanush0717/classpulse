const express = require("express");
const router = express.Router();

const { joinSession, getStudentStatus } = require("../controllers/studentController");
const protectStudent = require("../middleware/studentAuthMiddleware");

router.post("/join", joinSession);
router.get("/status", protectStudent, getStudentStatus);

module.exports = router;