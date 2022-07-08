# Distributed Password Cracker (DPC) Demo
Demo of Distributed password cracker using webrtc to distribute load(set of range of possible password) to crack to each machine in the network.

# Working

1. You can either create a room or join one.
2. First user to create the room is the **master**, others are **client**.
3. Whenever a new client joins the room, the following course of events takes place:
    - Client creates an offer and send it to master.
    - Master receives the offer and generate an answer
    - Both find ICE candidates and connect P2P(peer to peer)
    - Thus communication begins 

# References
- https://github.com/xem/miniWebRTC

# Credits
- Illustrations: https://undraw.co/illustrations
- Icons: https://fontawesome.com/icons
- Logo: https://www.flaticon.com/free-icons/distribution-network
