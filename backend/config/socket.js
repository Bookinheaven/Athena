import { Server } from "socket.io";
import env from "./env.js";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: env.CLIENT_URL,
            credentials: true
        },
    })
    
    console.log("Socket.IO initialized");
    return io;
}

export const getIO = () => {
    if(!io) {
        throw new Error("Socket.IO not initialized")
    }
    return io;
}