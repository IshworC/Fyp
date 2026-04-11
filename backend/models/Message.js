import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
}, {
  timestamps: true
});

messageSchema.index({ venue: 1, sender: 1, recipient: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
