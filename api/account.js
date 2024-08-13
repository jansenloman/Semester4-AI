const express = require("express");
const router = express.Router();
const { auth, createUserObject } = require("./middleware.js");
const bcrypt = require("bcrypt");
const db = require("./db.js");
const fs = require("fs/promises");
const path = require("path");

const upload = require('./pfp.js');

function validateRegister(req, res, next) {
  const { email, password, name } = req.body;
  if (!email || !password || !name ) {
    res.status(400).json({
      message: "Expecting the following fields: email, password, and name",
    });
    return;
  }
  const errors = [];
  if (email.length == 0) errors.push("Email harus diisi");
  else if (
    !email.match(
      /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    )
  )
    errors.push("Format email tidak sesuai");

  if (password.length < 8)
    errors.push("Password harus terdiri dari minimal 8 karakter");

  if (name.length < 5)
    errors.push("Nama harus terdiri dari minimal 5 karakter");
  else if (!name.match(/^[a-zA-Z0-9]+$/))
    errors.push(
      "Nama hanya boleh terdiri dari huruf alfabet dan angka 0-9 saja"
    );
  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(". ") });
    return;
  } else {
    next();
  }
}

router.post("/register", upload.single("pfp"), validateRegister, async (req, res, next) => {
  const { email, password, name, bio } = req.body;
  const pfp = req.file;
  if (!pfp){
    res.status(400).json({message: "Sebuah gambar sebagai pfp pengguna harus disediakan!"});
    return;
  }
  let lastID;
	try {
		const saltRounds = 10;
		const hash = await bcrypt.hash(password, saltRounds);
		const changed = await db.run("INSERT INTO users VALUES (NULL, ?, ?, ?, ?, ?)", [email, hash, name, bio ?? "", pfp.filename]);
    lastID = changed.lastID;
  } catch (err) {
    console.error(err);
		res.status(400).json({message: "Email tersebut sudah digunakan orang lain."});
		return;
	}

	try {
		const user = await db.get("SELECT * FROM users WHERE id = ?", [lastID]);
		if (!user) res.status(500).end();
		else {
			req.session.user = {id: user.id};
			res.status(201).json(createUserObject(user));
		}
	} catch (err){
		next(err);
	}
});

router.post("/login", async (req, res, next) => {
  try {
		const { email, password } = req.body;
		const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
		if (!user || !await bcrypt.compare(password, user.password)){
			res.status(401).json({ message: "Email atau password salah!"});
			return;
		}
		req.session.user = {id: user.id};
		res.status(200).json(createUserObject(user));
	} catch (err) {
		next(err);
	}
});

router.post("/logout", auth, (req, res) => {
  req.session.destroy();
  res.status(200).end();
});

router.get("/me", auth, (req, res) => {
  if (req.session.user) res.status(200).json(req.session.user);
  else res.status(401).end();
});

router.get("/", auth, async (req, res, next) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.session.user.id]);
    if (!user) res.status(404).end();
    else res.status(200).json(createUserObject(user));
  } catch (err){
    next(err);
  }
});

async function deleteImage(fp){
  const oldFilePath = path.join(__dirname, "../storage", fp);
  if (
    await fs
      .access(oldFilePath)
      .then(() => true)
      .catch(() => false)
    ){
    await fs.unlink(oldFilePath);
  }
}

router.delete("/", auth, async (req, res, next) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.session.user.id]);
    if (!user){
      res.status(404).end();
      return;
    }
    const chatrooms = await db.all("SELECT * FROM rooms WHERE owner_id = ?", [req.session.user.id]);
    await db.run("DELETE FROM users WHERE id = ?", [req.session.user.id]);
    req.session.destroy();
    res.status(200).end();

    await deleteImage(user.pfp_path);
    await Promise.allSettled(chatrooms.map(x => deleteImage(x.thumbnail)));
  } catch (err){
    next(err);
  }
});

module.exports = router
