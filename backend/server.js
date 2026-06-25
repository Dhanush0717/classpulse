require("dotenv").config();

console.log("PORT =", process.env.PORT);
console.log("MONGO_URI =", process.env.MONGO_URI);

const app = require("./src/app");
const connectDB = require("./src/config/db");

const http = require("http");
const { Server } = require("socket.io");

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

// Attach socket.io instance to Express app
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("joinSession", (sessionId) => {
    if (sessionId) {
      socket.join(sessionId.toString());
      console.log(`🚪 Socket ${socket.id} joined session room: ${sessionId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});