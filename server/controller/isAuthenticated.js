const jwt = require('jsonwebtoken');

const User = require('../models/Users');

async function isAuthenticated(req, res, next){
    const token = req.headers['authorization'];
    if(!token) return res.status(401).send('Access Denied');

    const isVerify = jwt.verify(token, process.env.JWT_SECRET);
    if(!isVerify) return res.status(401).send('Access Denied');

    try {
        const user = await User.findById(isVerify.id);
        if(!user) return res.status(401).send('Access Denied');
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
}

module.exports = isAuthenticated;