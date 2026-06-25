const Note = require("../models/Note");
const Session = require("../models/Session");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary conditionally
const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn("⚠️ Cloudinary API keys missing from .env. Uploads will run in mock mode.");
}

const uploadNote = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const session = await Session.findOne({
      _id: sessionId,
      teacherId: req.teacher.id
    });
    if (!session) {
      return res.status(404).json({ message: "Lecture session not found" });
    }

    let fileUrl = "";
    let publicId = "";

    if (isCloudinaryConfigured()) {
      // Cloudinary stream upload
      const uploadFromBuffer = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: "classpulse_notes",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(buffer);
        });
      };

      const result = await uploadFromBuffer(req.file.buffer);
      fileUrl = result.secure_url;
      publicId = result.public_id;
    } else {
      // Mock mode fallback
      console.log(`[MOCK UPLOAD] Mocking upload for note: ${req.file.originalname}`);
      fileUrl = `https://res.cloudinary.com/demo/image/upload/v1570975859/sample.jpg`;
      publicId = `mock_public_id_${Date.now()}`;
    }

    const note = await Note.create({
      sessionId: session._id,
      title: title || req.file.originalname,
      fileUrl,
      cloudinaryPublicId: publicId
    });

    // Notify session room
    const io = req.app.get("io");
    if (io) {
      io.to(session._id.toString()).emit("newNote", note);
    }

    res.status(201).json({
      message: "Notes uploaded successfully",
      note
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionNotes = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if session exists (accessible by student token or teacher token)
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const notes = await Note.find({ sessionId: session._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadNote, getSessionNotes };
