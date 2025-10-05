require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ejs = require("ejs");
const path = require("path");
const expressLayout = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("express-flash");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const Emitter = require("events");

const PORT = process.env.PORT || 3300;

console.log(process.env.MONGO_CONNECTION_URL);

// Event emitter
const eventEmitter = new Emitter();
app.set("eventEmitter", eventEmitter);

// Async function to connect to DB and start server
async function startServer() {
  try {
    const connection = await mongoose.connect(process.env.MONGO_CONNECTION_URL);
    console.log("Connected to MongoDB");

    // Session store using MongoStore
    let mongoStore = MongoStore.create({
      mongoUrl: process.env.MONGO_CONNECTION_URL,
      collectionName: "sessions",
    });

    // Session config
    app.use(
      session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        store: mongoStore,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
      })
    );

    // Passport config
    const passportInit = require("./app/config/passport");
    passportInit(passport);
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(flash());

    // Assets
    app.use(express.static("public"));
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // Global middleware
    app.use((req, res, next) => {
      res.locals.session = req.session;
      res.locals.user = req.user;
      next();
    });

    // Template engine
    app.use(expressLayout);
    app.set("views", path.join(__dirname, "/resources/views"));
    app.set("view engine", "ejs");

    // Routes
    require("./routes/web")(app);

    // 404 page
    app.use((req, res) => {
      res.status(404).render("errors/404");
    });

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\x1b[31m\nListening on port ${PORT}\n\x1b[0m`);
    });

    // Socket.io
    const io = require("socket.io")(server);
    io.on("connection", (socket) => {
      socket.on("join", (orderId) => {
        socket.join(orderId);
      });
    });

    eventEmitter.on("orderUpdated", (data) => {
      io.to(`order_${data.id}`).emit("orderUpdated", data);
    });

    eventEmitter.on("orderPlaced", (data) => {
      io.to("adminRoom").emit("orderPlaced", data);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

startServer();
