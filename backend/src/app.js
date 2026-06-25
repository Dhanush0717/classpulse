const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const doubtRoutes = require("./routes/doubtRoutes");
const notesRoutes = require("./routes/notesRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "ClassPulse API Running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/doubt", doubtRoutes);
app.use("/api/notes", notesRoutes);

module.exports = app;
