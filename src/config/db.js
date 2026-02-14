const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB connection lost.");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB connection has been re-established.");
});

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed due to application termination.");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
    process.exit(1);
  }
});

module.exports = connectDB;
