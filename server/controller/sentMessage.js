const Message = require('../models/Messages');

async function sentMessage(chatId, senderId, recieverId, message = null, fileName = null, fileData = null) {
    try {
        let newMessage;

        if (fileName && fileData) {
            // Convert file buffer to Base64 string
            const base64FileData = fileData.toString('base64');

            // Save the message with file info
            newMessage = new Message({
                chatId,
                senderId,
                recieverId,
                fileName,
                fileData: base64FileData  // Save Base64 string
            });
        } else {
            // Save text message only
            newMessage = new Message({
                chatId,
                senderId,
                recieverId,
                message
            });
        }

        await newMessage.save();
        return { msg: 'Message sent' };
    } catch (error) {
        console.log(error);
        return { err: 'Internal Server Error' };
    }
}

module.exports = sentMessage;