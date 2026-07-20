import { describe, expect, it } from "vitest";
import { decryptCredentials, encryptCredentials } from "../src/services/credentialVault.js";
import { AppError } from "../src/utils/errorUtils.js";

describe("credentialVault", () => {
  it("encrypts and decrypts credentials", async () => {
    const blob = await encryptCredentials(
      { username: "user", password: "secret" },
      "master-pass",
      1000
    );
    const plain = await decryptCredentials(blob, "master-pass");
    expect(plain).toEqual({ username: "user", password: "secret" });
  });

  it("fails with wrong passphrase", async () => {
    const blob = await encryptCredentials(
      { username: "user", password: "secret" },
      "master-pass",
      1000
    );
    await expect(decryptCredentials(blob, "wrong-pass")).rejects.toBeInstanceOf(AppError);
  });

  it("rejects short passphrases", async () => {
    await expect(
      encryptCredentials({ username: "user", password: "secret" }, "short", 1000)
    ).rejects.toBeInstanceOf(AppError);
  });
});
