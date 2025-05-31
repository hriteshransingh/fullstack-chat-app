// lib/decryptConversationKey.js
import sodium from 'libsodium-wrappers-sumo';

export const decryptConversationKey = async (encryptedConversationKeyBase64, userPublicKeyBase64, userPrivateKeyBase64) => {
  await sodium.ready;

  const encrypted = sodium.from_base64(encryptedConversationKeyBase64);
  const publicKey = sodium.from_base64(userPublicKeyBase64);
  const privateKey = sodium.from_base64(userPrivateKeyBase64);

  const decrypted = sodium.crypto_box_seal_open(encrypted, publicKey, privateKey);

  if (!decrypted) {
    throw new Error('Failed to decrypt the conversation key');
  }

  return decrypted; // Uint8Array, symmetric conversation key
};
