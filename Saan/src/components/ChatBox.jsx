import React, { useEffect, useState, useRef } from 'react';
import { chatAPI, socket } from '../services/api';
import { FaPaperPlane, FaComments, FaBell } from 'react-icons/fa';

const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    return null;
  }
};

export default function ChatBox({ venueId, otherUserId, title = "Chat", autoOpen = false }) {
  const token = localStorage.getItem('token');
  const decoded = decodeToken(token);
  const userId = decoded?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token || !userId) return;
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('register', userId);

    const handleNewMessage = ({ message }) => {
      // Only push messages related to this venue and conversation
      if (!message) return;
      if (message.venue === venueId || (message.venue && message.venue.toString() === venueId.toString())) {
        // Check if it's between current user and otherUserId
        const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
        const recipientId = typeof message.recipient === 'object' ? message.recipient._id : message.recipient;
        const isRelevant = (senderId === userId && recipientId === otherUserId) ||
                          (senderId === otherUserId && recipientId === userId);
        if (isRelevant) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
          if (!open) {
            setHasNewMessage(true);
            // Play notification sound
            const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
            audio.play().catch(() => {}); // Ignore errors if audio fails
          }
        }
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleNewMessage);

    // Typing indicators
    socket.on('userTyping', ({ userId: typingUserId }) => {
      if (typingUserId === otherUserId) {
        setIsTyping(true);
      }
    });

    socket.on('userStopTyping', ({ userId: typingUserId }) => {
      if (typingUserId === otherUserId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSent', handleNewMessage);
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [token, userId, venueId, otherUserId, open]);

  useEffect(() => {
    if (!token || !userId) return;
    // Load conversation
    const load = async () => {
      const res = await chatAPI.getConversation(token, venueId, otherUserId);
      if (res && res.success) setMessages(res.messages || []);
    };
    load();
  }, [venueId, otherUserId]);

  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
      setHasNewMessage(false);
    }
  }, [autoOpen]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    
    // Emit typing indicator
    if (socket.connected && e.target.value.trim()) {
      socket.emit('typing', { recipientId: otherUserId });
    } else {
      socket.emit('stopTyping', { recipientId: otherUserId });
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!token) return alert('Please login to send messages');

    // Stop typing indicator
    socket.emit('stopTyping', { recipientId: otherUserId });

    const payload = { venueId, recipientId: otherUserId, text: text.trim() };
    const res = await chatAPI.sendMessage(token, payload);
    if (res && res.success) {
      // Don't add here, socket will handle
      setText('');
    } else {
      console.error('Failed to send message', res);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setHasNewMessage(false);
  };

  return (
    <div>
      {/* Floating chat icon */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          onClick={handleOpen}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-purple-800 to-[#c99b1a] text-white shadow-2xl flex items-center justify-center hover:from-purple-900 hover:to-[#b58810] transition-all duration-300 transform hover:scale-105"
          title={title}
        >
          <FaComments className="text-xl" />
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <FaBell className="text-xs text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div className="fixed right-6 bottom-24 w-[500px] h-[600px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-800 to-[#c99b1a] text-white rounded-t-2xl font-semibold flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FaComments className="text-sm" />
              </div>
              <span className="text-lg">{title}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:text-gray-200 text-xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComments className="text-2xl text-gray-400" />
                </div>
                <div className="text-lg font-medium mb-2">No messages yet</div>
                <div className="text-sm">Start a conversation! 👋</div>
              </div>
            )}
            {messages.map(msg => {
              const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
              return (
                <div key={msg._id} className={`flex ${senderId === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                    senderId === userId
                      ? 'bg-gradient-to-r from-purple-800 to-[#c99b1a] text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <div className="text-sm leading-relaxed">{msg.text}</div>
                    <div className={`text-xs mt-2 ${
                      senderId === userId ? 'text-gray-200' : 'text-gray-400'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm max-w-[75%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white flex gap-3">
            <input
              value={text}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-800 focus:border-transparent transition-all"
              placeholder="Type your message..."
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="bg-gradient-to-r from-purple-800 to-[#c99b1a] text-white px-6 py-3 rounded-full hover:from-purple-900 hover:to-[#b58810] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
