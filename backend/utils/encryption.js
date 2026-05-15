import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveUserKey(userId) {
    const masterSecret = process.env.ENC_MASTER_SECRET;
    if (!masterSecret) throw new Error("ENC_MASTER_SECRET not set");
    return hkdfSync("sha256", masterSecret, userId, "firesync-data-key", KEY_LENGTH);
}

export function encrypt(plaintext, userId) {
    const key = deriveUserKey(userId);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return JSON.stringify({
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
        ciphertext: encrypted.toString("hex"),
    });
}

export function decrypt(encryptedJson, userId) {
    const key = deriveUserKey(userId);
    const { iv, tag, ciphertext } = JSON.parse(encryptedJson);
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, "hex")),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
