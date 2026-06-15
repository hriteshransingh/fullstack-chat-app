 import peer from "../service/peer.js";

 
 
 const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const offer = peer.getOffer();

    if (myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }

    socket.emit("webrtcOffer", {
      offer,
      receiverId: selectedUser._id,
    });


  }, [socket, peer, myVideoRef]);