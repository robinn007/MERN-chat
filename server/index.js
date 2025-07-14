const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const {Server: SocketServer} = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

const sentMessage = require('./controller/sentMessage');
const Chat = require('./models/Chats');

const io = new SocketServer({
    cors: '*',
    maxHttpBufferSize: 1e8
})

io.attach(server);

const PORT = process.env.PORT || 5000;

require('./connection');

app.get('/', (req, res)=>{
    res.send('Hello World');
});

const users = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-chat', async({ chatId }) => {
        socket.join(chatId);
        // if(!users.has(chatId)){
        //     console.log('Setting new chat:', chatId);
        //     users.set(chatId, new Set([socket.id]));
        // } else{
        //     const existingUsers = Array.from(users.get(chatId))[0];
        //     console.log('Existing users:', existingUsers);
        //     users.get(chatId).add(socket.id);
        //     io.to(existingUsers).emit('user:connect', {socketId: socket.id});
        //     io.to(socket.id).emit('user:connect', {socketId: existingUsers});
        // }
        console.log('User joined chat:', chatId);
    });

    socket.on('leave-chat', ({ chatId }) => {
        socket.leave(chatId);
        console.log('User left chat:', chatId);
    });

    socket.on('send-message', async (data) => {
        const { recieverId, message, chatId, token, fileName, fileData } = data;

        try {
            // Verify JWT token to get senderId
            const isVerify = jwt.verify(token, process.env.JWT_SECRET);
            const senderId = isVerify.id;

            // Save message with optional file info

            io.to(chatId).emit('receive-message', {
                chatId,
                senderId,
                recieverId,
                message,
                fileName,
                fileData,  // Emit the raw buffer for real-time file handling on the client side
                lastTime: Date.now(),
            });

            
            await sentMessage(chatId, senderId, recieverId, message, fileName, fileData);

            // Emit message or file metadata to the chat room
        } catch (error) {
            console.log('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('user:call', ({ to, offer }) => {
        io.to(to).emit('incoming:call', { from: socket.id, offer });
      });
    
      socket.on('accept:call', ({ to, answer }) => {
        io.to(to).emit('call:accepted', { answer });
      });
    
      socket.on('ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('ice-candidate', { candidate });
      });
    
      socket.on('call:end', ({ to }) => {
        io.to(to).emit('call:ended');
      });
    
      socket.on('register', async(token) => {
        // Associate userId with socket.id
        // Store in a map or database as per your requirement
        const { id } = jwt.verify(token, process.env.JWT_SECRET);
        users.set(id, socket.id);
        console.log('User registered:', id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        users.forEach((value, key) => {
            if(value === socket.id){
                users.delete(key);
            }
        });
    });
});

app.get('/getSocketId', (req, res) => {
  const { userId } = req.query;
  const socketId = users.get(userId);
  if (socketId) {
    res.json({ socketId });
  } else {
    res.status(404).json({ error: 'User not connected' });
  }
});

app.use('/auth', require('./routes/auth'));
app.use('/chat', require('./routes/chatRoute'));
app.use('/add-user', require('./routes/addUser'));
app.use('/getmsg', require('./routes/getMsg'));
app.use('/sendmsg', require('./routes/sendmsg'));

server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})