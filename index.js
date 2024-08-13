const express = require("express");
const app = express();
const session = require("express-session");

const AccountRouter = require("./api/account");
const ChatRouter = require("./api/chat");
const { auth } = require("./api/middleware");
const fs = require("fs/promises");
const { initialize } = require("./api/io.js");
const { loadModel } = require("./api/model");

fs.exists = function (fp) {
  return this.access(fp)
    .then(() => true)
    .catch(() => false);
}.bind(fs);
(async function () {
  if (!(await fs.exists("./storage"))) {
    fs.mkdir("./storage");
  }
  console.log("INFO: Loading toxicity model...");
  await loadModel();
  console.log("INFO: Model loaded!");
})();

const cors = require("cors");
const path = require("path");
const SQLiteStore = require("connect-sqlite3")(session);

const PORT = 3000;
const WHITELISTED_URL = process.argv.includes("--dev") ? "http://localhost:5173" : "http://localhost:3000";

app.use(
  cors({
    origin: WHITELISTED_URL,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
const sessionMiddleware = session({
  store: new SQLiteStore(),
  secret: "yoursecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 3600 * 1000,
    secure: false,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  },
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use("/api/accounts", AccountRouter);
app.use("/api/chatroom", ChatRouter);
app.get("/storage/:filename", async (req, res) => {
  const filename = "./storage/" + req.params.filename;
  if (await fs.exists(filename)) {
    res.download(filename);
  } else {
    res.status(404).end();
  }
});
app.use(express.static(path.join(__dirname, "./frontend/dist")));
app.use((req, res)=>{
  res.sendFile("./frontend/dist/index.html", {root: __dirname})
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  if (!res.headersSent) {
    res.status(500).json({
      message:
        "Terjadi kesalahan di bagian server, mohon dicoba lagi pada waktu lain",
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`INFO: Server running at http://localhost:${PORT}`);
});
initialize(
  server,
  { cors: WHITELISTED_URL, credentials: true },
  sessionMiddleware
);
