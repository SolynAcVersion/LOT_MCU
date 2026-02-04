/**
 * HMAC-SHA256 加密工具 - 使用微信小程序 Crypto API
 * 用于科大讯飞WebSocket鉴权
 */

/**
 * 使用 Web Crypto API 计算 HMAC-SHA256
 * @param {string} message - 待签名的消息
 * @param {string} secret - 密钥
 * @returns {Promise<string>} Base64编码的签名
 */
function hmacSha256WithCrypto(message, secret) {
    return new Promise((resolve, reject) => {
        try {
            // 将字符串转换为ArrayBuffer
            const encoder = new TextEncoder();
            const messageBuffer = encoder.encode(message);
            const keyBuffer = encoder.encode(secret);

            // 导入密钥
            crypto.subtle.importKey(
                'raw',                    // 密钥格式
                keyBuffer,                // 密钥数据
                {                         // 算法参数
                    name: 'HMAC',
                    hash: { name: 'SHA-256' }
                },
                false,                   // 密钥不可导出
                ['sign']                  // 密钥用途
            ).then(key => {
                // 使用密钥进行签名
                return crypto.subtle.sign(
                    {
                        name: 'HMAC',
                        hash: { name: 'SHA-256' }
                    },
                    key,
                    messageBuffer
                );
            }).then(signature => {
                // 将签名结果转换为Base64
                const base64Signature = arrayBufferToBase64(signature);
                resolve(base64Signature);
            }).catch(error => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 将 ArrayBuffer 转换为 Base64
 * @param {ArrayBuffer} buffer - 二进制数据
 * @returns {string} Base64编码的字符串
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return wx.arrayBufferToBase64(buffer);
}

/**
 * Base64 编码（备用方案）
 * @param {string} str - 字符串
 * @returns {string} Base64编码的字符串
 */
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

/**
 * HMAC-SHA256 签名函数（主入口）
 * @param {string} message - 待签名的消息
 * @param {string} secret - 密钥
 * @returns {Promise<string>} Base64编码的签名
 */
async function generateHmacSha256(message, secret) {
    try {
        // 优先使用 Web Crypto API
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const signature = await hmacSha256WithCrypto(message, secret);
            return signature;
        } else {
            // 如果 crypto API 不可用，使用备用实现
            // 这里可以调用之前的纯JavaScript实现
            console.warn('Web Crypto API 不可用，使用备用实现');
            return hmacSha256Fallback(message, secret);
        }
    } catch (error) {
        console.error('HMAC-SHA256 计算失败:', error);
        throw error;
    }
}

/**
 * HMAC-SHA256 备用实现（纯JavaScript）
 * 当 Web Crypto API 不可用时使用
 */
function hmacSha256Fallback(message, secret) {
    // 这里使用之前的实现作为备用
    const { hmacSha256: legacyHmac } = require('./hmac_sha256.js');
    return legacyHmac(message, secret);
}

module.exports = {
    hmacSha256: generateHmacSha256,
    arrayBufferToBase64: arrayBufferToBase64,
    base64Encode: base64Encode
};
