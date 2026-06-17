import { X, VideoIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useRef, useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios.js";
import useVideoCall from "../hooks/useVideoCall.js";
import  IncomingCallModal from "../components/IncomingCallModal.jsx";



const ChatHeader = () => {
  const { selectedUser, setSelectedUser, isUserTyping, sendMessage } =
    useChatStore();
  const { onlineUsers, authUser, incomingCall, socket } = useAuthStore();

  const { handleVideoCall, acceptCall, rejectCall, cancelCall} = useVideoCall();


  useEffect(()=>{
    if (!socket) return;
    socket.on("callRejected", cancelCall);
    return ()=>{
      socket.off("callRejected", cancelCall);
    }
  },[socket]);
  



  return (
    <div className="p-2.5 border-b border-base-300 ">
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <div className="text-sm text-base-content/70">
              {isUserTyping ? (
                <p className="text-gray-500 text-sm">typing...</p>
              ) : onlineUsers.includes(selectedUser._id) ? (
                "Online"
              ) : (
                "Offline"
              )}
            </div>
          </div>
        </div>
        <div className=" flex items-center gap-3">
          <button
            onClick={() => {
              handleVideoCall();
            }}
          >
            <VideoIcon />
          </button>

          {/* Close button */}

          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>

      {/* Incoming video call popup */}
      <IncomingCallModal
      incomingCall={incomingCall}
      selectedUser = {selectedUser}
      acceptCall = {acceptCall}
      rejectCall = {rejectCall}
      />

      
    </div>
  );
};
export default ChatHeader;
