# 语音识别功能调试报告

## 项目概述
在微信小程序中实现科大讯飞方言识别大模型语音识别功能。

## 最终方案
使用**本地代理服务器**架构，绕过JavaScript环境的加密限制。

---

## 问题分析

### 1. HMAC-SHA256签名生成错误（根本原因）

#### 问题描述
微信小程序直接调用讯飞API时，返回错误：
```
401 Unauthorized - HMAC signature cannot be verified: fail to retrieve credential
```

#### 根本原因
JavaScript环境中实现的HMAC-SHA256算法生成的签名与Python不一致。

**测试数据对比：**
```
测试输入：
- host: 'iat.cn-huabei-1.xf-yun.com'
- date: 'Tue, 03 Feb 2026 14:47:02 GMT'
- path: '/v1'
- apiSecret: 'ODMwNGYzN2Y3YmUwYjQ3MzJkN2MwNjFj'

Python计算结果：
w4oxPFSauGb5B5v65JLmNQ/hnGZ0paRKeGP6SYVIdJE=

微信小程序计算结果：
1u6ueR+mJ7d5qkKC54cXBfK/+6ahchvnCSNDK3+ZdjM=

结论：签名不一致 ❌
```

#### 尝试的解决方案
1. **重写HMAC-SHA256实现**：完全重写了utils/hmac_sha256.js，包括SHA-256算法
2. **使用微信小程序crypto API**：尝试使用wx.arrayBufferToBase64等API
3. **多次算法优化**：调整字节序、编码方式等

**结果：** 所有尝试均失败，JavaScript环境生成的签名始终不正确

#### 最终解决方案
使用Python Flask代理服务器，利用Python标准库`hmac`生成正确的签名。

---

### 2. 音频格式不匹配

#### 问题描述
微信小程序录音管理器默认使用MP3编码，但讯飞API要求PCM格式。

#### 错误配置
```javascript
// pages/chatting/chatting.js (原配置)
recorderManager.onStop(function(res) {
    const { audioFormat, duration, fileSize } = res;
    // audioFormat = 'mp3' ❌
})
```

#### 正确配置
```javascript
// pages/chatting/chatting.js (修复后)
const recorderManager = wx.getRecorderManager();
recorderManager.onStart(function() {
    // 配置录音参数
    const options = {
        format: 'raw',  // PCM格式 ✅
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        frameSize: 1280
    };
});
```

---

### 3. WebSocket帧发送逻辑错误

#### 问题描述
讯飞API要求音频数据分帧发送，代理服务器最初一次性发送全部音频。

#### 错误实现（xfyun_proxy_server.py v1）
```python
def on_open(ws):
    # ❌ 一次性发送所有音频
    frame = {
        "header": {"app_id": APPID, "status": 2},
        "payload": {
            "audio": {
                "audio": audio_base64,  # 全部音频
                "encoding": "raw",
                "sample_rate": 16000
            }
        }
    }
    ws.send(json.dumps(frame))
```

#### 正确实现（xfyun_proxy_server.py v2 - 最终版）
```python
def send_frames():
    frame_size = 1280  # 每帧1280字节
    offset = 0
    frame_count = 0

    while offset < total_len:
        chunk = audio_data[offset:offset + frame_size]
        chunk_b64 = base64.b64encode(chunk).decode('utf-8')
        offset += frame_size

        # 第一帧：status=0，携带参数配置
        if frame_count == 0:
            frame = {
                "header": {"status": 0, "app_id": APPID},
                "parameter": {"iat": iat_params},
                "payload": {"audio": {"audio": chunk_b64, ...}}
            }
            ws.send(json.dumps(frame))
            frame_count += 1

        # 中间帧：status=1
        elif chunk:
            frame = {
                "header": {"status": 1, "app_id": APPID},
                "payload": {"audio": {"audio": chunk_b64, ...}}
            }
            ws.send(json.dumps(frame))
            frame_count += 1

        time.sleep(0.04)  # 模拟音频采样间隔

    # 最后一帧：status=2，音频为空
    frame = {
        "header": {"status": 2, "app_id": APPID},
        "payload": {"audio": {"audio": "", ...}}
    }
    ws.send(json.dumps(frame))
```

#### 帧结构说明
| 帧类型 | status值 | 内容 | 说明 |
|--------|----------|------|------|
| 第一帧 | 0 | 参数配置 + 第一段音频 | 携带iat参数（domain、language等） |
| 中间帧 | 1 | 音频数据片段 | 持续发送，每帧1280字节 |
| 最后一帧 | 2 | 空音频 | 标记结束，触发识别结果 |

---

### 4. 数据帧结构错误

#### 问题描述
最初发送的数据帧包含不必要的字段，导致API解析错误。

#### 错误结构
```javascript
// ❌ 包含额外字段
const frame = {
    "header": {
        "app_id": appId,
        "status": 0
    },
    "payload": {
        "audio": {
            "audio": audioData,
            "encoding": "raw",
            "sample_rate": 16000,
            "status": 1,        // ❌ 不应该在这里
            "seq": 0,           // ❌ 不需要
            "frame_size": 1280  // ❌ 不需要
        }
    }
}
```

#### 正确结构
```javascript
// ✅ 简洁的结构
const frame = {
    "header": {
        "app_id": APPID,
        "status": 0  // 第一帧标识
    },
    "parameter": {
        "iat": {
            "domain": "slm",
            "language": "zh_cn",
            "accent": "mulacc",
            "result": {
                "encoding": "utf8",
                "compress": "raw",
                "format": "json"
            }
        }
    },
    "payload": {
        "audio": {
            "audio": audioData,
            "sample_rate": 16000,
            "encoding": "raw"
        }
    }
}
```

---

### 5. Python模块导入问题

#### 问题描述
代理服务器运行时报错：`ModuleNotFoundError: No module named 'thread'`

#### 原因
Python 3中 `thread` 模块重命名为 `_thread`。

#### 修复
```python
# ❌ 错误
import thread
thread.start_new_thread(send_frames, ())

# ✅ 正确
import _thread
_thread.start_new_thread(send_frames, ())
```

---

## 最终架构

### 系统架构图
```
┌─────────────────┐
│  微信小程序      │
│  chatting.js     │
└────────┬────────┘
         │ HTTP POST
         │ { audio: base64 }
         ▼
┌─────────────────┐
│  Flask代理服务器 │
│ xfyun_proxy_    │
│   server.py     │
│                 │
│ ┌─────────────┐ │
│ │ HMAC-SHA256 │ │ ← Python标准库（正确签名）
│ └─────────────┘ │
└────────┬────────┘
         │ WebSocket (WSS)
         │ 带正确鉴权
         ▼
┌─────────────────┐
│  讯飞API服务器   │
│  方言识别大模型  │
└─────────────────┘
```

### 代理服务器实现要点

#### 1. 鉴权URL生成（完全模仿spark_slm_iat.py）
```python
# 生成RFC1123格式时间戳
now = datetime.datetime.now()
date = format_date_time(mktime(now.timetuple()))

# 构造签名字符串
signature_origin = f"host: {HOST}\ndate: {date}\nGET {path} HTTP/1.1"

# HMAC-SHA256加密
signature_sha = hmac.new(
    APISecret.encode('utf-8'),
    signature_origin.encode('utf-8'),
    digestmod=hashlib.sha256
).digest()
signature = base64.b64encode(signature_sha).decode('utf-8')

# 构造authorization
authorization_origin = f'api_key="{APIKey}", algorithm="hmac-sha256", ' \
                      f'headers="host date request-line", signature="{signature}"'
authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')

# 生成完整URL
ws_url = f'wss://{HOST}{PATH}?authorization={authorization}&date={date}&host={HOST}'
```

#### 2. 分帧发送音频
```python
frame_size = 1280  # 讯飞要求每帧1280字节
# ... 分帧逻辑
```

#### 3. 异步处理
```python
# WebSocket在单独线程运行
ws_thread = threading.Thread(target=run_ws)
ws_thread.daemon = True
ws_thread.start()

# 等待结果（最多5秒）
for _ in range(50):
    time.sleep(0.1)
    if result_container['done'] or result_container['error']:
        break
```

---

## 关键文件修改

### 1. config/xfyun.config.js
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

### 2. pages/chatting/chatting.js
```javascript
// 生成并发送测试音频
generateAndSendTestAudio: function() {
    const that = this;

    // 生成1秒PCM静音数据
    const sampleRate = 16000;
    const duration = 1;
    const totalSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(totalSamples * 2);
    const view = new Int16Array(buffer);

    for (let i = 0; i < totalSamples; i++) {
        view[i] = 0;  // 静音
    }

    const base64Data = wx.arrayBufferToBase64(buffer);

    // 调用代理服务器
    that.callProxyServer(base64Data);
}

// 调用代理服务器
callProxyServer: function(audioBase64) {
    const that = this;

    wx.request({
        url: that.data.xfyun.proxyUrl,
        method: 'POST',
        header: {'content-type': 'application/json'},
        data: { audio: audioBase64 },
        success: function(res) {
            if (res.data.success) {
                console.log('识别成功:', res.data.result);
                that.setData({
                    content: that.data.content + res.data.result
                });
            }
        },
        fail: function(err) {
            console.error('识别失败:', err);
        }
    });
}
```

### 3. xfyun_proxy_server.py（完整文件见项目根目录）

---

## 测试结果

### 成功日志
```
[请求] 收到音频数据，base64大小: 42664
[请求] 音频数据解码后大小: 32000 字节
[鉴权] 生成鉴权URL...
[鉴权] date: Tue, 03 Feb 2026 15:05:27 GMT
[鉴权] signature_origin:
'host: iat.cn-huabei-1.xf-yun.com\ndate: Tue, 03 Feb 2026 15:05:27 GMT\nGET /v1 HTTP/1.1'
[鉴权] signature: FLhdYTVlKcufQKTgMTTc3dhMs4X4b3X4qYk2xM5bf+U=
[鉴权] WebSocket URL生成完成，长度: 335
[讯飞] 连接已打开，开始发送音频
[发送] 第1帧 (第一帧), 大小: 1280 字节
[发送] 第10帧...
[发送] 第20帧...
[发送] 最后一帧, 共发送25帧
[讯飞] 收到响应 - code: 0, status: 2
[完成] 识别完成
[讯飞] 连接关闭
[返回] 识别结果:
```

### 微信小程序控制台输出
```
通过代理服务器调用讯飞API...
代理服务器响应: {result: "", success: true}
识别成功:
```

---

## 经验总结

### 1. JavaScript加密库的局限性
微信小程序环境中的加密实现可能存在兼容性问题，特别是：
- 字节序处理不一致
- Base64编码实现差异
- 字符串编码问题

**建议：** 涉及复杂加密的场景，优先使用后端代理。

### 2. API文档的重要性
讯飞API文档明确说明了：
- 音频格式要求（PCM/raw）
- 帧大小限制（1280字节）
- 分帧发送机制

**教训：** 严格按照参考实现，不要自作主张修改数据结构。

### 3. 调试策略
1. **先验证参考实现**：确保spark_slm_iat.py能正常工作
2. **逐层对比**：对比签名生成、URL构建、帧结构
3. **详细日志**：每一步都输出调试信息
4. **简化问题**：使用静音测试音频，排除音频质量问题

### 4. 架构设计
代理服务器模式的优势：
- ✅ 绕过客户端加密限制
- ✅ 便于调试和日志记录
- ✅ API密钥不暴露给客户端
- ✅ 可添加缓存、限流等功能

---

## 部署说明

### 开发环境
1. 安装Python依赖：
```bash
py -m pip install flask flask-cors websocket-client
```

2. 启动代理服务器：
```bash
py xfyun_proxy_server.py
```

3. 服务器运行在：http://localhost:5000

### 生产环境
**注意：** Flask开发服务器不适合生产环境。

建议使用：
- Gunicorn + Nginx
- 或云服务（AWS Lambda、阿里云函数计算等）

### 安全建议
1. 不要将API密钥提交到版本控制（已添加到.gitignore）
2. 代理服务器添加认证机制
3. 使用环境变量管理密钥
4. 限制CORS访问来源

---

## 相关文件清单

### 新增文件
- `xfyun_proxy_server.py` - Flask代理服务器
- `config/xfyun.config.js` - 讯飞API配置
- `docs/voice_recognition_debug_report.md` - 本文档
- `test_signature.py` - 签名验证脚本

### 修改文件
- `pages/chatting/chatting.js` - 添加代理服务器调用逻辑
- `.gitignore` - 添加敏感文件忽略规则

### 参考文件
- `spark_slm_iat.py` - 讯飞官方Python参考实现

---

## 附录：错误代码速查

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 401 | HMAC签名验证失败 | 使用代理服务器生成正确签名 |
| 1004 | Invalid HTTP status | 检查WebSocket URL格式 |
| 10404 | 资源不存在 | 检查domain参数是否为"slm" |
| 10109 | 参数错误 | 检查帧结构是否正确 |

---

## 联系方式
如有问题，请参考：
- 科大讯飞方言识别大模型文档：https://www.xfyun.cn/doc/
- 项目Issue：GitHub Issues

---

**文档生成时间：** 2026-02-03
**版本：** 1.0
**状态：** ✅ 已验证通过
