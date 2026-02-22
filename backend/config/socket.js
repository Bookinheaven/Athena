import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
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