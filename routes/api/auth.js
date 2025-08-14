const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');

//@route GET api/route
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ errors: [{ 'msg': 'Internal Server Error.' }] });
    }
});

module.exports = router;