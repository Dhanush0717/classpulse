const express = require("express");
const { createDoubt, getSessionDoubts, resolveDoubt, upvoteDoubt } = require("../controllers/doubtController");
const protectTeacher = require("../middleware/authMiddleware");
const protectStudent = require("../middleware/studentAuthMiddleware");

const protectAny = (req, res, next) => {
  const jwt = require("jsonwebtoken");
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access token required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "teacher") {
      req.teacher = decoded;
    } else if (decoded.role === "student") {
      req.student = decoded;
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const router = express.Router();

router.post("/", protectStudent, createDoubt);
router.get("/session/:sessionId", protectAny, getSessionDoubts);
router.patch("/:doubtId/resolve", protectTeacher, resolveDoubt);
router.post("/:doubtId/upvote", protectStudent, upvoteDoubt);

module.exports = router;
