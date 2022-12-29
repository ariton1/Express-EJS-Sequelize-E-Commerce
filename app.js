const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const usersRouter = require("./routes/users");
const flash = require("connect-flash");
const session = require("express-session");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// Import the database models
const db = require("./models");
const User = db.User;

const sequelize = new Sequelize(
	process.env.DB_DEV,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST,
		dialect: process.env.DB_DIALECT,
	}
);

app.use(flash());

app.use(cookieParser());

// Enable cookies
app.use(
	cookieSession({
		name: "sessId",
		secret: process.env.COOKIE_SECRET,
		maxAge: 86400000, // expiration time in milliseconds (1 day)
	})
);

// Enable sessions
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);

// Use body-parser to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/users", usersRouter);
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "public/views");

app.get("/", async (req, res) => {
	const token = req.cookies.token;
	if (!token) {
		res.redirect("/users/register");
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = await User.findOne({ where: { id: decoded.id } });
	if (!user.twofactor_enabled) {
		return res.redirect("/users/set-2fa");
	}
	res.render("index", { title: "My App" });
});

sequelize
	.sync({ force: true })
	.then(() => {
		console.log("Connection has been established successfully.");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
	});

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});
