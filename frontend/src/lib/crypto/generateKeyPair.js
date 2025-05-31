import sodium from "libsodium-wrappers";


export const generateKeyPair = async () => {
  await sodium.ready; 

  const keyPair = sodium.crypto_box_keypair();

;

  return keyPair;
};
