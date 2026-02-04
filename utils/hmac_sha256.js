/**
 * HMAC-SHA256 加密工具
 * 用于科大讯飞WebSocket鉴权
 * 微信小程序兼容版本
 */

// SHA-256 常量
const SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ae, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

const SHA256_H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
];

// SHA-256 实现
function sha256(message) {
    const msgBytes = utf8Encode(message);
    const msgLen = msgBytes.length;
    const newLen = msgLen + 9;
    const padLen = newLen + (64 - newLen % 64) - 1;
    const padded = new Array(padLen);

    for (let i = 0; i < msgLen; i++) {
        padded[i] = msgBytes[i];
    }

    padded[msgLen] = 0x80;
    const msgBitLen = msgLen * 8;
    for (let i = 0; i < 8; i++) {
        padded[padLen - 8 + i] = (msgBitLen >>> (56 - i * 8)) & 0xff;
    }

    const chunks = [];
    for (let i = 0; i < padLen; i += 64) {
        chunks.push(padded.slice(i, i + 64));
    }

    let hashState = [...SHA256_H];

    for (const chunk of chunks) {
        const words = new Array(64);
        for (let i = 0; i < 16; i++) {
            words[i] = ((chunk[i * 4] & 0xff) << 24) |
                ((chunk[i * 4 + 1] & 0xff) << 16) |
                ((chunk[i * 4 + 2] & 0xff) << 8) |
                (chunk[i * 4 + 3] & 0xff);
        }

        for (let i = 16; i < 64; i++) {
            const w0 = words[i - 15];
            const w1 = words[i - 2];
            const s0 = rightRotate(w0, 7) ^ rightRotate(w0, 18) ^ (w0 >>> 3);
            const s1 = rightRotate(w1, 17) ^ rightRotate(w1, 19) ^ (w1 >>> 10);
            words[i] = (words[i - 16] + s0 + words[i - 7] + s1) | 0;
        }

        let [a, b, c, d, e, f, g, h] = hashState;

        for (let i = 0; i < 64; i++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + SHA256_K[i] + words[i]) | 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }

        hashState[0] = (hashState[0] + a) | 0;
        hashState[1] = (hashState[1] + b) | 0;
        hashState[2] = (hashState[2] + c) | 0;
        hashState[3] = (hashState[3] + d) | 0;
        hashState[4] = (hashState[4] + e) | 0;
        hashState[5] = (hashState[5] + f) | 0;
        hashState[6] = (hashState[6] + g) | 0;
        hashState[7] = (hashState[7] + h) | 0;
    }

    let result = '';
    for (let i = 0; i < 8; i++) {
        result += (hashState[i] >>> 0).toString(16).padStart(8, '0');
    }

    return result;
}

function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
}

function utf8Encode(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 0x80) {
            bytes.push(code);
        } else if (code < 0x800) {
            bytes.push(0xC0 | (code >> 6));
            bytes.push(0x80 | (code & 0x3F));
        } else if (code < 0xD800 || code >= 0xE000) {
            bytes.push(0xE0 | (code >> 12));
            bytes.push(0x80 | ((code >> 6) & 0x3F));
            bytes.push(0x80 | (code & 0x3F));
        } else {
            i++;
            const code2 = str.charCodeAt(i);
            const codePoint = 0x10000 + (((code & 0x3FF) << 10) | (code2 & 0x3FF));
            bytes.push(0xF0 | (codePoint >> 18));
            bytes.push(0x80 | ((codePoint >> 12) & 0x3F));
            bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
            bytes.push(0x80 | (codePoint & 0x3F));
        }
    }
    return bytes;
}

// HMAC-SHA256 实现 - 返回Base64编码
function hmacSha256(message, secret) {
    const messageBytes = utf8Encode(message);
    const secretBytes = utf8Encode(secret);

    let secretKey = secretBytes;
    if (secretKey.length > 64) {
        const hashResult = sha256(String.fromCharCode.apply(null, secretKey));
        secretKey = [];
        for (let i = 0; i < hashResult.length; i += 2) {
            secretKey.push(parseInt(hashResult.substr(i, 2), 16));
        }
    }

    while (secretKey.length < 64) {
        secretKey.push(0);
    }

    const ipad = [];
    const opad = [];
    for (let i = 0; i < 64; i++) {
        ipad[i] = secretKey[i] ^ 0x36;
        opad[i] = secretKey[i] ^ 0x5C;
    }

    const innerMessage = ipad.concat(messageBytes);
    const innerMessageStr = String.fromCharCode.apply(null, innerMessage);
    const innerHash = sha256(innerMessageStr);

    const innerHashBytes = [];
    for (let i = 0; i < innerHash.length; i += 2) {
        innerHashBytes.push(parseInt(innerHash.substr(i, 2), 16));
    }

    const outerMessage = opad.concat(innerHashBytes);
    const outerMessageStr = String.fromCharCode.apply(null, outerMessage);
    const finalHash = sha256(outerMessageStr);

    const hashBytes = [];
    for (let i = 0; i < finalHash.length; i += 2) {
        hashBytes.push(parseInt(finalHash.substr(i, 2), 16));
    }

    const uint8Array = new Uint8Array(hashBytes);
    return wx.arrayBufferToBase64(uint8Array.buffer);
}

// Base64 编码
function base64Encode(str) {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < str.length) {
        const a = str.charCodeAt(i++);
        const b = str.charCodeAt(i++);
        const c = str.charCodeAt(i++);

        const bitmap = (a << 16) | (b << 8) | c;

        result += base64Chars.charAt((bitmap >> 18) & 63);
        result += base64Chars.charAt((bitmap >> 12) & 63);
        result += (isNaN(b)) ? '=' : base64Chars.charAt((bitmap >> 6) & 63);
        result += (isNaN(b) || isNaN(c)) ? '=' : base64Chars.charAt(bitmap & 63);
    }

    return result;
}

module.exports = {
    hmacSha256: hmacSha256,
    base64Encode: base64Encode
};
