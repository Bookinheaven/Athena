import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB already connected.");
    return;
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    })

    isConnected = true;

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      console.error("MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
      isConnected = true;
    })

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection falied: ", err.message)
    })

  } catch(error){
    console.error("MongoDB connection failed: ", error.message);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed.")
}