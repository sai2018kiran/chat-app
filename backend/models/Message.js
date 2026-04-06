const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  text: String,
  timestamp: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false }
});

module.exports = mongoose.model("Message", messageSchema);