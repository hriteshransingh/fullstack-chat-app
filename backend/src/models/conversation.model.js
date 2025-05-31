import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    _id: String, // userA_userB
    participants: [String],
    encryptedKeys: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
