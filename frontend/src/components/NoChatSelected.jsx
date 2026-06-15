import { MessageSquare } from "lucide-react";
import useVideoCall from "../hooks/useVideoCall.js";
import IncomingCallModal from "../components/IncomingCallModal.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import { useEffect } from "react";

const NoChatSelected = () => {
  const { acceptCall, rejectCall, cancelCall } = useVideoCall();
  const { incomingCall, socket } = useAuthStore();

  useEffect(() => {
    socket.on("callRejected", cancelCall);
    return () => {
      socket.off("callRejected", cancelCall);
    }
  }, [socket]);

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageSquare className="w-8 h-8 text-primary " />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to Convo!</h2>
        <p className="text-base-content/60">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
      {/* Incoming video call popup */}
      <IncomingCallModal
        incomingCall={incomingCall}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
      />
    </div>
  );
};

export default NoChatSelected;
