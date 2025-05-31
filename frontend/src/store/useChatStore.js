import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";
import { encryptMessage } from "../lib/crypto/encryptMessage.js";
import { decryptMessage } from "../lib/crypto/decryptMessage.js";
import {
  getConversationKey,
  storeConversationKey,
  getDecryptedPrivateKey,
} from "../lib/indexDB.js";
import { generateConversationKey } from "../lib/crypto/generateConversationKey.js";
import { encryptConversationKey } from "../lib/crypto/encryptConversationKey.js";
import { decryptConversationKey } from "../lib/crypto/decryptConversationKey.js";
export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isUserTyping: false,
  conversationKey: null,
  lastFetchedConversationId: null,

  setUserTyping: (senderId) => {   
    const {selectedUser} = get();
    if(senderId === selectedUser?._id){
    set({ isUserTyping: true });
    }
  },

  setUserStoppedTyping: (senderId) => {
    const{selectedUser} = get();
    if(senderId === selectedUser?._id){
    set({ isUserTyping: false });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;

    try {
      const conversationId = [authUser._id, selectedUser._id].sort().join("_");
      let conversationKey = await getConversationKey(conversationId);

      let { lastFetchedConversationId } = get();
      if (conversationId === lastFetchedConversationId) {
        return;
      }
      set({ lastFetchedConversationId: conversationId });

      if (!conversationKey) {
        const { data: conversations } = await axiosInstance.get(
          `/conversations/user/${authUser._id}`
        );

        await Promise.all(
          conversations.map(async (conv) => {
            if (conv.conversationId !== conversationId) return;

            const userEncryptedConversationKey = conv.encryptedKey;
            const decryptedPrivateKey = await getDecryptedPrivateKey(
              authUser._id
            );

            if (!userEncryptedConversationKey) return;

            try {
              const decryptedConversationKey = await decryptConversationKey(
                userEncryptedConversationKey,
                authUser.publicKey,
                decryptedPrivateKey
              );

              conversationKey = decryptedConversationKey;
              await storeConversationKey(
                conv.conversationId,
                decryptedConversationKey
              );
            } catch (err) {
              console.warn(
                `Failed to decrypt/store key for ${conv.conversationId}`,
                err
              );
            }
          })
        );
      }

      if (!conversationKey) {
        const generatedConversationKey = await generateConversationKey();
        conversationKey = generatedConversationKey;
        await storeConversationKey(conversationId, conversationKey);
        const encryptedConversationkeyUser1 = await encryptConversationKey(
          conversationKey,
          authUser.publicKey
        );
        const encryptedConversationkeyUser2 = await encryptConversationKey(
          conversationKey,
          selectedUser.publicKey
        );

        await axiosInstance.post("/conversations", {
          conversationId,
          participants: [authUser._id, selectedUser._id],
          encryptedKeys: {
            [authUser._id]: encryptedConversationkeyUser1,
            [selectedUser._id]: encryptedConversationkeyUser2,
          },
        });
      }

      set({ conversationKey });

      const res = await axiosInstance.get(`/messages/${userId}`);

      //message decrypted here

      const decryptedMessages = await Promise.all(
        res.data.map(async (msg) => {
          if (!msg.cipherText) return msg;
          try {
            const decryptedText = await decryptMessage(
              msg.cipherText,
              msg.nonce,
              conversationKey
            );
            return {
              ...msg,
              text: decryptedText,
              isEncrypted: false,
            };
          } catch (error) {
            console.error("Decryption failed", error);
            return {
              ...msg,
              text: "[Could not decrypt message]",
              isEncrypted: true,
              decryptionError: true,
            };
          }
        })
      );

      set({
        messages: decryptedMessages.filter((msg) => {
          if (!msg) return false;
          if (msg.decryptionError) return true;
          return !!msg.text || !!msg.image;
        }),
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    try {
      const { selectedUser, conversationKey } = get();

      const { cipherText, nonce } = await encryptMessage(
        messageData.text,
        conversationKey
      );

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        { cipherText, nonce, image: messageData.image }
      );

      const newMessage = {
        ...res.data,
        text: messageData.text,
        isEncrypted: false,
      };

      set((state) => ({ messages: [...state.messages, newMessage] }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const messageHandler = async (newMessage) => {
      //if message sent from selected user
      if (newMessage.senderId !== selectedUser._id) return;

      const { conversationKey } = get();

      if (newMessage.cipherText) {
        try {
          newMessage = {
            ...newMessage,
            text: await decryptMessage(
              newMessage.cipherText,
              newMessage.nonce,
              conversationKey
            ),
            isEncrypted: false,
          };
        } catch (error) {
          newMessage = {
            ...newMessage,
            text: "[could not decrypt]",
            isEncrypted: true,
            decryptionError: true,
          };
        }
      }

      set((state) => ({
        messages: [
          ...state.messages,
          ...(state.messages.some((m) => m._id === newMessage._id)
            ? []
            : [newMessage]),
        ],
      }));
    };

    socket.on("newMessage", messageHandler);

    return () => {
      socket.off("newMessage", messageHandler);
    };
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
  
  setSelectedUser: (selectedUser) => set({ selectedUser,
    isUserTyping: false
   }),
}));
