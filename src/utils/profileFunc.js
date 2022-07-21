const profileColor = [
    "#267365",
    "#F29F05",
    "#F23030",
    "#F28705"
]

const getRandColor = () => {
    return profileColor[Math.floor(Math.random() * (profileColor.length))]
}

const makeRandPic = () => {
    let res = ""
    for (let i = 0; i < 25; ++i) {
        res += (Math.random() < 0.4) ? "1" : "0"
    }
    return res
}
module.exports = { makeRandPic, getRandColor }