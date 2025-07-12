const express = require('express');
const router = express.Router();

const Message = require('../models/Messages');
const User = require('../models/Users');

const isAuthenticated = require('../controller/isAuthenticated');
const sentMessage = require('../controller/sentMessage');

router.post('/', isAuthenticated ,async(req, res)=>{
    const {recieverId, message, chatId} = req.body;

    try {
        const senderId = req.user._id;

        const user = await User.findById(recieverId);
        if(!user) return res.status(400).json({err: 'User not found'});

        // const newMessage = new Message({
        //     chatId,
        //     senderId,
        //     recieverId,
        //     message
        // });
        // await newMessage.save();

        const sent = await sentMessage(chatId, senderId, recieverId, message);
        return res.status(200).json(sent);
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
})


module.exports = router;