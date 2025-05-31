import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({createdAt: 1});
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { cipherText, nonce, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "User not found" });

    if (!image && (!cipherText || !nonce)) {
      return res.json(400).json({
        message: "For text message: cipherText, nonce are required",
      });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      cipherText,
      nonce,
      image: imageUrl,
    });

    await newMessage.save();
    // Realtime functionality goes here => socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);

    // if user is online
    if (receiverSocketId) {
      //only  sending this message to the receiver specificly
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        senderPublicKey: sender.publicKey,
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller");
    res.status(500).json({ message: "Internal server Error" });
  }
};
