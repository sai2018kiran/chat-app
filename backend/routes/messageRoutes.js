const express = require("express");
const router = express.Router();
const Message = require("../models/Message");


router.post("/", async (req, res) => {
  if (!req.body.text) return res.status(400).send("Text required");
  const msg = await Message.create({ text: req.body.text });
  res.json(msg);
});


router.get("/", async (req, res) => {
  const msgs = await Message.find().sort({ timestamp: 1 });
  res.json(msgs);
});


router.put("/delete/:id", async (req, res) => {
  await Message.findByIdAndUpdate(req.params.id, { deleted: true });
  res.send("Deleted");
});


router.put("/pin/:id", async (req, res) => {
  await Message.findByIdAndUpdate(req.params.id, { pinned: true });
  res.send("Pinned");
});

module.exports = router;