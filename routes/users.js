const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bip39 = require("bip39");
const { check, validationResult } = require("express-validator");
require("dotenv").config();

// Import the database models
const db = require("../models");
const Role = db.Role;
const User = db.User;

router.get("/register", (req, res) => {
	if (req.session.jwt) {
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
		const mnemonic = bip39.generateMnemonic();

		// Create a new user in the database
		User.create({
			username: req.body.username.toLowerCase(),
			password: hashedPassword,
			phrase: req.body.phrase,
			mnemonic: mnemonic,
			roleId: role.id,
			mnemonic_shown: false,
		})
			.then((user) => {
				// Attach the user to the request object
				req.user = user;

				// Generate a JWT and send it back to the client
				const token = jwt.sign(
					{ id: user.id },
					process.env.JWT_SECRET,
					{ expiresIn: 86400 }
				); // expires in 24 hours
				req.session.jwt = token;
				// res.redirect(`/users/mnemonic?user=${user.id}`);
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

router.get("/mnemonic", (req, res) => {
	// const { user } = req.query;
	const token = req.session.jwt.headers;
	console.log("TOKENNNNN:", token);

	let userId = "";

	jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
		if (error) {
			return res.status(401).send("Unauthorized");
		}
	});
	userId = decoded.id;

	// Check if the user is authenticated
	if (!req.session.jwt) {
		// If the user is not authenticated, redirect them to the login page
		return res.redirect("/users/login");
	}

	// Find the user in the database
	User.findByPk(userId)
		.then((user) => {
			// Render the mnemonic view and pass the user's mnemonic to the view as a local variable
			res.render("mnemonic", { mnemonic: user.mnemonic });
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send(
				"An error occurred while retrieving the mnemonic. Please make a new account."
			);
		});
});

module.exports = router;
