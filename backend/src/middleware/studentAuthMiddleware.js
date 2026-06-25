const jwt = require("jsonwebtoken");

const protectStudent = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Student token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student" || !decoded.id || !decoded.sessionId) {
      return res.status(403).json({ message: "Student access required" });
    }

    req.student = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired student token" });
  }
};

module.exports = protectStudent;
