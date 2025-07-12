const express = require('express');
const router = express.Router();

const User = require('../models/Users');
const Chat = require('../models/Chats');
const Message = require('../models/Messages');

const isAuthenticated = require('../controller/isAuthenticated');

router.post('/', isAuthenticated, async(req, res)=>{
    const {email} = req.body;

    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({err: 'User not found'});

        const userId = user._id;

        const ChatExist = await Chat.findOne({user: req.user._id});
        

        if(ChatExist){
            const userExist = ChatExist.connectedUsers.find(user => user.user == userId);
        if(userExist) return res.status(400).json({err: 'User already added'});
        }

        let newConnectedUser = await Chat.findOneAndUpdate({user: req.user._id}, {
            $push: {
                connectedUsers: {
                    user: userId,
                    lastMessage: '',
                    name: user.name
                }
            }
        }, {new: true});

        if(!newConnectedUser){
            newConnectedUser = new Chat({
                        user: req.user._id,
                        connectedUsers: [
                            {
                                user: userId,
                                lastMessage: '',
                                name: user.name
                            }
                        ]
                    });
        }

        await newConnectedUser.save();

        const addUser = newConnectedUser.connectedUsers.find(user => user.user.toString() === userId.toString());

        let newConnectedUserChat = await Chat.findOneAndUpdate({user: userId}, {
            $push: {
                connectedUsers: {
                    user: req.user._id,
                    lastMessage: '',
                    name: req.user.name,
                    _id: addUser ? addUser._id : undefined
                }
            }
        }, {new: true});

        if(!newConnectedUserChat){
            newConnectedUserChat = new Chat({
                user: userId,
                connectedUsers: [
                    {
                        user: req.user._id,
                        lastMessage: '',
                        name: req.user.name,
                        _id: addUser ? addUser._id : undefined
                    }
                ]
            });
        }

        await newConnectedUserChat.save();
        return res.status(200).json({msg: 'User added to chat'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
})

module.exports = router;