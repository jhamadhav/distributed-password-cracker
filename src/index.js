const express = require("express")
const cors = require('cors')
const path = require('path')
const { log } = require("console")
const app = express()

// port infos
const port = process.env.PORT || 8000

// parser
app.use(cors())
app.use(express.static("public"))
app.use(express.json())

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/../public/index.html")
})

app.get("/room/:roomID", (req, res) => {
    let roomID = req.params.roomID
    console.log(`room: ${roomID}`)
    res.sendFile(path.resolve("public/room.html"))
})

// listen for requests :)
let server = app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

// pass the server to socket io
const io = require("socket.io")(server, {
    cors: {
        origin: "http://127.0.0.2:5500",
        credentials: true,
    },
    allowEIO3: true
})
io.on('connection', (socket) => {
    console.log("New user connected")

    socket.username = "anonymous"
    socket.on("create", (room) => {
        socket.room = room

        // if room already exists:
        // - client will send an offer
        let roomInfo = io.sockets.adapter.rooms.get(room)
        if (roomInfo) {
            console.log("room already exists")

            // client makes an offer
            io.sockets.to(socket.id).emit("makeOffer", "please make an offer")
        }
        socket.join(room)

        console.log(`user: ${socket.id} joined room: ${socket.room}`)
    })

    // when client makes an offer, send it to master
    socket.on("makeOffer", (offer) => {

        console.log(`Offer received for master from: ${socket.id}`);

        // first user is master
        let roomInfo = io.sockets.adapter.rooms.get(socket.room)
        roomInfo = Array.from(roomInfo)

        let masterID = roomInfo[0];
        // ask master to get us the answer
        let data = {
            clientID: socket.id,
            offer
        }
        io.sockets.to(masterID).emit("makeAnswer", data)
    })

    // when we get answer from master we send to the client that sent the offer
    socket.on("makeAnswer", (data) => {
        console.log(`answer received from master for: ${data.clientID}`);
        // data contains clientID and answer
        io.sockets.to(data.clientID).emit("takeAnswer", data.answer)
    })

    socket.on("setUsername", (name) => {
        if (name.length > 0) {
            socket.username = name
        }
    })

    socket.on("message", (msg) => {
        console.log(`message : "${msg}" sent by user: ${socket.id} in room: ${socket.room}`);
        let data = {
            username: socket.id,
            msg
        }
        socket.in(socket.room).emit("message", data)
    })

    socket.on("disconnect", () => {
        console.log(`user: ${socket.id} left room: ${socket.room}`);
    })
});
