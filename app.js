const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const usersRouter = require("./routes/users");
const flash = require("connect-flash");
const session = require("express-session");

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

// Enable sessions
app.use(
	session({
		secret: "ohambarotravallbrebir",
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

app.get("/", (req, res) => {
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
