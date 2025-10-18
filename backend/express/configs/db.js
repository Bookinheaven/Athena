import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import User from '../models/userModel.js';

let io;
let changeStream;

export async function connectDB(app) {
  try {
    const server = http.createServer(app);
    io = new SocketIOServer(server);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Connected to Database');

    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB connection is not ready.');
      return;
    }

    mongoose.connection.on('disconnected', () => {
      console.error('MongoDB Disconnected! Reconnecting...');
      setTimeout(() => connectDB(app), 5000);
    });

    try {
      const adminDb = mongoose.connection.db.admin();
      const status = await adminDb.serverStatus();
      const isReplicaSet = status.repl !== undefined;

      if (isReplicaSet) {
        console.log('MongoDB is running as a replica set, enabling Change Streams.');
        startChangeStream();
      } else {
        console.warn('MongoDB is not running as a replica set, skipping Change Streams.');
      }
    } catch (err) {
      console.error('Error checking replica set status:', err.message);
    }
  } catch (error) {
    if (error.name === 'MongoNetworkError') {
      console.error('Database connection failed: Internet Not Found');
    } else {
      console.error('Database connection failed:', error.message);
    }
    setTimeout(() => connectDB(app), 5000);
  }
}

function startChangeStream() {
  if (changeStream) {
    changeStream.close();
  }

  changeStream = User.watch();

  changeStream.on('change', (change) => {
    io.emit('userUpdated', change);
  });

  changeStream.on('error', (err) => {
    console.error('Change Stream Error:', err.message);
    console.warn('Restarting Change Stream...');
    setTimeout(startChangeStream, 5000);
  });

  console.log('Change Stream started...');
}

process.on('SIGINT', async () => {
  console.log('Server shutting down...');
  if (changeStream) {
    await changeStream.close();
    console.log('Change Stream closed.');
  }
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});
