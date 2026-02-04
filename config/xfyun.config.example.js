/**
 * 科大讯飞API配置示例文件
 *
 * ⚠️ 重要提示：
 * 1. 请勿将此文件中的真实密钥提交到版本控制系统
 * 2. 复制此文件并重命名为 xfyun.config.js
 * 3. 填写你的真实API密钥信息
 */

module.exports = {
  // 科大讯飞方言识别大模型配置
  xfyun: {
    // 应用ID - 在讯飞开放平台控制台获取
    appId: '',

    // API密钥 - 在讯飞开放平台控制台获取
    apiKey: '',

    // API密钥 - 在讯飞开放平台控制台获取
    apiSecret: '',

    // WebSocket连接主机地址（华北节点）
    // 其他可选节点：
    // - iat.cn-north-1.xf-yun.com (北京)
    // - iat.cn-south-1.xf-yun.com (广州)
    // - iat.cn-east-3.xf-yun.com (上海)
    host: 'iat.cn-huabei-1.xf-yun.com',

    // 鉴权使用的host（必须是通用域名，用于签名）
    // 注意：这个参数在鉴权签名时使用，不能使用节点域名
    authHost: 'iat.xf-yun.com',

    // API路径
    path: '/v1'
  }
};
