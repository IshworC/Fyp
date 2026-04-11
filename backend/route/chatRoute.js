import express from "express";
import { authenticate } from "../middleware/auth.js";
import * as chatController from "../controller/chatController.js";

const createChatRouter = (io) => {
  const router = express.Router();

  // Send message
  router.post("/message", authenticate, async (req, res) => {
    try {
      return await chatController.sendMessage(req, res, io);
    } catch (error) {
      console.error("Send message route error:", error);
      res.status(500).json({
        success: false,
        message: "Error sending message"
      });
    }
  });

  // Get conversation between users
  router.get("/messages", authenticate, async (req, res) => {
    return chatController.getConversation(req, res);
  });

  // Get all conversations for venue owner
  router.get("/venue-conversations", authenticate, async (req, res) => {
    return chatController.getVenueConversations(req, res);
  });

  return router;
};

export default createChatRouter;