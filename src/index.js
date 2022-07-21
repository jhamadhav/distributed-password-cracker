const express = require("express")
const cors = require('cors')
const path = require('path')
const { makeRandPic, getRandColor } = require('./utils/profileFunc')
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
    socket.pic = makeRandPic()
    socket.color = getRandColor()

    socket.emit("my-id", {
        "id": socket.id,
        "username": socket.username,
        "pic": socket.pic,
        "color": socket.color
    });

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

        //after joining share client details to all
        let userData = {
            "type": "get-all",
            "id": socket.id,
            "name": socket.username,
            "pic": socket.pic,
            "color": socket.color
        }

        socket.to(socket.room).emit("user-room", userData)

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

    socket.on("message", (msg) => {
        console.log(`message : "${msg}" sent by user: ${socket.id} in room: ${socket.room}`);
        let data = {
            username: socket.id,
            msg
        }
        socket.in(socket.room).emit("message", data)
    })

    // exchange details about users in room
    socket.on("user-room", (data) => {
        // client can do following
        // 1. ask about all users
        if (data["type"] == "get-all") {
            let roomInfo = io.sockets.adapter.rooms.get(socket.room)
            // console.log(roomInfo);
            roomInfo = Array.from(roomInfo)

            for (let i = 0; i < roomInfo.length; ++i) {
                let tempSocket = io.sockets.sockets.get(roomInfo[i])

                let userData = {
                    "type": "get-all",
                    "id": tempSocket.id,
                    "name": tempSocket.username,
                    "pic": tempSocket.pic,
                    "color": tempSocket.color
                }

                io.sockets.to(socket.id).emit("user-room", userData)
            }

        }

        // 2. ask for their name change
        if (data["type"] == 'name-change') {
            if (data["name"].length > 0) {
                socket.username = data["name"]

                let userData = {
                    "type": "name-change",
                    "id": socket.id,
                    "username": tempSocket.username
                }
                socket.in(socket.room).emit("user-room", userData)
            }
        }
    })

    socket.on("disconnect", () => {
        let userData = {
            "type": "left",
            "id": socket.id,
        }
        socket.in(socket.room).emit("user-room", userData)
        console.log(`user: ${socket.id} left room: ${socket.room}`);
    })
});
