// lib/encryptMessage.js
import sodium from 'libsodium-wrappers-sumo';

export const encryptMessage = async (message, symmetricKey) => {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipher = sodium.crypto_secretbox_easy(sodium.from_string(message), nonce, symmetricKey);

  return {
    cipherText: sodium.to_base64(cipher),
    nonce: sodium.to_base64(nonce)
  };
};
