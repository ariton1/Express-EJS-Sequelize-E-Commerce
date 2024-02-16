const express = require("express");

const https = require("https");
const fs = require("fs");
const path = require("path");

const options = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

const app = express();

const socketIO = require("socket.io");
const server = https.createServer(options, app);
const io = socketIO(server);

const port = 5000;
require("dotenv").config();

const flash = require("connect-flash");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const sequelize = require("./config/connection");

// Import routes
const usersRouter = require("./routes/usersRouter");
const adminRouter = require("./routes/adminRouter");
const buyerRouter = require("./routes/buyerRouter");
const pgpRouter = require("./routes/pgpRouter");
const bannedRouter = require("./routes/bannedRouter");
const productRouter = require("./routes/productRouter");
const messagesRouter = require("./routes/messagesRouter");

// Import middlewares
const isLoggedIn = require("./middleware/isLoggedIn");
const require2FA = require("./middleware/require2FA");
const isBanned = require("./middleware/isBanned");

// Import the database models
const db = require("./models");
const User = db.User;
const Role = db.Role;
const Message = db.Message;

const getUserIdFromToken = require("./utils/getUserIdFromToken");

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

let users = {};

io.on("connection", async (socket) => {
  console.log("a user connected");

  socket.on("pageChange", (pathname) => {
    console.log(`Page changed to: ${pathname}`);
    const userId = users[socket.id];
    console.log("user id:", userId);
    if (userId) {
      users[userId].currentPath = pathname;
    }
  });

  socket.on("userConnected", (userId) => {
    users[userId] = socket.id;
    console.log("user id conn: ", users[userId]);
  });

  socket.on("readMessage", async (data) => {
    const { messageId, senderId, receiverId } = data;

    io.to(users[senderId]).emit("lastMessageSeen", messageId);
    io.to(users[receiverId]).emit("lastMessageSeen", messageId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { from, to, content, username } = data;
      const message = await Message.create({
        user_id: from,
        receiver_id: to,
        content: content,
      });

      io.to(users[to]).emit("receiveMessage", {
        ...message.dataValues,
        username: username,
        seen: false,
      });

      io.to(users[from]).emit("receiveMessage", {
        ...message.dataValues,
        username: username,
      });

      io.emit("messageNotification", {
        ...message.dataValues,
        username: username,
        to: to,
      });
    } catch (error) {
      console.log("Failed to store message: ", error);
    }
  });

  socket.on("receiveMessage", (data) => {
    const newMessage = document.createElement("div");
    newMessage.className =
      data.username === "<%= user.username %>"
        ? "bg-blue-500 text-white p-2 rounded-lg my-2 mb-4"
        : "bg-gray-300 text-black p-2 rounded-lg my-2 mb-4";
    newMessage.id = `message${data.id}`;

    newMessage.innerHTML = `<strong>${data.username}:</strong> ${data.content}`;

    const seenIndicator = document.createElement("div");
    seenIndicator.className = "text-green-500";
    seenIndicator.textContent = data.id === lastSeenMessageId ? "Seen" : "";
    newMessage.appendChild(seenIndicator);

    messageContainer.appendChild(newMessage);
  });
});

// Use body-parser to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/buyer", buyerRouter);
app.use("/pgp", pgpRouter);
app.use("/banned", bannedRouter);
app.use("/product", productRouter);
app.use("/messages", messagesRouter);

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("view engine", "ejs");
app.set("views", "public/views");

app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.setHeader("Content-Type", "text/javascript");
  }
  next();
});

app.use("/utils", express.static(path.join(__dirname, "utils")));

require("./unbanUsers"); // run the cron job periodically

app.get("/", isLoggedIn, require2FA, isBanned, async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("index", { user, role, flash: req.flash() });
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
