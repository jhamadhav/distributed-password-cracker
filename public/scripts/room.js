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

const sendMessage = (msg) => {
    for (let i = 0; i < dcs.length; ++i) {
        dcs[i].send(msg)
    }
}
