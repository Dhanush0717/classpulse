const express = require("express");
const multer = require("multer");
const { uploadNote, getSessionNotes } = require("../controllers/notesController");
const protectTeacher = require("../middleware/authMiddleware");
const protectStudent = require("../middleware/studentAuthMiddleware");

// Configure multer storage in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

const router = express.Router();

// Route for teacher to upload notes
router.post("/:sessionId/upload", protectTeacher, upload.single("file"), uploadNote);

// Route for students or teachers to get session notes
// Note: we can allow either student or teacher by trying to authenticate.
// We can use a custom middleware or just allow studentAuthMiddleware which covers student token,
// but wait, can the teacher also get it? Yes, we can allow either. Let's make it so student token is checked first,
// but to keep it simple we can just check if authorization header matches either student or teacher.
// Or we can just use a helper middleware or allow any valid token.
// Let's create a combined middleware or just let protectStudent protect it, or write a simple token check middleware.
// Actually, since students view notes and they have student session tokens, using protectStudent is perfect!
// Let's also check if we can make a middleware that permits both.
// Let's write a simple authentication middleware that permits either student or teacher.
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

router.get("/session/:sessionId", protectAny, getSessionNotes);

module.exports = router;
