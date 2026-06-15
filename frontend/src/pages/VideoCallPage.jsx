import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore.js";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import peer from "../service/peer.js";

const VideoCallPage = () => {
  const { socket, authUser } = useAuthStore();
  const navigate = useNavigate();
  const { selectedUser } = useChatStore();
  const { id: callerId } = useParams();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  const myVideoRef = useRef(null);
  const otherVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const isStreamSetupRef = useRef(false);
  const offerSentRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]); // Queue for ICE candidates

  const getTargetUserId = () => {
    if (selectedUser?._id) return selectedUser._id;
    return callerId;
  };

  const isCaller = !!selectedUser;

  // Call duration timer
  useEffect(() => {
    if (isCallActive && !isConnecting) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const duration = Math.floor(
          (Date.now() - callStartTimeRef.current) / 1000,
        );
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isCallActive, isConnecting]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Setup local media stream
  const setupLocalStream = async () => {
    if (isStreamSetupRef.current) {
      return localStreamRef.current;
    }

    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setCameraError(null);
      localStreamRef.current = stream;
      isStreamSetupRef.current = true;

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setCameraError(err.name);

      if (err.name === "NotAllowedError") {
        toast.error("Please allow camera and microphone access");
      } else if (err.name === "NotFoundError") {
        toast.error("No camera or microphone found");
      } else if (err.name === "NotReadableError") {
        toast.error("Camera is in use by another application");
      }

      return null;
    }
  };

  // Flush queued ICE candidates after remoteDescription is set
  const flushPendingIceCandidates = async () => {
    if (pendingIceCandidatesRef.current.length === 0) return;

    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        if (peer.peer && peer.peer.remoteDescription) {
          await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding queued ICE candidate:", err);
      }
    }

    // Clear the queue
    pendingIceCandidatesRef.current = [];
  };

  // Send offer to receiver (called after call is accepted)
  const sendOfferToReceiver = async () => {
    if (offerSentRef.current) {
      return;
    }

    try {
      offerSentRef.current = true;

      const stream = localStreamRef.current;
      if (!stream) {
        console.error("No stream available");
        return;
      }

      // Initialize peer if not already
      await peer.initPeer();

      // Clear any existing tracks
      if (peer.peer.getSenders) {
        const senders = peer.peer.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            peer.peer.removeTrack(sender);
          }
        });
      }

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peer.peer.addTrack(track, stream);
      });

      // Set up ontrack BEFORE creating offer
      peer.peer.ontrack = (event) => {
        if (otherVideoRef.current) {
          otherVideoRef.current.srcObject = event.streams[0];
          setIsConnecting(false);
        }
      };

      // Create offer
      const offer = await peer.getOffer();

      socket.emit("webrtc:offer", {
        offer,
        toUserId: getTargetUserId(),
        fromUserId: authUser?._id,
      });
    } catch (err) {
      console.error("Error sending offer:", err);
      toast.error("Failed to send call offer");
      offerSentRef.current = false;
    }
  };

  // Start call (caller - only sets up stream, doesn't send offer yet)
  const startCall = async () => {
    try {
      setIsConnecting(true);

      const stream = await setupLocalStream();
      if (!stream) {
        setIsConnecting(false);
        return;
      }
    } catch (err) {
      console.error("Error starting call:", err);
      toast.error("Failed to start call");
      endCall();
    }
  };

  // Handle incoming offer (callee)
  const handleOfferReceived = async ({ offer, fromUserId }) => {
    try {
      setIsConnecting(true);

      // Setup local stream first
      const stream = await setupLocalStream();
      if (!stream) return;

      // Initialize peer
      await peer.initPeer();

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peer.peer.addTrack(track, stream);
      });

      // Set up ontrack BEFORE setting remote description
      peer.peer.ontrack = (event) => {
        if (otherVideoRef.current) {
          otherVideoRef.current.srcObject = event.streams[0];
          setIsConnecting(false);
        }
      };

      // Set remote description and create answer
      await peer.peer.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      await flushPendingIceCandidates();

      const answer = await peer.peer.createAnswer();
      await peer.peer.setLocalDescription(answer);

      // Send answer back to caller
      socket.emit("webrtc:answer", {
        answer: answer,
        toUserId: fromUserId,
      });
    } catch (err) {
      console.error("Error handling offer:", err);
      toast.error("Failed to accept call");
      endCall();
    }
  };

  // Handle answer (caller receives this)
  const handleAnswerReceived = async ({ answer }) => {
    try {
      if (peer.peer && peer.peer.currentRemoteDescription === null) {
        await peer.peer.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush queued ICE candidates
        await flushPendingIceCandidates();
      }
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  };

  // Handle ICE candidates - Queue them if remoteDescription not ready
  const handleIceCandidate = async ({ candidate }) => {
    if (peer.peer && peer.peer.remoteDescription) {
      // Remote description is ready, add candidate immediately
      try {
        await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    } else {
      // Remote description not ready, queue the candidate
      pendingIceCandidatesRef.current.push(candidate);
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Offer received (for callee)
    const handleOffer = (data) => {
      handleOfferReceived(data);
    };

    // Answer received (for caller)
    const handleAnswer = (data) => {
      handleAnswerReceived(data);
    };

    // ICE candidate received
    const handleIce = (data) => {
      handleIceCandidate(data);
    };

    // Call accepted (for caller)
    const handleCallAccepted = (data) => {
      sendOfferToReceiver();
    };

    const handleCallRejected = () => {
      setTimeout(() => {
        toast.error("Call declined");
        navigate("/");
      }, 1000);
    };
    // Call ended by remote
    const handleCallEnded = () => {
      endCall();
    };

    // Register all event listeners
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIce);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callRejected", handleCallRejected);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIce);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callRejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
    };
  }, [socket]);

  // Setup peer connection event handlers
  useEffect(() => {
    const setupPeerEvents = async () => {
      await peer.initPeer();

      if (!peer.peer) return;

      peer.peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            candidate: event.candidate,
            toUserId: getTargetUserId(),
          });
        }
      };

      peer.peer.onconnectionstatechange = () => {
        if (peer.peer.connectionState === "connected") {
          setIsConnecting(false);
          toast.success("Call connected");
        }
      };

      peer.peer.oniceconnectionstatechange = () => {};
    };

    if (socket) {
      setupPeerEvents();
    }
  }, [socket]);

  // Determine if caller or callee
  useEffect(() => {
    if (isCaller) {
      startCall();
    } else {
      setupLocalStream();
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peer.peer) {
        peer.peer.close();
        peer.peer = null;
      }
      isStreamSetupRef.current = false;
      offerSentRef.current = false;
      pendingIceCandidatesRef.current = []; // Clear ICE queue
    };
  }, []);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      toast.success(isMuted ? "Microphone unmuted" : "Microphone muted");
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
      toast.success(isVideoOff ? "Video turned on" : "Video turned off");
    }
  };

  const retryCamera = () => {
    setCameraError(null);
    isStreamSetupRef.current = false;
    setupLocalStream();
  };

  const endCall = () => {
    if (isCallActive) {
      socket.emit("call:end", { toUserId: getTargetUserId() });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (peer.peer) {
        peer.peer.close();
        peer.peer = null;
      }

      isStreamSetupRef.current = false;
      offerSentRef.current = false;
      pendingIceCandidatesRef.current = []; // Clear ICE queue
      setIsCallActive(false);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  if (cameraError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-xl max-w-md">
          <div className="text-red-500 text-6xl mb-4">📷</div>
          <h2 className="text-xl text-white mb-2">Camera/Microphone Error</h2>
          <p className="text-gray-400 mb-4">
            {cameraError === "NotReadableError"
              ? "Your camera is in use by another application. Please close other apps using your camera and try again."
              : "Unable to access camera or microphone."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryCamera}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCallActive) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-2">Call Ended</h2>
          <p className="text-gray-400 mb-6">{formatDuration(callDuration)}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Remote video */}
      <video
        ref={otherVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover fixed inset-0"
      />

      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Connecting...</p>
          </div>
        </div>
      )}

      {/* My video */}
      <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-blue-500 z-10">
        <video
          ref={myVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-0.5 rounded text-xs text-white">
          You {isVideoOff && "(Video Off)"}
        </div>
      </div>

      {/* Call duration */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-lg z-10">
        <span className="text-white">{formatDuration(callDuration)}</span>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${
            isMuted ? "bg-red-500" : "bg-gray-700"
          } hover:opacity-80 transition`}
        >
          {isMuted ? (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            isVideoOff ? "bg-red-500" : "bg-gray-700"
          } hover:opacity-80 transition`}
        >
          {isVideoOff ? (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        <button
          onClick={endCall}
          className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 18l6-6-6-6M8 6l-6 6 6 6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;
