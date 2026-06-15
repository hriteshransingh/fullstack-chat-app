import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  // pass the userId of the user and get the socketId of that user
  return userSocketMap[userId];
}

// to store online users

const userSocketMap = {}; //{userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;
  //io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { senderId });
    }
  });

  socket.on("startVideoCall", ({ senderId, receiverId, callerName }) => {
    const receiverSocketId = userSocketMap[receiverId];

    io.to(receiverSocketId).emit("incomingVideoCall", { senderId, callerName });
  });
  socket.on("callAccepted", ({senderId})=>{
    const callerSocketId = userSocketMap[senderId];
    io.to(callerSocketId).emit("callAccepted", {senderId});
  })

  socket.on("rejectVideoCall", ({ callerId }) => {
   
    const callerSocketId = userSocketMap[callerId];
    io.to(callerSocketId).emit("callRejected", { callerId });
  });

  
  // WebRTC: Send offer to receiver
  socket.on("webrtc:offer", ({ offer, toUserId, fromUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc:offer", { 
        offer, 
        fromUserId 
      });
    } else {
      console.log("Receiver not found:", toUserId);
    }
  });

  // WebRTC: Send answer back to caller
  socket.on("webrtc:answer", ({ answer, toUserId }) => {
    const callerSocketId = userSocketMap[toUserId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("webrtc:answer", { answer });
    } else {
      console.log("Caller not found:", toUserId);
    }
  });

  // WebRTC: Relay ICE candidates between peers
  socket.on("webrtc:ice-candidate", ({ candidate, toUserId }) => {
   // console.log("ICE candidate relayed to:", toUserId);
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc:ice-candidate", { candidate });
    } else {
      console.log("ICE candidate receiver not found:", toUserId);
    }
  });

  // Handle call end notification
  socket.on("call:end", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ended");
    }
  });


  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };