export type HttpCredentials = {
  username: string;
  password: string;
};

export type EncryptedCredentialBlob = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
  iterations: number;
};
