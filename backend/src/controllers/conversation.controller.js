import Conversation from "../models/conversation.model.js";

export const createConversation = async (req, res) => {
  const { conversationId, participants, encryptedKeys } = req.body; 

  try {
    let conversation = await Conversation.findById(conversationId);
    if (conversation) {
      return res.status(200).json({ message: "Conversation already exists" });
    }

    conversation = new Conversation({
      _id: conversationId,
      participants,
      encryptedKeys,
    });

    await conversation.save();
    res.status(201).json({ message: "Conversation created", conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserConversations = async (req, res) => {
  const userId = req.params.id;
  try {
    const conversations = await Conversation.find({ participants: userId });

    // Map only the encrypted key for the user + meta
    const result = conversations.map((conv) => ({
      conversationId: conv._id,
      encryptedKey: conv.encryptedKeys?.get(userId), // only return key for the user
      participants: conv.participants,
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations." });
  }
};
