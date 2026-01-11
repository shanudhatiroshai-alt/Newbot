const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    type: String,
    message: String,
    group: String,
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Log", logSchema);