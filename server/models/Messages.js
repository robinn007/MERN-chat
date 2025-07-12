const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recieverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: String,
    },
    fileName:{
        type: String,
    },
    fileData:{
        type: String,
    },
    lastTime: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;