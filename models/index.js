const mongoose = require("mongoose")
const Schema = mongoose.Schema

// load env vars in development
if(process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

console.log("Node Env: ", process.env.NODE_ENV || "development")

const mongoUri = process.env.MONGODB_URI //|| "mongodb://localhost/chat_db"
mongoose.connect(mongoUri, { 
    useNewUrlParser: true, useUnifiedTopology: true, 
})
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
