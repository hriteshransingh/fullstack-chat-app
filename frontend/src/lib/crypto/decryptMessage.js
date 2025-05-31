// lib/decryptMessage.js
import sodium from 'libsodium-wrappers-sumo';

export const decryptMessage = async (cipherTextBase64, nonceBase64, symmetricKey) => {
  await sodium.ready;
  const cipherText = sodium.from_base64(cipherTextBase64);
  const nonce = sodium.from_base64(nonceBase64);
  const decrypted = sodium.crypto_secretbox_open_easy(cipherText, nonce, symmetricKey);

  return sodium.to_string(decrypted);
};
