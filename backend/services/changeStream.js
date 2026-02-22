import mongoose from "mongoose";
import User from "../models/userModel.js";
import { getIO } from "../config/socket.js";

let changeStream;

export const startUserChangeStream = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.serverStatus();

    const isReplicaSet = !!status.repl;

    if (!isReplicaSet) {
      console.warn("Change Streams disabled: MongoDB is not a replica set.");
      return;
    }

    if (changeStream) await changeStream.close();

    changeStream = User.watch();

    changeStream.on("change", (change) => {
      const io = getIO();
      io.emit("userUpdated", change);
    });

    changeStream.on("error", (err) => {
      console.error("Change Stream Error:", err.message);
    });

    console.log("User Change Stream started");
  } catch (err) {
    console.error("Failed to initialize Change Stream:", err.message);
  }
};

export const stopChangeStream = async () => {
  if (changeStream) {
    await changeStream.close();
    console.log("Change Stream closed");
  }
};
