const express = require('express');
const router = express.Router();

const Message = require('../models/Messages');
const Chat = require('../models/Chats');
const User = require('../models/Users');

const isAuthenticated = require('../controller/isAuthenticated');

router.get('/', isAuthenticated, async(req, res)=>{
    const {chatId} = req.query;
    if(!chatId) return res.status(400).json({err: 'ChatId is required'});
    try {
        const chat = await Chat.findOne({'connectedUsers._id': chatId, 'user': req.user._id});
        if(!chat) return res.status(400).json({err: 'Chat not found'});

        const name = chat.connectedUsers.find(user=>user._id.toString() === chatId.toString()).name;

        const Messages = await Message.find({chatId}).sort({lastTime: 1});

        return res.status(200).json({name, Messages});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server error'});
    }
});

module.exports = router;