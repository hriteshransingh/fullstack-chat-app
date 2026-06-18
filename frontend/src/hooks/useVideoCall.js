import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { WebSocket } from "socket.io-client";

const useVideoCall = () => {
  const { socket, authUser, incomingCall, setIncomingCall, onlineUsers } =
    useAuthStore();

  const { selectedUser } = useChatStore();

  const ringtoneRef = useRef(null);

  const callRejectedHandledRef = useRef(false);

  const navigate = useNavigate();

  // Start video call
  const handleVideoCall = () => {
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error("Can't call, user is offline");
      return;
    }
    try {
      navigate(`/video-call/${selectedUser._id}`);
      setTimeout(() => {
        socket.emit("startVideoCall", {
          senderId: authUser._id,
          receiverId: selectedUser._id,
          callerName: authUser.fullName,
        });
      }, 1000);

      toast.success("Calling...");
    } catch (error) {
      console.log("Failed to start video call", error);
    }
  };

  // Stop ringtone
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // Listen for incoming calls

  // Play ringtone + timeout
  useEffect(() => {
    if (incomingCall) {
      ringtoneRef.current = new Audio("/ringtone.mp3");

      ringtoneRef.current.loop = true;

      ringtoneRef.current.play();

      const timer = setTimeout(() => {
        stopRingtone();

        setIncomingCall(null);
        socket.emit("rejectVideoCall", { callerId: incomingCall.senderId });
        toast.error("Missed video call");
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [incomingCall]);

  // Accept call
  const acceptCall = () => {
    stopRingtone();

    navigate(`/video-call/${incomingCall.senderId}`);
    //this will be send by the receiver

    //---added
    socket.emit("callAccepted", { senderId: incomingCall.senderId });

    setIncomingCall(null);
  };

  // Reject call
  const rejectCall = () => {
    stopRingtone();
    socket.emit("rejectVideoCall", { callerId: incomingCall.senderId });
    setIncomingCall(null);
    toast.error("Call rejected");
  };

  const cancelCall = () => {
    stopRingtone();
    setTimeout(() => {
      setIncomingCall(null);
    }, 1000);
  };

  return {
    incomingCall,
    handleVideoCall,
    acceptCall,
    rejectCall,
    cancelCall,
  };
};

export default useVideoCall;
