const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User')

module.exports = async function (req, res, next) {
    //Get token from the header
    const token = req.header('x-auth-token');

    //Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    //Verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;

        //Check if user still exist in db
        const user = await User.findOne({ _id: decoded.user.id })
        if (!user) {
            return res.status(401).json({ msg: 'Token is not valid.' });
        }
        next();
    } catch (error) {
        console.error(error.messsage);
        res.status(401).json({ msg: 'Token is not valid.' });
    }
}