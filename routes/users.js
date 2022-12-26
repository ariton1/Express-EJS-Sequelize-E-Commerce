const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bip39 = require('bip39');
const { check, validationResult } = require('express-validator');
const attachUser = require('../middlewares/attachUser');

// Import the database models
const db = require('../models');
const Role = db.Role;
const User = db.User;

router.get('/register', (req, res) => {

	if (req.session.jwt) {
		// If the user is authenticated, redirect them to the home page
		return res.redirect('/');
	  }
	res.render('register', { flash: req.flash() });
  });

  router.post('/register', [
	// Validate the request body
	check('username', 'Username must be alphanumeric and have at least 5 characters').isAlphanumeric().isLength({ min: 5, max: 32 }),
	check('password', 'Password must have at least 8 characters and contain at least 1 uppercase character, 1 lowercase character, 1 number, and 1 symbol').isLength({ min: 8, max: 32 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/, "i"),
	check('confirmPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.password),
	check('phrase', 'Phrase must have at least 5 characters').isLength({ min: 5, max: 32 })
  ], async (req, res) => {
	// Check for validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
	  // Set flash messages and redirect the user back to the register page
	  req.flash('error', errors.array().map(error => error.msg));
	  return res.redirect('/users/register');
	}
  
	// Hash the password
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  
	  // Check if the 'buyer' role exists
	  let role = await Role.findOne({ where: { name: 'buyer' }});
	  if (!role) {
		// If the 'buyer' role does not exist, create it
		role = await Role.create({ name: 'buyer' });
	  }

	// Generate a mnemonic
	const mnemonic = bip39.generateMnemonic();
  
	// Create a new user in the database
	User.create({
	  username: req.body.username.toLowerCase(),
	  password: hashedPassword,
	  phrase: req.body.phrase,
	  mnemonic: mnemonic,
	  roleId: role.id,
	  mnemonic_shown: false
	})
	.then(user => {
	// Generate a JWT and send it back to the client
	const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 }); // expires in 24 hours
	req.session.jwt = token;
	res.redirect('/users/mnemonic');
	})
	.catch(error => {
	// Check if the error is due to the username already existing
	if (error.name === 'SequelizeUniqueConstraintError') {
		req.flash('error', 'Username already exists');
		return res.redirect('/users/register');
	}
	  res.status(500).send({ error: error });
	});
  });

  router.get('/mnemonic', attachUser, (req, res) => {
	if (req.user.mnemonic_shown) {
		// If the mnemonic page has already been shown, redirect the user to the 2FA setup page
		return res.redirect('/users/set-up-2fa');
	  }
	  
	  // Render the mnemonic page
	  res.render('mnemonic', { mnemonic: req.user.mnemonic });
	  
	  // Update the mnemonic_shown field to true in the database
	  User.update({ mnemonic_shown: true }, { where: { id: req.user.id } });
  });
  
  

module.exports = router;
