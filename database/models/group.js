const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    jid: String,

    settings: {
        antilink: { type: Boolean, default: false },
        antibad: { type: Boolean, default: false },
        antispam: { type: Boolean, default: false },
        welcome: { type: Boolean, default: true },
        automute: { type: Number, default: null }
    },

    commands: {
        kick: { type: Boolean, default: true },
        add: { type: Boolean, default: true },
        warn: { type: Boolean, default: true },
        tagall: { type: Boolean, default: true }
    }
});

module.exports = mongoose.model("Group", groupSchema);