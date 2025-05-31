import express from "express";
import {
  createConversation,
  getUserConversations,
} from "../controllers/conversation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, createConversation);
router.get("/user/:id", protectRoute, getUserConversations);

export default router;
