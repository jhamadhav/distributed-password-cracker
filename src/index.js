const express = require("express")
const cors = require('cors')
const app = express()

// port infos
const port = process.env.PORT || 8000

// parser
app.use(cors())
app.use(express.static("public"))
app.use(express.json())

app.get("/", (req, res) => {
    res.sendFile(__dirname + "../public/index.html")
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

    socket.on("create", (room) => {
        socket.room = room
        socket.join(room)
    })

    socket.on("message", (data) => {
        console.log(data);
        socket.in(socket.room).emit("message", data)
    })
});
