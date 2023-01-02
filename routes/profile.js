const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

require("dotenv").config();

const db = require('../models');
const User = db.User;

router.get('/:uuid', async (req, res) => {
	// Fetch the user's profile data from the database using the UUID from the URL
	const user = await User.findOne({ where: { uuid: req.params.uuid } });
  
	// Render the profile page and pass the user data to the template
	res.render('profile', { user: user });
  });