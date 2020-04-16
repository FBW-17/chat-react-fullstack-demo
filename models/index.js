const mongoose = require("mongoose")
const Schema = mongoose.Schema

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost/chat_db"
mongoose.connect(mongoUri)
.then(() => console.log("MongoDB connection succesful"))
.catch(err => console.log(err.message))

const User = mongoose.model("User", new Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}))

const Room = mongoose.model("Room", new Schema({
    title: {type: String, required: true},
    users: [{ name: String, socketId: String }],
    history: {
        type: [{ msg: String, user: String }],
        default: []
    }
}))

module.exports = { User, Room, connection: mongoose.connection }
