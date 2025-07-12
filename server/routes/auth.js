const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const Users = require('../models/Users');


router.post('/signup', async(req, res)=>{
    const {name, email, password} = req.body;
    try {
        const userExist = await Users.findOne({email});
        if(userExist) return res.status(409).json({err: 'Email already exists'});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new Users({
            name,
            email,
            password: hashedPassword
        });
        await user.save();

        return res.status(200).json({msg: 'User created successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Something went wrong'});
    }
});

router.post('/login', async(req, res)=>{
    const {email, password} = req.body;
    try {
        const user = await Users.findOne({email});
        if(!user) return res.status(400).json({err: 'Invalid credentials'});

        const pass = await bcrypt.compare(password, user.password);
        if(!pass) return res.status(400).json({err: 'Invalid credentials'});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

        return res.status(200).json({msg: 'Logged in successfully', token});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Something went wrong'});
    }
})

module.exports = router;