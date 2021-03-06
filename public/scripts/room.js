const getRoom = () => {
    let loc = window.location
    loc = loc.toString()
    loc = loc.split("/")
    return loc[loc.length - 1]
}

let username = "anonymous"
let myID = ""

let socket = io.connect('/')

socket.emit("create", getRoom())

socket.on("my-id", (data) => {
    myID = data["id"]
    console.log(`myID: ${myID}`);
    makeProfileOnline(data)

    document.getElementById("pop-pic").innerHTML = makeProfile(data["pic"], data["color"], "pop-pic-id")
    document.getElementById(myID.toString() + "-name").innerText = "You"
})

socket.on("message", (data) => {
    addMessage(data)
})

socket.on("user-room", (data) => {
    // from this channel client can receive two things
    // 1. info about newly added client
    if (data["type"] == "get-all") {
        console.log(data);
        makeProfileOnline(data)
    }

    // 2. some user changes their username
    if (data["type"] == "name-change") {
        console.log(data);
        console.log(data["username"]);
        document.getElementById(data.id + "-name").innerText = data["username"]
    }

    //3. user left
    if (data["type"] == "left") {
        console.log(`some one left: ${data.id}`);
        let profileElem = document.getElementById(data.id)
        console.log(profileElem);
        profileElem.classList.add("slide")
        profileElem.addEventListener("animationend", () => {
            profileElem.style.display = "none"
        })
    }
})

const makeProfile = (code, color, id) => {
    let pic = `<svg id="${id}-pic" width="200" height="200" xmlns="http://www.w3.org/2000/svg">`

    for (let i = 0; i < 25; ++i) {
        let fillColor = (i < code.length && code[i] == '1') ? color : "#fff";

        let x = (i % 5) * 20
        let y = Math.floor(i / 5) * 20

        pic += `<rect width="20" height="20" x=${x} y=${y} fill=${fillColor} />`
    }

    pic += "</svg>"
    return pic
}

const makeProfileOnline = (data) => {

    let idElem = document.getElementById(data["id"])

    if (document.body.contains(idElem)) {
        return
    }

    let ph = document.getElementsByClassName("profile-holder")[0]

    ph.innerHTML += `<div class="profile" id="${data["id"]}">
    <!-- svg image -->
    <div class="pic">
        ${makeProfile(data["pic"], data["color"], data["id"])}
    </div>
    <div class="details">
        <div class="name" id="${data["id"]}-name">
            ${data["name"]}
        </div>
        <div class="id">
            <span>ID: </span> 
            <span id="${data["id"]}-name" >${data["id"]}</span>
        </div>
    </div>
</div>`

}


socket.on("makeOffer", (data) => {
    console.log(data);
    console.log("making offer");
    makeOffer()
})

// web rtc connection code
let cfg = { 'iceServers': [{ 'urls': "stun:stun.gmx.net" }] }
let con = { 'optional': [{ 'DtlsSrtpKeyAgreement': true }] }
let sdpConstraints = { optional: [], }

if (navigator.webkitGetUserMedia) {
    RTCPeerConnection = webkitRTCPeerConnection
}

let pcs = [], dcs = []

// when it acts as a client and make an offer
const makeOffer = () => {
    let pc1 = new RTCPeerConnection(cfg, con)

    let dc1 = pc1.createDataChannel('test', { reliable: true })

    dc1.onopen = (e) => { }
    dc1.onmessage = (e) => {
        console.log(e.data);
        let data = JSON.parse(e.data)

        console.log(`message from master: ${data.message}`);
    }

    console.log("main: creating offer");

    pc1.createOffer((desc) => {
        pc1.setLocalDescription(desc, () => { }, () => { })
    }, () => { }, sdpConstraints)

    pc1.onicecandidate = (e) => {
        if (e.candidate == null) {
            let offer = JSON.stringify(pc1.localDescription)

            console.log(`client offer: ${JSON.stringify(pc1.localDescription)}`);

            socket.emit("makeOffer", offer)
        }
    }

    pcs.push(pc1)
    dcs.push(dc1)
}

// when we receive answer from master
socket.on("takeAnswer", (answer) => {
    console.log("Answer received from master");
    let answerDesc = new RTCSessionDescription(JSON.parse(answer))
    pcs[pcs.length - 1].setRemoteDescription(answerDesc);
})

// we act as master to accept offer and send answer
socket.on("makeAnswer", (data) => {
    console.log(`offer made to master`);
    console.log(data);

    let pc2 = new RTCPeerConnection(cfg, con), dc2 = null;

    pc2.ondatachannel = (e) => {
        let datachannel = e.channel || e;
        dc2 = datachannel

        dc2.onopen = (e) => { }
        dc2.onmessage = (e) => {
            console.log(e.data);
            let data = JSON.parse(e.data)

            console.log(`message from client: ${data.message}`);
        }
        dcs.push(dc2)
    }

    let offerDesc = new RTCSessionDescription(JSON.parse(data["offer"]))
    pc2.setRemoteDescription(offerDesc)

    console.log("creating answer");
    pc2.createAnswer((answerDesc) => {
        pc2.setLocalDescription(answerDesc)
    }, () => { }, sdpConstraints)

    pc2.onicecandidate = (e) => {
        if (e.candidate == null) {
            let answer = JSON.stringify(pc2.localDescription);

            console.log(`master's answer: ${answer}`);
            console.log(data.clientID);

            socket.emit("makeAnswer", { clientID: data.clientID, answer })
        }
    }
    pcs.push(pc2)
})

const getSendMsg = () => {
    let msg = document.getElementById("msg").value

    if (msg.length == 0) return

    console.log(msg);
    socket.emit("message", msg)

    addMessage({ username: "me", msg }, 1)
}

const addMessage = (data, dir = 0) => {
    let chatArena = document.getElementById("chat-texts")

    let textHolder = document.createElement("div")
    textHolder.classList.add("text-holder")

    if (dir) {
        textHolder.classList.add("text-right")
    }

    let usernameDiv = document.createElement("div")
    usernameDiv.classList.add("username")
    usernameDiv.innerText = data.username || "Anonymous"

    let textMsg = document.createElement("div")
    textMsg.classList.add("text")
    textMsg.innerText = data.msg

    textHolder.appendChild(usernameDiv)
    textHolder.appendChild(textMsg)

    chatArena.appendChild(textHolder)

    let chatBox = document.getElementsByClassName("chat-area")[0]
    chatBox.scrollTop = chatBox.scrollHeight
}

const sendMessage = (msg) => {
    for (let i = 0; i < dcs.length; ++i) {
        dcs[i].send(msg)
    }
}

let focusFlag = 1
document.addEventListener("keydown", (e) => {
    // console.log(e.key);
    if (e.key == "Enter") {
        if (focusFlag) {
            changeUsername()
            focusFlag = 0
        }
        getSendMsg()
    }
})

document.getElementById("send").onclick = () => {
    getSendMsg()
}

document.getElementById("change-username").onclick = () => {
    changeUsername()
}

const changeUsername = () => {

    let temp = document.getElementById("username-inp")
    username = temp.value
    console.log(`my username: ${username}`);

    let userData = {
        "type": "name-change",
        "name": username
    }
    // console.log(userData);
    socket.emit("user-room", userData)

    let secs = document.getElementsByTagName("section")
    for (let i = 0; i < secs.length; ++i) {
        secs[i].style.filter = 'none'
    }
    document.getElementsByClassName("username-input")[0].style.display = "none"
}

window.onload = () => {
    socket.emit("user-room", { "type": "get-all" })
}