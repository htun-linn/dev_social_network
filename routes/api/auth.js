const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const config = require('config');

//@route GET api/auth
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ errors: [{ 'msg': 'Internal Server Error.' }] });
    }
});


// @route POST api/auth
// @desc Authenticate user & get token
// @access Public
router.post('/', [

    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter passowrd with 6 or more character').isLength({ min: 6 })

], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    try {
        //check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invalid Credentials.'
                }]
            });
        }
        //Chceck password correct existing token
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invalid Credentials.'
                }]
            });
        }

        //Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, config.get('jwtSecret'), {
            expiresIn: 360000
        }, (err, token) => {
            if (err) throw err;
            res.json({ token })
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }

})


module.exports = router;