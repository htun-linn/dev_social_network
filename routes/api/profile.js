const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const config = require('config');
const request = require('request');

//@route    GET api/profile/me
//@desc     Get current users profile
//@access   Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),

]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    const profileField = {};
    profileField.user = req.user.id
    if (company) profileField.company = company;
    if (website) profileField.website = website;
    if (location) profileField.location = location;
    if (bio) profileField.bio = bio;
    if (status) profileField.status = status;
    if (githubusername) profileField.githubusername = githubusername;
    if (skills) {
        profileField.skills = skills.split(",").map(skill => skill.trim());
    }
    profileField.social = {};
    if (youtube) profileField.social.youtube = youtube;
    if (twitter) profileField.social.twitter = twitter;
    if (facebook) profileField.social.facebook = facebook;
    if (linkedin) profileField.social.linkedin = linkedin;
    if (instagram) profileField.social.instagram = instagram;


    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            //Update Profile
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileField }, { new: true })
            return res.json(profile);
        }

        //Create Profile
        profile = new Profile(profileField);
        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server Error');
    }

})


//@route    GET api/profile
//@desc     Get all profiles
//@access   Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})

//@route    GET api/profile/user/:user_id
//@desc     Get all profiles
//@access   Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])
        if (!profile) return res.status(400).json({ msg: 'There is no profile for this user' })
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.status(500).send('Server Error');
    }
})

//@route    DELETE api/profile
//@desc     Delete user profile, user & posts
//@access   Private
router.delete('/', auth, async (req, res) => {
    try {
        //Remove Profile
        await Profile.findOneAndDelete({ user: req.user.id })
        //Remove User
        await User.findOneAndDelete({ _id: req.user.id })

        res.json({ msg: 'User deleted' })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {
        title, company, location, from, to, current, description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };
    try {
        const profile = await Profile.findOne({ user: req.user.id },)
        profile.experiences.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error');
    }
})


//@route    DELETE /api/profile/experience/:exp_id
//@desc     Delete Experience from profile
//@access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experiences.map(item => item.id).indexOf(req.params.exp_id)
        profile.experiences.splice(removeIndex, 1);
        await profile.save();
        res.json(profile)
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
});


// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', [auth, [
    check('school', 'School name is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {
        school, degree, fieldofstudy, from, to, current, description
    } = req.body;

    const newEducation = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };
    try {
        const profile = await Profile.findOne({ user: req.user.id },)
        profile.education.unshift(newEducation);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error');
    }
})


//@route    DELETE /api/profile/education/:edu_id
//@desc     Delete Education from profile
//@access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile)
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
});

//@route    GET api/profile/github/:username
//@desc     Get user repo from Github
//@access   Public
router.get("/github/:username", async (req, res) => {
    try {
        const option = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };
        request(option, (error, response, body) => {
            if (error) console.log(error);
            if (response.statusCode != 200) {
                return res.status(404).json({ msg: 'No Github profile found.' });
            }
            res.json(JSON.parse(body));
        });

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


module.exports = router;