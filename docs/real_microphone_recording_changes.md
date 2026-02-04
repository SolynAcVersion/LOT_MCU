# 恢复真实麦克风录音功能

## 修改时间
2026-02-03

## 修改概述
将语音识别功能从测试模式恢复为真实麦克风录音，并配置为PCM格式以符合讯飞API要求。

---

## 主要修改

### 1. 恢复真实录音功能

#### 修改位置：pages/chatting/chatting.js - startRecording函数

**修改前（测试模式）：**
```javascript
startRecording: function() {
    const that = this;

    // ... 检查配置 ...

    that.setData({
        isRecording: true,
        voiceText: ''
    });

    wx.vibrateShort();
    wx.showToast({
        title: '正在生成测试音频...',
        icon: 'loading',
        duration: 1000
    });

    // 生成测试音频文件并发送
    that.generateAndSendTestAudio();
}
```

**修改后（真实录音）：**
```javascript
startRecording: function() {
    const that = this;

    // ... 检查配置 ...

    // 开始录音（PCM格式）
    that.recorderManager.start({
        duration: 60000,        // 最长60秒
        sampleRate: 16000,      // 采样率16kHz
        numberOfChannels: 1,    // 单声道
        encodeBitRate: 48000,   // 编码比特率
        format: 'raw'           // PCM格式（讯飞API要求）
    });

    that.setData({
        isRecording: true,
        voiceText: ''
    });

    wx.vibrateShort();
    wx.showToast({
        title: '开始录音...',
        icon: 'none',
        duration: 1000
    });
}
```

**关键变化：**
- ❌ 删除：生成测试音频的调用
- ✅ 添加：使用 `recorderManager.start()` 启动真实录音
- ✅ 配置：录音格式从 `'mp3'` 改为 `'raw'`（PCM）

---

### 2. 配置PCM录音格式

#### 录音参数说明

| 参数 | 值 | 说明 |
|------|-----|------|
| duration | 60000 | 最长录音时间60秒 |
| sampleRate | 16000 | 采样率16kHz（讯飞API要求） |
| numberOfChannels | 1 | 单声道 |
| encodeBitRate | 48000 | 编码比特率 |
| format | 'raw' | **PCM格式**（关键修改） |

**为什么使用PCM格式？**
- 讯飞方言识别API要求音频为PCM（raw）格式
- MP3格式会导致识别失败或返回错误
- PCM是无损格式，保证识别准确率

---

### 3. 修改音频处理流程

#### 修改位置：pages/chatting/chatting.js - readAudioAndRecognize函数

**修改前：**
```javascript
readAudioAndRecognize: function(audioFilePath) {
    const that = this;

    wx.getFileSystemManager().readFile({
        filePath: audioFilePath,
        encoding: 'base64',
        success: function(res) {
            console.log('音频文件读取成功，大小:', res.data.length);
            // 直接连接WebSocket
            that.audioDataBase64 = res.data;
            that.connectWebSocket();
        },
        fail: function(err) {
            // ... 错误处理 ...
        }
    });
}
```

**修改后：**
```javascript
readAudioAndRecognize: function(audioFilePath) {
    const that = this;

    wx.getFileSystemManager().readFile({
        filePath: audioFilePath,
        encoding: 'base64',
        success: function(res) {
            console.log('音频文件读取成功，大小:', res.data.length);

            // 使用代理服务器调用讯飞API
            if (that.data.xfyun.useProxy) {
                that.callProxyServer(res.data);
            } else {
                // 如果不使用代理，直接连接WebSocket
                that.audioDataBase64 = res.data;
                that.connectWebSocket();
            }
        },
        fail: function(err) {
            // ... 错误处理 ...
        }
    });
}
```

**关键变化：**
- ✅ 添加：检查是否使用代理服务器
- ✅ 优先：通过代理服务器调用（绕过HMAC-SHA256签名问题）
- ✅ 降级：如果不使用代理，则直接连接WebSocket

---

### 4. 注释测试代码

#### 修改位置：pages/chatting/chatting.js - generateAndSendTestAudio函数

**完全注释掉以下测试代码：**
```javascript
/*
// 生成并发送测试音频（已废弃 - 使用真实录音功能）
generateAndSendTestAudio: function() {
    const that = this;

    // 生成1秒的PCM静音数据（16000采样率 * 2字节/采样点 * 1秒 = 32000字节）
    const sampleRate = 16000;
    const duration = 1; // 1秒
    const totalSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(totalSamples * 2); // 16位 = 2字节
    const view = new Int16Array(buffer);

    // 填充静音数据（全0）
    for (let i = 0; i < totalSamples; i++) {
        view[i] = 0;
    }

    // 转换为Base64
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = wx.arrayBufferToBase64(buffer);

    console.log('测试音频生成成功，大小:', base64Data.length);

    // 使用代理服务器调用讯飞API
    that.callProxyServer(base64Data);
},
*/
```

---

### 5. 同步修改备份函数

#### 修改位置：pages/chatting/chatting.js - startRecordingBackup函数

同样将备份函数的录音格式改为 `'raw'`：

```javascript
// 备份：开始录音（按住触发）
startRecordingBackup: function() {
    const that = this;

    // ... 检查配置 ...

    // 开始录音（PCM格式）
    that.recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'raw' // PCM格式（讯飞API要求）
    });

    // ... 状态更新 ...
}
```

---

## 完整工作流程

### 用户操作流程

```
1. 用户按下录音按钮
   ↓
2. 触发 startRecording()
   ↓
3. 调用 recorderManager.start() 开始录音
   - 格式：PCM (raw)
   - 采样率：16kHz
   - 时长：最长60秒
   ↓
4. 用户松开按钮
   ↓
5. 触发 stopRecording()
   ↓
6. 录音停止，触发 onStop 回调
   ↓
7. 调用 handleRecordingStop()
   ↓
8. 调用 readAudioAndRecognize()
   - 读取音频文件为Base64
   - 通过代理服务器发送
   ↓
9. 代理服务器调用讯飞API
   ↓
10. 返回识别结果
    ↓
11. 显示在聊天界面
```

---

## 配置验证

### config/xfyun.config.js 确保配置正确

```javascript
module.exports = {
  xfyun: {
    appId: 'bfcf5342',
    apiKey: 'c5836bcbb370e34dd19ffc0edbb2a0dc',
    apiSecret: 'ODMwNGYzN2Y3YmUwYjQ3MzJkN2MwNjFj',
    host: 'iat.cn-huabei-1.xf-yun.com',
    path: '/v1',

    // 使用代理服务器
    useProxy: true,
    proxyUrl: 'http://localhost:5000/api/recognize'
  }
};
```

---

## 测试步骤

### 开发环境测试

1. **启动代理服务器**
   ```bash
   cd d:\github_fork\LOT_MCU
   py xfyun_proxy_server.py
   ```

2. **在微信开发者工具中编译项目**

3. **测试录音功能**
   - 点击录音按钮
   - 对着麦克风说话
   - 松开按钮
   - 查看识别结果

### 预期结果

- ✅ 录音开始时显示"开始录音..."
- ✅ 松开按钮后自动发送到代理服务器
- ✅ 代理服务器显示请求日志
- ✅ 返回识别结果
- ✅ 聊天界面显示识别文字

### 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 录音没有声音 | 麦克风权限未开启 | 开启麦克风权限 |
| 返回空结果 | 音频太短或太轻 | 录音至少1秒，说话清晰 |
| 代理服务器无响应 | 服务器未启动 | 运行 `py xfyun_proxy_server.py` |
| 识别错误 | 格式不匹配 | 确认format='raw' |

---

## 技术要点

### PCM vs MP3

| 特性 | PCM (raw) | MP3 |
|------|-----------|-----|
| 格式类型 | 无损原始音频 | 有损压缩 |
| 讯飞兼容性 | ✅ 完全支持 | ❌ 不支持 |
| 文件大小 | 较大 | 较小 |
| 音质 | 高 | 中等 |
| 编解码 | 无需编码 | 需要编码/解码 |

**结论：** 讯飞API严格要求PCM格式，必须使用 `'raw'`。

### 代理服务器的必要性

由于微信小程序JavaScript环境无法正确生成HMAC-SHA256签名，必须使用代理服务器：
- ✅ 正确生成签名
- ✅ 分帧发送音频
- ✅ 处理WebSocket连接

---

## 代码变更总结

### 修改的文件
- `pages/chatting/chatting.js` - 恢复真实录音功能

### 修改的函数
1. `startRecording()` - 主要录音函数
2. `startRecordingBackup()` - 备份录音函数
3. `readAudioAndRecognize()` - 音频处理函数

### 注释的函数
1. `generateAndSendTestAudio()` - 测试音频生成（已废弃）

### 新增代码行数
- 实际新增：约10行
- 注释代码：约30行

---

## 后续优化建议

1. **添加录音状态提示**
   - 录音中显示动画
   - 显示录音时长

2. **优化音频质量**
   - 调整采样率和比特率
   - 添加音频增益处理

3. **错误处理增强**
   - 网络超时处理
   - 代理服务器不可用时的降级方案

4. **用户体验**
   - 添加震动反馈
   - 播放录音预览

---

**文档版本：** 1.0
**最后更新：** 2026-02-03
**状态：** ✅ 已测试通过
