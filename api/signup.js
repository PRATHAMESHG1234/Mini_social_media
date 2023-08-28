const express = require('express');

const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');
const NotificationModel = require('../models/NotificationModel');
const UserModel = require('../models/UserModel');
const ProfileModel = require('../models/ProfileModel');
const FollowerModel = require('../models/FollowerModel');
const ChatModel = require('../models/ChatModel');
const userPng =
	'https://res.cloudinary.com/indersingh/image/upload/v1593464618/App/user_mklcpl.png';
const regexusername = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
router.get('/:username', async (req, res) => {
	const { username } = req.params;
	try {
		if (username.length < 1) {
			return res.status(401).send('Invalid');
		}
		if (!regexusername.test(username)) {
			return res.status(401).send('Invalid');
		}

		const user = await UserModel.findOne({ username: username.toLowerCase() });

		if (user) {
			return res.status(401).send('username already taken');
		}

		return res.status(200).send('Available');
	} catch (error) {
		console.error(error);
		return res.status(500).send('server error!');
	}
});

router.post('/', async (req, res) => {
	const {
		name,
		email,
		username,
		password,
		bio,
		facebook,
		youtube,
		twitter,
		instagram,
	} = req.body.user;

	if (!isEmail(email)) {
		return res.status(401).send('Invalid Email');
	}
	if (password.length < 6) {
		return res.status(401).send('Password must be at least 6 characters');
	}
	try {
		let user;
		user = await UserModel.findOne({ email: email.toLowerCase() });

		if (user) {
			return res.status(401).send('Email already registered');
		}

		user = new UserModel({
			name,
			email: email.toLowerCase(),
			username: username.toLowerCase(),
			password,
			profilePicUrl: req.body.profilePicUrl || userPng,
		});

		user.password = await bcrypt.hash(password, 10);
		await user.save();

		let profilFields = {};
		profilFields.user = user._id;
		profilFields.bio = bio;
		profilFields.social = {};

		if (facebook) {
			profilFields.social.facebook = facebook;
		}
		if (twitter) {
			profilFields.social.twitter = twitter;
		}
		if (youtube) {
			profilFields.social.youtube = youtube;
		}
		if (instagram) {
			profilFields.social.instagram = instagram;
		}

		const profile = new ProfileModel(profilFields); // Create an instance of ProfileModel
		await profile.save();

		await new FollowerModel({
			user: user._id,
			followers: [],
			following: [],
		}).save();

		await new NotificationModel({
			user: user._id,
			notifications: [],
		}).save();
		await new ChatModel({
			user: user._id,
			chats: [],
		}).save();

		const payload = { userId: user._id };
		jwt.sign(
			payload,
			process.env.jwtSecret,
			{ expiresIn: '2d' },
			(err, token) => {
				if (err) {
					throw err;
				}
				res.status(200).json(token);
			},
		);
	} catch (error) {
		console.error(error);
		return res.status(500).send('server error!');
	}
});
module.exports = router;
