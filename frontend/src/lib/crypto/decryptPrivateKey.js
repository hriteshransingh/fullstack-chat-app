import sodium from "libsodium-wrappers-sumo";

export const decryptPrivateKey = async (encryptedPrivateKey, password) => {
  await sodium.ready;

  // Destructure and decode from Base64 to Uint8Array
  const ciphertext = sodium.from_base64(encryptedPrivateKey.ciphertext);
  const salt = sodium.from_base64(encryptedPrivateKey.salt);
  const nonce = sodium.from_base64(encryptedPrivateKey.nonce);
  const passwordBytes = sodium.from_string(password);

  // Derive the same key using Argon2id and original salt
  const key = sodium.crypto_pwhash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    passwordBytes,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  // Decrypt using the same method and parameters
  const privateKey = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,      // No additional data
    ciphertext,
    null,      // No secret nonce
    nonce,
    key
  );

  // Convert decrypted private key back to string
  return sodium.to_string(privateKey);
};
