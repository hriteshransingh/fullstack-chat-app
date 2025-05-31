import sodium from "libsodium-wrappers-sumo";

export const encryptPrivateKey = async (privateKeyString, password) => {
  await sodium.ready;

  // Convert inputs to Uint8Arrays
  const privateKey = sodium.from_string(privateKeyString);
  const passwordBytes = sodium.from_string(password);

  // Generate salt for key derivation
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

  // Derive a key from the password using Argon2id
  const key = sodium.crypto_pwhash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, // 32 bytes
    passwordBytes,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  // Generate a nonce for encryption
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );

  // Encrypt the private key
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    privateKey,
    null, // No additional data
    null, // No secret nonce
    nonce,
    key
  );

  return {
    ciphertext: sodium.to_base64(ciphertext),
    salt: sodium.to_base64(salt),
    nonce: sodium.to_base64(nonce),
  };
};
