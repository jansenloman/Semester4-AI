const express = require("express");
const router = express.Router();
const db = require("./db.js");
const {
  auth,
  hasUserJoined,
  createChatroomObject,
  doesChatroomExist,
  isChatroomOwner,
  createChatroomInfoObject,
  createMessageObject,
  generateInviteLink,
} = require("./middleware");
const upload = require("./pfp");
const fs = require("fs/promises");
const { dispatch } = require("./io");
const { loadModel } = require("./model");

const CHATROOM_QUERY = `SELECT rooms.id AS room_id, rooms.*, users.id AS owner_id, users.email AS owner_email, users.name AS owner_name, users.bio AS owner_bio, users.pfp_path AS owner_pfp FROM rooms JOIN users ON rooms.owner_id = users.id`;
const CHATROOM_MEMBERS_QUERY = `SELECT * FROM user_rooms JOIN users ON user_rooms.user_id = users.id WHERE room_id = ?`;
const CHATROOM_MESSAGES_QUERY = `SELECT messages.*, users.id AS owner_id, users.email AS owner_email, users.name AS owner_name, users.bio AS owner_bio, users.pfp_path AS owner_pfp FROM messages LEFT JOIN users ON messages.user_id = users.id`;

router.get("/mine", auth, async (req, res, next) => {
  const MEMBER_HAS_JOINED =
    " WHERE (SELECT COUNT(*) FROM user_rooms WHERE user_rooms.user_id = ? AND user_rooms.room_id = rooms.id ) > 0";
  try {
    let myRooms;
    if (req.query.search) {
      myRooms = await db.all(
        CHATROOM_QUERY +
        MEMBER_HAS_JOINED +
        " AND rooms.title LIKE ?",
        [req.session.user.id, `${req.query.search}%`]
      );
    } else {
      myRooms = await db.all(CHATROOM_QUERY + MEMBER_HAS_JOINED, [
        req.session.user.id,
      ]);
    }
    res.status(200).json(myRooms.map((x) => createChatroomInfoObject(x)));
  } catch (err) {
    next(err);
  }
});

router.get("/public", auth, async (req, res, next) => {
  let publicRooms;
  const CONSTRAINTS = " ORDER BY room_id DESC LIMIT 20";
  const ROOM_IS_PUBLIC = " AND rooms.is_public = 1";
  const MEMBER_HAS_NOT_JOINED =
    " WHERE (SELECT COUNT(*) FROM user_rooms WHERE user_rooms.user_id = ? AND user_rooms.room_id = rooms.id ) = 0";
  try {
    if (req.query.search) {
      publicRooms = await db.all(
        CHATROOM_QUERY +
          MEMBER_HAS_NOT_JOINED +
          " AND rooms.title LIKE ?" +
          ROOM_IS_PUBLIC +
          CONSTRAINTS,
        [req.session.user.id, `${req.query.search}%`]
      );
    } else {
      publicRooms = await db.all(
        CHATROOM_QUERY + MEMBER_HAS_NOT_JOINED + ROOM_IS_PUBLIC + CONSTRAINTS,
        [req.session.user.id]
      );
    }
  } catch (err) {
    next(err);
    return;
  }
  if (publicRooms) {
    res.status(200).json(publicRooms.map((x) => createChatroomInfoObject(x)));
  } else {
    res.status(500).end();
  }
});

router.post("/:id/members", auth, doesChatroomExist, async (req, res, next) => {
  try {
    const hasJoined = await db.get(
      "SELECT * FROM user_rooms WHERE room_id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );
    if (hasJoined) {
      res.status(200).json({ message: "Sudah masuk ke chatroom tersebut" });
      return;
    }
    await db.run("INSERT INTO user_rooms VALUES (?, ?)", [
      req.session.user.id,
      parseInt(req.params.id),
    ]);
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/members", auth, hasUserJoined, async (req, res, next) => {
  try {
    await db.run("DELETE FROM user_rooms WHERE user_id = ? AND room_id = ?", [
      req.session.user.id,
      req.params.id,
    ]);
    res.status(200).end();
  } catch (err) {
    next(err);
  }
});

router.get("/:id", auth, hasUserJoined, async (req, res, next) => {
  try {
    const room = await db.get(CHATROOM_QUERY + " WHERE room_id = ?", [
      req.params.id,
    ]);
    if (!room) {
      res.status(404).json({ message: "Room tidak ada!" });
      return;
    } else {
      const members = await db.all(CHATROOM_MEMBERS_QUERY, [room.room_id]);
      res.status(200).json(createChatroomObject(room, members));
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auth, isChatroomOwner, async (req, res, next) => {
  try {
    const roomid = parseInt(req.params.id);
    const prev = await db.get("SELECT * FROM rooms WHERE id = ?", [roomid]);
    await db.run("DELETE FROM rooms WHERE id = ?", [roomid]);
    res.status(200).end();
    const oldFile = "./storage/" + prev.thumbnail;
    if (
      await fs
        .access(oldFile)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.unlink(oldFile);
    }
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  upload.single("thumbnail"),
  auth,
  isChatroomOwner,
  async (req, res, next) => {
    const { title, description, isFiltered, isPublic } = req.body;
    const thumbnail = req.file;
    let sets = [],
      params = [];
    let prev;
    try {
      prev = await db.get("SELECT * FROM rooms WHERE id = ?", [
        parseInt(req.params.id),
      ]);
    } catch (e) {
      next(e);
      return;
    }

    if (title) {
      sets.push("title = ?");
      params.push(title);
    }
    if (description) {
      sets.push("description = ?");
      params.push(description);
    }
    if (isFiltered) {
      sets.push("is_filtered = ?");
      params.push(isFiltered == "yes" ? 1 : 0);
    }
    if (isPublic) {
      sets.push("is_public = ?");
      params.push(isPublic == "yes" ? 1 : 0);
    }
    if (thumbnail) {
      sets.push("thumbnail = ?");
      params.push(thumbnail.filename);
    }

    if (sets.length == 0 || params.length == 0) {
      res.status(200).end();
      return;
    }
    const query = "UPDATE rooms SET " + sets.join(", ") + " WHERE id = ?";
    params.push(req.params.id);
    try {
      await db.run(query, params);
      const oldFile = "../storage/" + prev.thumbnail;
      res.status(200).end();
      if (
        await fs
          .access(oldFile)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.unlink(oldFile);
      }
    } catch (err) {
      next(err);
      return;
    }
  }
);

router.post("/", upload.single("thumbnail"), auth, async (req, res, next) => {
  try {
    const { title, description, isFiltered, isPublic } = req.body;
    const thumbnail = req.file;
    const { lastID } = await db.run(
      "INSERT INTO rooms VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.session.user.id,
        title,
        description,
        thumbnail.filename,
        isFiltered.length > 0 ? 1 : 0,
        isPublic.length > 0 ? 1 : 0,
        generateInviteLink(),
      ]
    );
    await db.run("INSERT INTO user_rooms VALUES (?, ?)", [
      req.session.user.id,
      lastID,
    ]);
    const room = await db.get(CHATROOM_QUERY + " WHERE room_id = ?", [lastID]);
    if (!room) res.status(500).end();
    else {
      const members = await db.all(CHATROOM_MEMBERS_QUERY, [lastID]);
      res.status(201).json(createChatroomObject(room, members));
    }
  } catch (err) {
    next(err);
  }
});


router.post("/invite/:link", auth, async (req, res, next) => {
  try {
    const room = await db.get("SELECT * FROM rooms WHERE invite_link = ?", [req.params.link]);
    if (!room){
      res.status(404).json({message: "Room not found"});
      return;
    }

    const isMember = await db.get("SELECT * FROM user_rooms WHERE user_id = ? AND room_id = ?", [req.session.user.id, room.id]);
    
    if (!isMember){
      await db.run("INSERT INTO user_rooms VALUES (?, ?)", [
        req.session.user.id,
        room.id,
      ]);
    }
    res.status(200).json({id: room.id});
  } catch (e){
    next(e);
  }
});
router.put("/invite/:id", auth, isChatroomOwner, async (req, res, next)=>{
  try {
    const link = generateInviteLink();
    await db.run("UPDATE rooms SET invite_link = ? WHERE id = ?", [
      link,
      req.params.id
    ]);
    res.status(200).json({link});
  } catch (e){
    next(e);
  }
});

// Route untuk mengirimkan pesan baru ke chatroom
router.post("/:id/messages", auth, hasUserJoined, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    const room = await db.get("SELECT is_filtered FROM rooms WHERE id = ?", [
      id,
    ]);
    const isFiltered = room.is_filtered == 1 ? true : false;
    if (isFiltered) {
      const model = await loadModel();
      const toxicCategories = await model.whatToxic(message);

      if (toxicCategories.length > 0) {
        return res.status(403).json({
          message: "Pesan mengandung kata-kata toksik",
          categories: toxicCategories
        });
      }
    }

    const createdAt = new Date().toISOString(); // Mendapatkan waktu saat ini
    // Menyimpan pesan ke dalam database
    const {lastID} = await db.run(
      "INSERT INTO messages (room_id, user_id, text, created_at) VALUES (?, ?, ?, ?)",
      [id, req.session.user.id, message, createdAt]
    );
    const msgRaw = await db.get(CHATROOM_MESSAGES_QUERY + " WHERE messages.id = ?", [lastID]);
    if (!msgRaw){
      res.status(500).end();
      return;
    }
    const msg = createMessageObject(msgRaw);

    // Mengirimkan event 'sendMessage' ke semua anggota chatroom menggunakan socket.io
    dispatch(io => io.to(parseInt(id)).emit("sendMessage", msg));
    res.status(200).json(msg);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengirimkan pesan" });
  }
});

// Route untuk mengambil pesan sebelumnya dari chatroom
router.get("/:id/messages", auth, hasUserJoined, async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  if (isNaN(limit)){
    res.status(400).json({message: "Limit harus merupakan angka"});
    return;
  }

  try {
    let query = CHATROOM_MESSAGES_QUERY + ` WHERE messages.room_id = ?`;
    let params = [id];
    if (!isNaN(offset)){
      query += " AND messages.id < ?";
      params.push(offset);
    }
    query += "ORDER BY messages.id DESC LIMIT ?"
    params.push(limit);

    // Mengambil pesan sebelumnya dari database
    const messages = await db.all(query, params);
    messages.reverse();

    res.status(200).json(messages.map(x => createMessageObject(x)));
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan saat mengambil pesan");
  }
});

module.exports = router;
