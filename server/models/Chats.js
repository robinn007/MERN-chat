const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    connectedUsers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            lastMessage: String,
            lastTime: Date,
            name: String
        }
    ]
});

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;