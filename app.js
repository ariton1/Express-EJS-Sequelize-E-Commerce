const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();

const bodyParser = require("body-parser");
const flash = require("connect-flash");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const sequelize = require("./config/connection");

// Import routes
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const buyerRouter = require("./routes/buyer");
const pgpRouter = require("./routes/pgp");

// Import middlewares
const isLoggedIn = require("./middleware/isLoggedIn");
const require2FA = require("./middleware/require2FA");

// Import the database models
const db = require("./models");
const User = db.User;
const Role = db.Role;

app.use(flash());
app.use(cookieParser());

// Enable cookies
app.use(
  cookieSession({
    name: "sessId",
    secret: process.env.COOKIE_SECRET,
    maxAge: 864000, // expiration time in milliseconds (1 day)
  })
);

// Use body-parser to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/buyer", buyerRouter);
app.use("/pgp", pgpRouter);

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "public/views");

app.get("/", isLoggedIn, require2FA, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  //Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("index", { role: role });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
