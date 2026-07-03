const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
{
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },

    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    status: {
        type: String,
        default: "present"
    },

    distance: {
        type: Number,
        required: true
    },

    markedAt: {
        type: Date,
        default: Date.now
    },

    deviceId: {
        type: String,
        default: "unknown"
    }
}, { timestamps: true });

attendanceSchema.index(
    { sessionId: 1, studentId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
