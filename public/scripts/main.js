let linkLen = 12
let s = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

const rand = (min = 0, max = 1) => {
    return Math.floor(Math.random() * (max - min) + min);
}

const getUUID = () => {
    // id format = xxx-xxxx-xxx
    let format = "xxx-xxxx-xxx"
    let res = ""
    for (let i = 0; i < format.length; ++i) {
        if (format[i] == '-') {
            res += "-"
            continue
        }

        let index = rand(0, s.length)
        res += s[index];
    }
    return res
}

document.getElementById("create").onclick = () => {
    let roomID = getUUID()
    console.log(roomID);
    window.location = `/room/${roomID}`
}

document.getElementById("join").onclick = () => {
    let roomID = document.getElementById("roomID").value

    if (roomID.toString().length < linkLen) {
        console.log("Invalid room id")
        return 0;
    }
    if (roomID.includes("https://") || roomID.includes("http://")) {
        window.location = roomID
        return 0;
    }
    window.location = `/room/${roomID}`
}

// style for input button
let inpBtn = document.getElementById("roomID")
inpBtn.oninput = () => {
    let joinBtn = document.getElementById("join")
    console.log(inpBtn.value.length);

    joinBtn.style.color = "#0477fd"
    if (inpBtn.value.length == 0) {
        joinBtn.style.color = "white"

    }
    if (inpBtn.value.length >= linkLen) {
        joinBtn.disabled = false
        joinBtn.style.background = "#0477fd"
        joinBtn.style.color = "white"
    } else {
        joinBtn.disabled = true
        joinBtn.style.background = "transparent"
    }
}