const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/Users');
const Chat = require('../models/Chats');
const Message = require('../models/Messages');

const isAuthenticated = require('../controller/isAuthenticated');

router.get('/', isAuthenticated, async(req, res)=>{
    const user = req.user;

    try {
        const Chats = await Chat.find({user: user._id}).select('connectedUsers');
        return res.status(200).json({Chats: Chats});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
});



module.exports = router;