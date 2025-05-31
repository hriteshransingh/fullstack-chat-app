import sodium from 'libsodium-wrappers-sumo';

export const generateConversationKey = async () => {
  await sodium.ready;

  // Generate a random 32-byte symmetric key
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);

  return key; // Uint8Array
};
