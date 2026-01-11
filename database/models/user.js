const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    jid: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastMsg: Number
});

module.exports = mongoose.model("User", userSchema);