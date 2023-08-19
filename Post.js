const mongoose = require('mongoose');

// POST SCHEMA
const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    likes: [String],
    likeCount: { type: Number, default: 0, },
    comment: []
});

module.exports = mongoose.model("Post", postSchema)