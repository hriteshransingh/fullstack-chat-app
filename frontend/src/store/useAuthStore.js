import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { decryptPrivateKey } from "../lib/crypto/decryptPrivateKey.js";
import { decryptConversationKey } from "../lib/crypto/decryptConversationKey.js";
import {
  storeConversationKey,
  storeDecryptedPrivateKey,
  clearAllKeys,
} from "../lib/indexDB.js";
const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
      console.log("Error in checkAuth:", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);

      set({ authUser: res.data });

      const { authUser } = get();

      const decryptedPrivateKey = await decryptPrivateKey(
        authUser.encryptedPrivateKey,
        data.password
      );
      await clearAllKeys();
      await storeDecryptedPrivateKey(authUser._id, decryptedPrivateKey);
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success(" Logged in successfully");
      const { authUser } = get();
      const publicKey = authUser.publicKey;

      const decryptedPrivateKey = await decryptPrivateKey(
        authUser.encryptedPrivateKey,
        data.password
      );
      await clearAllKeys();
      await storeDecryptedPrivateKey(authUser._id, decryptedPrivateKey);
      const { data: conversations } = await axiosInstance.get(
        `/conversations/user/${authUser._id}`
      );

      await Promise.all(
        conversations.map(async (conv) => {
          const userEncryptedConversationKey = conv.encryptedKey;

          if (!userEncryptedConversationKey) return;

          try {
            const decryptedConversationKey = await decryptConversationKey(
              userEncryptedConversationKey,
              publicKey,
              decryptedPrivateKey
            );

            await storeConversationKey(
              conv.conversationId,
              decryptedConversationKey
            );
          } catch {
            console.warn(
              `Failed to decrypt/store key for ${conv.conversationId}`,
              err
            );
          }
        })
      );
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("auth/logout");
      await clearAllKeys();
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket: socket });
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket.connected) get().socket.disconnect();
  },
}));
