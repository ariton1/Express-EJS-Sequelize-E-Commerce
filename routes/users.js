const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bip39 = require("bip39");
const { check, validationResult } = require("express-validator");
require("dotenv").config();
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const CryptoJS = require('crypto-js');

// Import the database models
const db = require("../models");
const Role = db.Role;
const User = db.User;

router.get("/login", (req, res) => {
	const token = req.cookies.token;
	if (token) {
		return res.redirect("/");
	}
	res.render("login", { flash: req.flash() });
  });

  router.post(
	"/login",
	[
		// Validate the request body
		check("username", "Please enter a valid username").isAlphanumeric(),
		check("password", "Please enter a valid password").isLength({ min: 8 }),
	],
	async (req, res) => {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// Set flash messages and redirect the user back to the login page
			req.flash(
				"error",
				errors.array().map((error) => error.msg)
			);
			return res.redirect("/users/login");
		}

		// Find the user in the database
		const user = await User.findOne({ where: { username: req.body.username } });
		if (!user) {
			req.flash("error", "Invalid username or password");
			return res.redirect("/users/login");
		}

		// Check if the password is correct
		const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
		if (!passwordIsValid) {
			req.flash("error", "Invalid username or password");
			return res.redirect("/users/login");
		}

		// If the user hasn't set up 2FA yet, redirect them to the 2FA setup page
		if (!user.twofactor_enabled) {
			// Generate a JWT and set it in a cookie
			const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
				expiresIn: 86400, // expires in 24 hours
			});
			res.cookie("token", token, {
				expires: new Date(Date.now() + 86400), // Expires in 24 hours
				httpOnly: true, // Only accessible by the server
			});

			return res.redirect('/users/set-2fa');
		}

		// If the user has set up 2FA, check if they have entered the correct 2FA code
		const twofactor_secret = user.twofactor_secret;
		const code = req.body.code;

		if (!code) {
			req.flash("error", "Please enter your 2FA code");
			return res.redirect("/users/login");
		}

		const verified = speakeasy.totp.verify({
			secret: twofactor_secret,
			encoding: "base32",
			token: code,
		});

		if (!verified) {
			req.flash("error", "Invalid 2FA code");
			return res.redirect("/users/login");
		}

		// If the username, password, and 2FA code are correct (if applicable), generate a JWT and send it back to the client
		const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
			expiresIn: 86400, // expires in 24 hours
		});

		// Set the token in a cookie with an expiration date
		res.cookie("token", token, {
			expires: new Date(Date.now() + 86400), // Expires in 24 hours
			httpOnly: true, // Only accessible by the server
		});

		res.redirect("/");
	});


router.get("/logout", (req, res) => {
	// Clear the token from the cookie
	res.clearCookie("token");
  
	// Redirect the user back to the login page
	res.redirect("/users/login");
  });

router.get("/register", (req, res) => {
	const token = req.cookies.token;
	if (token) {
		// If the user is authenticated, redirect them to the home page
		return res.redirect("/");
	}
	res.render("register", { flash: req.flash() });
});

router.post(
	"/register",
	[
		// Validate the request body
		check(
			"username",
			"Username must be alphanumeric and have at least 5 characters"
		)
			.isAlphanumeric()
			.isLength({ min: 5, max: 32 }),
		check(
			"password",
			"Password must have at least 8 characters and contain at least 1 uppercase character, 1 lowercase character, 1 number, and 1 symbol"
		)
			.isLength({ min: 8, max: 32 })
			.matches(
				/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/,
				"i"
			),
		check("confirmPassword", "Passwords do not match").custom(
			(value, { req }) => value === req.body.password
		),
		check("phrase", "Phrase must have at least 5 characters").isLength({
			min: 5,
			max: 32,
		}),
	],
	async (req, res) => {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// Set flash messages and redirect the user back to the register page
			req.flash(
				"error",
				errors.array().map((error) => error.msg)
			);
			return res.redirect("/users/register");
		}

		// Hash the password
		const hashedPassword = bcrypt.hashSync(req.body.password, 10);

		// Check if the 'buyer' role exists
		let role = await Role.findOne({ where: { name: "buyer" } });
		if (!role) {
			// If the 'buyer' role does not exist, create it
			role = await Role.create({ name: "buyer" });
		}

		// Generate a mnemonic
		const mnemonic = bip39.generateMnemonic(strength=256);
		const mnemonicKey = process.env.MNEMONIC_KEY;
		const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, mnemonicKey);

		// Create a new user in the database
		User.create({
			username: req.body.username.toLowerCase(),
			password: hashedPassword,
			phrase: req.body.phrase,
			mnemonic: encryptedMnemonic.toString(),
			roleId: role.id,
			mnemonic_shown: false,
		})
			.then((user) => {
				// Generate a JWT and send it back to the client
				const token = jwt.sign(
					{ id: user.id },
					process.env.JWT_SECRET,
					{ expiresIn: 86400 }
				); // expires in 24 hours

				// Set the token in a cookie with an expiration date
				res.cookie("token", token, {
					expires: new Date(Date.now() + 86400), // Expires in 24 hours
					httpOnly: true, // Only accessible by the server
				});

				res.redirect("/users/mnemonic");
			})
			.catch((error) => {
				// Check if the error is due to the username already existing
				if (error.name === "SequelizeUniqueConstraintError") {
					req.flash("error", "Username already exists");
					return res.redirect("/users/register");
				}
				res.status(500).send({ error: error });
			});
	}
);

router.get("/mnemonic", async (req, res) => {
	// Check if the user is authenticated
	if (!req.cookies.token) {
		// If the user is not authenticated, redirect them to the login page
		return res.redirect("/users/login");
	}

	// Get the token from the cookie
	const token = req.cookies.token;

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = await User.findOne({ where: { id: decoded.id } });

	if (user.mnemonic_shown) {
		return res.redirect("/");
	}

	// Get the mnemonic key from the .env file
	const mnemonicKey = process.env.MNEMONIC_KEY;

	// Decrypt the mnemonic
	const decrypted = CryptoJS.AES.decrypt(user.mnemonic, mnemonicKey);
	const originalMnemonic = decrypted.toString(CryptoJS.enc.Utf8);

	user.mnemonic_shown = true;
	await user.save();

	res.render("mnemonic", { mnemonic: originalMnemonic });
});

router.get("/set-2fa", async (req, res) => {
	// Check if the user is authenticated
	if (!req.cookies.token) {
		// If the user is not authenticated, redirect them to the login page
		return res.redirect("/users/login");
	}

	// Get the token from the cookie
	const token = req.cookies.token;

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = await User.findOne({ where: { id: decoded.id } });

	if (!user.mnemonic_shown) {
		return res.redirect("/users/mnemonic");
	}

	// Check if 2FA is already enabled for the user
	if (user.twofactor_enabled) {
		// If 2FA is already enabled, redirect the user to the home page
		return res.redirect("/");
	}

	// Generate a secret and QR code for the user
	const secret = speakeasy.generateSecret({
		length: 20,
		encoding: "base32",
	});

	QRCode.toDataURL(secret.otpauth_url, (err, src) => {
		if (err) {
			res.send("Something went wrong. Please refresh the page");
		}
		// Render the 2FA setup page
		res.render("set-2fa", {
			qrCodeUrl: src,
			secret: secret.base32,
			error: req.flash("error"),
		});
	});
});

router.post("/set-2fa", async (req, res) => {
	if (!req.cookies.token) {
		return res.redirect("/users/login");
	}

	// Get the token from the cookie
	const token = req.cookies.token;

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = await User.findOne({ where: { id: decoded.id } });

	// If the user has already set up 2FA, redirect them to the home page
	if (user.twofactor_enabled) {
		return res.redirect("/");
	}

	const verified = speakeasy.totp.verify({
		secret: req.body.secret,
		encoding: "base32",
		token: req.body.code, // 2FA code entered by user
	});

	if (verified) {
		user.twofactor_enabled = true;
		// user.twofactor_secret = req.body.secret;
		const mnemonicKey = process.env.MNEMONIC_KEY; // should change the name here
		const encryptedSecret = CryptoJS.AES.encrypt(req.body.secret, mnemonicKey);
		user.twofactor_secret = encryptedSecret.toString();
		user.save();
		res.redirect("/");
	} else {
		req.flash("error", "Invalid 2FA code");
		res.redirect("/users/set-2fa");
	}
});

module.exports = router;