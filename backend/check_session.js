const mongoose = require("mongoose");
require("dotenv").config();

const checkSession = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/classpulse");
    const Session = require("./src/models/Session");
    const session = await Session.findOne({ status: "active" }).sort({ createdAt: -1 });
    
    if (!session) {
      console.log("No active session found.");
      return;
    }

    console.log("Found Active Session:");
    console.log(`- Subject: ${session.subject}`);
    console.log(`- Coordinates: Lat ${session.location.latitude}, Lng ${session.location.longitude}`);
    console.log(`- Radius: ${session.attendanceRadius} meters`);

    const studentLat = 12.317584;
    const studentLng = 76.613983;

    // Calculate Haversine distance
    const haversineDistance = require("./src/utils/haversine");
    const distance = haversineDistance(
      session.location.latitude,
      session.location.longitude,
      studentLat,
      studentLng
    );

    console.log(`\nComparison with Student Location (12.317584, 76.613983):`);
    console.log(`- Distance: ${distance.toFixed(2)} meters`);
    console.log(`- Inside radius? ${distance <= session.attendanceRadius ? "YES" : "NO"}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
};

checkSession();
