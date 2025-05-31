// lib/indexedDB.js
import { openDB } from 'idb';


const dbPromise = openDB('ChatSecure', 2, {
  upgrade(db) {
    // Conversation keys store
    if (!db.objectStoreNames.contains('conversationKeys')) {
      db.createObjectStore('conversationKeys');
    }

    // Decrypted private keys store
    if (!db.objectStoreNames.contains('privateKeys')) {
      db.createObjectStore('privateKeys');
    }
  },
});

// Conversation key handlers
export const storeConversationKey = async (conversationId, key) => {
  const db = await dbPromise;
  await db.put('conversationKeys', key, conversationId);
};

export const getConversationKey = async (conversationId) => {
  const db = await dbPromise;
  return await db.get('conversationKeys', conversationId);
};

// Decrypted private key handlers
export const storeDecryptedPrivateKey = async (userId, privateKey) => {
  const db = await dbPromise;
  await db.put('privateKeys', privateKey, userId);
};

export const getDecryptedPrivateKey = async (userId) => {
  const db = await dbPromise;
  return await db.get('privateKeys', userId);
};


export const clearAllKeys = async () => {
  const db = await openDB('ChatSecure', 2);
  await db.clear('privateKeys');
  await db.clear('conversationKeys');
};