// lib/encryptConversationKey.js
import sodium from 'libsodium-wrappers-sumo';

export const encryptConversationKey = async (conversationKeyUint8, publicKeyBase64) => {
  
  
  await sodium.ready;

  const publicKey = sodium.from_base64(publicKeyBase64);

  const sealed = sodium.crypto_box_seal(conversationKeyUint8, publicKey);

  return sodium.to_base64(sealed); // encrypted conversation key (string)
};
