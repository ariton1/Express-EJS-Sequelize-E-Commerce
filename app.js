const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// Import routes
const usersRouter = require("./routes/users");

// Import middlewares
const isLoggedIn = require("./middleware/isLoggedIn");
const require2FA = require("./middleware/require2FA");

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

app.get("/", isLoggedIn, require2FA, (req, res) => {
	res.render("index", { title: "Home" });
});

sequelize
	.sync({ force: true })
	.then(() => {
		console.log("Connection has been established successfully.");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
	});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});
