import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import mongoose from "mongoose";


// ===============================
// Send Message
// ===============================
export const sendMessage = async (req, res, io) => {
  try {
    const { venueId, recipientId, text } = req.body;
    const senderId = req.userId || req.body.senderId;

    if (!venueId || !recipientId || !text) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(venueId) ||
      !mongoose.Types.ObjectId.isValid(recipientId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const message = await Message.create({
      venue: venueId,
      sender: senderId,
      recipient: recipientId,
      text
    });

    // Create notification
    await Notification.createNotification(
      recipientId,
      "GENERAL",
      "New message",
      text,
      { venueId, messageId: message._id }
    );

    // Realtime socket event
    if (io) {
      io.to(recipientId.toString()).emit("newMessage", { message });
      io.to(senderId.toString()).emit("messageSent", { message });
    }

    return res.json({
      success: true,
      message
    });

  } catch (err) {
    console.error("sendMessage error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ===============================
// Get Conversation Between Users
// ===============================
export const getConversation = async (req, res) => {
  try {

    const { venueId, otherUserId } = req.query;
    const userId = req.userId;

    if (!venueId || !otherUserId) {
      return res.status(400).json({
        success: false,
        message: "venueId and otherUserId required"
      });
    }

    const messages = await Message.find({
      venue: venueId,
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("recipient", "name email");

    return res.json({
      success: true,
      messages
    });

  } catch (err) {
    console.error("getConversation error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// ===============================
// Get Venue Conversations
// ===============================
export const getVenueConversations = async (req, res) => {
  try {

    const { venueId } = req.query;
    const userId = req.userId;

    if (!venueId) {
      return res.status(400).json({
        success: false,
        message: "Missing venueId"
      });
    }

    const messages = await Message.find({
      venue: venueId,
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    }).sort({ createdAt: -1 });

    const conversationMap = new Map();

    for (const message of messages) {

      const partnerId =
        message.sender.toString() === userId.toString()
          ? message.recipient
          : message.sender;

      const key = partnerId.toString();

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          userId: partnerId,
          lastMessage: message,
          messageCount: 0
        });
      }

      conversationMap.get(key).messageCount++;
    }

    const conversations = [];

    for (const [partnerId, conv] of conversationMap) {

      const user = await User.findById(partnerId).select("name email");

      if (user) {
        conversations.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          lastMessage: conv.lastMessage,
          messageCount: conv.messageCount,
          lastMessageTime: conv.lastMessage.createdAt
        });
      }
    }

    conversations.sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    return res.json({
      success: true,
      conversations
    });

  } catch (err) {

    console.error("getVenueConversations error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};