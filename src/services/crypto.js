import CryptoJS from 'crypto-js';

/**
 * Derives a key from a master password using PBKDF2
 */
export const deriveKey = (password, salt) => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000
  });
};

/**
 * Encrypts data using a master password
 */
export const encryptData = (data, password) => {
  try {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const key = deriveKey(password, salt);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    return {
      ciphertext: encrypted.toString(),
      salt: salt.toString(),
      iv: iv.toString()
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypts data using a master password
 */
export const decryptData = (encryptedObj, password) => {
  try {
    const salt = CryptoJS.enc.Hex.parse(encryptedObj.salt);
    const iv = CryptoJS.enc.Hex.parse(encryptedObj.iv);
    const key = deriveKey(password, salt);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedObj.ciphertext, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Invalid master password or corrupted data");
  }
};

/**
 * Generates a random strong password
 */
export const generatePassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};
