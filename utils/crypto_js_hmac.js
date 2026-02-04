/**
 * HMAC-SHA256 加密工具 - 使用 crypto-js 库
 * 用于科大讯飞WebSocket鉴权
 *
 * 注意：需要先在微信开发者工具中点击"工具" -> "构建 npm"
 */

/**
 * 使用 crypto-js 计算 HMAC-SHA256
 * @param {string} message - 待签名的消息
 * @param {string} secret - 密钥
 * @returns {string} Base64编码的签名
 */
function hmacSha256(message, secret) {
    try {
        // crypto-js 构建后的路径
        const CryptoJS = require('crypto-js');

        // 计算 HMAC-SHA256
        const hash = CryptoJS.HmacSHA256(message, secret);

        // 转换为 Base64 字符串
        const base64Signature = hash.toString(CryptoJS.enc.Base64);

        return base64Signature;
    } catch (error) {
        console.error('HMAC-SHA256 计算失败:', error);
        throw error;
    }
}

/**
 * Base64 编码（使用 crypto-js）
 * @param {string} str - 字符串
 * @returns {string} Base64编码的字符串
 */
function base64Encode(str) {
    try {
        const CryptoJS = require('crypto-js');
        const words = CryptoJS.enc.Utf8.parse(str);
        return words.toString(CryptoJS.enc.Base64);
    } catch (error) {
        console.error('Base64 编码失败:', error);
        throw error;
    }
}

module.exports = {
    hmacSha256: hmacSha256,
    base64Encode: base64Encode
};
