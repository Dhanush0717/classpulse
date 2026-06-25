const express = require("express");
const { createSession, endSession } = require("../controllers/sessionController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", protect, createSession);
router.patch("/:sessionId/end", protect, endSession);

module.exports = router;
