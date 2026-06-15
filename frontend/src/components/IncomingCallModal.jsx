import React, { useEffect, useState } from "react";

const IncomingCallModal = ({
  incomingCall,
  acceptCall,
  rejectCall,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [incomingCall]);

  if (!incomingCall || !isVisible) return null;

  return (
    <>
      {/* Backdrop blur */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
      
      {/* WhatsApp-style incoming call card - center on screen */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 z-50 animate-slide-up">
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Caller info */}
          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <span className="text-3xl text-white font-bold">
                {incomingCall.callerName?.charAt(0) || "U"}
              </span>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-1">
              {incomingCall.callerName}
            </h3>
            <p className="text-green-400 text-sm flex items-center justify-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Incoming video call...
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 p-4 bg-gray-900">
            <button
              onClick={rejectCall}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
              Decline
            </button>
            <button
              onClick={acceptCall}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Accept
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default IncomingCallModal;