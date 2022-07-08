const getRoom = () => {
    let loc = window.location
    loc = loc.toString()
    loc = loc.split("/")
    return loc[loc.length - 1]
}

let socket = io.connect('http://localhost:8000/')

socket.emit("create", getRoom())

socket.on("message", (data) => {
    addMessage(data)
})

document.getElementById("btn").onclick = () => {
    let msg = document.getElementById("inp").value
    console.log(msg);
    socket.emit("message", msg)

    addMessage(msg)
}

const addMessage = (data) => {
    let div = document.getElementById("chat")

    div.innerHTML += `<p>${data}</p>`
}

