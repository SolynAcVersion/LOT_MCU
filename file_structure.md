# LOT_MCU 项目结构详解

## 项目概述

**项目名称**: 智能温室大棚管理系统
**项目类型**: 微信小程序
**技术栈**: 微信小程序原生框架 + JavaScript
**主要功能**: 通过微信小程序远程监控和控制温室大棚环境，集成物联网技术实现智能化农业管理

---

## 目录结构

```
LOT_MCU/
├── .git/                          # Git版本控制目录
├── .claude/                       # Claude AI配置目录（被gitignore屏蔽）
├── .eslintrc.js                   # ESLint代码规范配置文件
├── .gitignore                     # Git忽略文件配置
├── README.md                      # 项目说明文档
├── app.js                         # 小程序入口文件
├── app.json                       # 小程序全局配置文件
├── app.wxss                       # 小程序全局样式文件
├── package.json                   # npm依赖管理配置
├── package-lock.json              # 依赖版本锁定文件
├── project.config.json            # 微信开发者工具项目配置
├── project.private.config.json    # 私有项目配置（通常不提交）
├── sitemap.json                   # 小程序索引配置
├── pages/                         # 页面目录
│   ├── about/                     # 关于页面
│   ├── add/                       # 添加设备页面
│   ├── chatting/                  # AI聊天助手页面
│   ├── home/                      # 首页（主控制台）
│   ├── index/                     # 索引导航页面
│   ├── logs/                      # 日志页面
│   ├── setting/                   # 设置页面
│   └── users/                     # 用户页面
├── static/                        # 静态资源目录
└── utils/                         # 工具函数库目录
```

---

## 根目录文件详解

### 配置文件

#### [`.eslintrc.js`](.eslintrc.js)
**作用**: ESLint代码质量检查工具的配置文件

**详细说明**:
- 定义了ES6、浏览器环境、Node环境的全局变量
- 配置了微信小程序的全局对象（wx、App、Page、getApp等）
- 设置了ECMAScript 2018语法支持
- 用于代码规范检查，保持代码风格一致性

---

#### [`package.json`](package.json)
**作用**: npm包管理配置文件，定义项目依赖

**当前依赖**:
```json
{
  "@alicloud/dysmsapi20170525": "^2.0.24",  // 阿里云短信服务SDK
  "rhea": "^3.0.2"                            // AMQP消息协议库
}
```

**说明**:
- 项目使用了阿里云的短信服务功能
- rhea库用于消息队列通信

---

#### [`project.config.json`](project.config.json)
**作用**: 微信开发者工具的项目配置文件

**关键配置**:
- `appid`: `wx0b23b19fb811d8a0` - 小程序AppID
- `libVersion`: `trial` - 基础库版本（试用版）
- `compileType`: `miniprogram` - 编译类型为小程序
- `setting`: 包含ES6转换、代码压缩、增强编译等配置
- `cloudfunctionTemplateRoot`: 云函数模板根目录

---

#### [`project.private.config.json`](project.private.config.json)
**作用**: 私有项目配置，包含开发者的个人配置信息

**说明**: 通常包含个性化的工具设置，不应提交到公共仓库

---

#### [`sitemap.json`](sitemap.json)
**作用**: 配置小程序页面是否允许被微信索引

**当前配置**: 允许所有页面被索引（`action: "allow"`）

---

#### [`.gitignore`](.gitignore)
**作用**: 指定Git版本控制需要忽略的文件和目录

**当前配置**:
```gitignore
/.claude/    # 忽略Claude AI的配置目录
```

**可能被屏蔽的文件类型**（建议添加）:
- `node_modules/` - npm依赖包
- `.DS_Store` - macOS系统文件
- `*.log` - 日志文件
- `project.private.config.json` - 私有配置

---

### 核心文件

#### [`app.js`](app.js)
**作用**: 小程序入口文件，应用程序生命周期管理

**主要功能**:
1. 初始化全局数据 `globalData`
2. 处理用户登录（`wx.login`）
3. 初始化MQTT服务连接到阿里云IoT平台
4. 导出mqttService实例供全局使用

**设备配置**:
```javascript
{
  productKey: "k0t8ejX211I",
  deviceName: "wechat",
  deviceSecret: "7e9e072ba7db938fc30c825b6721813f",
  regionId: "cn-shanghai"
}
```

---

#### [`app.json`](app.json)
**作用**: 小程序全局配置文件

**配置内容**:

1. **页面路由** (pages数组):
   - `index` - 首页导航
   - `home` - 主控制台
   - `chatting` - AI助手
   - `setting` - 设置
   - `users` - 用户中心
   - `logs` - 日志
   - `about` - 关于
   - `add` - 添加设备

2. **权限配置** (requiredPrivateInfos):
   - `getLocation` - 获取地理位置
   - `chooseLocation` - 选择位置
   - `choosePoi` - 选择POI
   - `chooseAddress` - 选择地址

3. **窗口样式** (window):
   - 导航栏标题: "智能温室大棚管理系统"
   - 导航栏背景色: 白色
   - 导航栏文字颜色: 黑色

4. **底部标签栏** (tabBar):
   - 首页 - 绿色图标
   - 助手 - 聊天图标
   - 设置 - 齿轮图标
   - 用户 - 用户图标

5. **地理位置权限**:
   - 用于自动定位天气预报

---

#### [`app.wxss`](app.wxss)
**作用**: 全局样式表，定义小程序的整体样式风格

**说明**: 在整个小程序中生效的CSS样式，影响所有页面

---

#### [`README.md`](README.md)
**作用**: 项目说明文档

**当前内容**: 简短标识为"物联网微信小程序"

---

## pages/ 目录 - 页面模块

### 页面结构标准

每个页面目录包含4个文件：
- `.js` - 页面逻辑
- `.json` - 页面配置
- `.wxml` - 页面结构（类似HTML）
- `.wxss` - 页面样式（类似CSS）

---

### 1. [pages/home/](pages/home/) - 主控制台页面

**作用**: 系统主界面，展示温室实时数据和控制设备

**文件**:
- [`home.js`](pages/home/home.js) - 主要业务逻辑

**核心功能**:

#### 监测数据展示
- **环境参数**:
  - 温度 (temperature)
  - 湿度 (humidity)
  - 土壤湿度 (soil_humidity)
  - 一氧化碳浓度 (cogas)
  - 烟雾浓度 (smoggas)
  - 火焰状态 (fire)
  - 鸟类检测 (bird)

- **种植信息**:
  - 种植类型 (corp): 玉米/小麦/水稻/高粱/大豆
  - 病虫害类型 (waring): 支持20种病虫害识别

- **天气信息**:
  - 通过思知天气API获取3天天气预报
  - 基于地理位置自动定位

#### 设备控制
支持控制的设备:
- 风扇 (fan)
- 加热器 (heat)
- 加湿器 (humidification)
- 水泵 (pumpout)
- 抽水机 (pumpin)
- 蜂鸣器 (buzzer)

#### 阈值设置
- 温度上下限
- 湿度上下限
- 土壤湿度上下限
- 一氧化碳浓度上限
- 烟雾浓度上限

#### 数据通信
- 通过MQTT连接阿里云IoT平台
- 订阅设备状态更新
- 发布控制指令到设备
- Topic格式: `/sys/k0t8ejX211I/wechat/thing/event/property/post`

---

### 2. [pages/chatting/](pages/chatting/) - AI智能助手

**作用**: AI聊天助手，提供智能对话和设备控制功能

**文件**:
- [`chatting.js`](pages/chatting/chatting.js)

**核心功能**:

#### 智能对话
- 集成大语言模型API（火山引擎）
- 支持农业领域知识咨询
- 上下文对话历史管理

#### 设备控制指令
支持自然语言控制设备，例如：
- "打开风扇"
- "设置温度上限为30"
- "查询当前湿度"
- "关闭加热器"

#### 数据查询功能
- 查询环境数据（温度、湿度、土壤湿度等）
- 查询设备状态（风扇、加热器等是否开启）
- 查询阈值设置
- 查询天气信息
- 查询病虫害情况

#### 智能预警
- 环境参数异常时自动提醒
- 结合天气数据提供种植建议

#### 多媒体功能
- 支持图片上传和拍摄
- 图片识别病虫害功能

**API配置**:
- API地址: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- 模型: `ep-20240702121843-ndt75`

---

### 3. [pages/index/](pages/index/) - 首页导航

**作用**: 应用启动页面或导航页

**说明**: 可能用于功能导航或启动引导

---

### 4. [pages/setting/](pages/setting/) - 设置页面

**作用**: 系统设置和配置管理

**功能**:
- 设备参数配置
- 用户偏好设置
- 系统选项管理

---

### 5. [pages/users/](pages/users/) - 用户中心

**作用**: 用户信息管理和个人中心

**功能**:
- 用户信息展示
- 账户管理
- 个人设置

---

### 6. [pages/logs/](pages/logs/) - 日志页面

**作用**: 系统日志查看

**功能**:
- 显示操作日志
- 系统事件记录
- 错误信息追踪

---

### 7. [pages/about/](pages/about/) - 关于页面

**作用**: 项目信息和说明

**功能**:
- 项目介绍
- 版本信息
- 开发者信息
- 使用说明

---

### 8. [pages/add/](pages/add/) - 添加设备

**作用**: 设备管理和添加

**功能**:
- 添加新设备
- 设备配对
- 设备列表管理

---

## static/ 目录 - 静态资源

**作用**: 存放图片等静态资源文件

**文件列表**:

### 图标资源（TabBar图标）

| 文件名 | 用途 | 状态 |
|--------|------|------|
| `home(black).png` | 首页图标 | 未选中 |
| `home(green).png` | 首页图标 | 选中 |
| `chatting(black).png` | 助手图标 | 未选中 |
| `chatting(green).png` | 助手图标 | 选中 |
| `setting(black).png` | 设置图标 | 未选中 |
| `setting(green).png` | 设置图标 | 选中 |
| `user(black).png` | 用户图标 | 未选中 |
| `user(green).png` | 用户图标 | 选中 |

### 功能图片

| 文件名 | 用途 |
|--------|------|
| `corn.png` | 玉米图片（种植类型展示） |
| `rice.png` | 水稻图片（种植类型展示） |
| `userpage.png` | 用户页面装饰图 |

---

## utils/ 目录 - 工具函数库

### 1. [`mqttService.js`](utils/mqttService.js)
**作用**: MQTT服务封装类

**主要功能**:
- 封装MQTT连接逻辑
- 阿里云IoT平台认证
- 自动重连机制
- 消息发布和订阅管理

**核心方法**:
- `connect(deviceConfig)` - 连接IoT平台
- `initMqttOptions(deviceConfig)` - 初始化MQTT参数
- `signHmacSha1(params, deviceSecret)` - HMAC-SHA1签名

**连接信息**:
- Broker: `wxs://k0t8ejX211I.iot-as-mqtt.cn-shanghai.aliyuncs.com`
- 协议: MQTT over WebSocket Secure
- KeepAlive: 60秒

---

### 2. [`aliyun_connect.js`](utils/aliyun_connect.js)
**作用**: 阿里云IoT平台连接工具

**说明**: 提供阿里云IoT设备连接相关的辅助函数

---

### 3. [`hex_hmac_sha1.js`](utils/hex_hmac_sha1.js)
**作用**: HMAC-SHA1加密算法实现

**用途**:
- 生成阿里云IoT设备认证密码
- MQTT连接签名

---

### 4. [`mqtt.min.js`](utils/mqtt.min.js)
**作用**: MQTT客户端库（压缩版）

**说明**:
- 基于MQTT.js的WebSocket版本
- 支持微信小程序环境
- 实现MQTT 3.1.1协议

---

### 5. [`alibabacloud-iot-device-sdk.js`](utils/alibabacloud-iot-device-sdk.js)
**作用**: 阿里云IoT设备SDK

**功能**:
- 阿里云IoT平台设备管理
- 设备认证
- 数据上报
- 属性设置

---

### 6. [`util.js`](utils/util.js)
**作用**: 通用工具函数

**说明**:
- 时间格式化
- 数据处理
- 通用辅助函数

---

## .git/ 目录 - Git版本控制

**作用**: Git版本控制系统的元数据目录

**说明**:
- 包含提交历史、分支信息、远程仓库配置等
- 不应手动修改此目录下的文件

---

## .claude/ 目录 - Claude AI配置

**作用**: Claude AI编辑器的配置目录

**状态**: 被`.gitignore`屏蔽，不纳入版本控制

**说明**:
- 包含Claude Code的会话历史和配置
- 个人开发工具的私有数据

---

## 技术架构总结

### 通信架构
```
┌─────────────┐      MQTT      ┌──────────────┐      HTTP/CoAP     ┌─────────┐
│  微信小程序  │ ─────────────▶ │ 阿里云IoT平台  │ ─────────────────▶ │ MCU设备  │
└─────────────┘   over WSS     └──────────────┘                    └─────────┘
       │
       │ wx.request
       ▼
┌─────────────┐
│  天气API    │
│  LLM API    │
└─────────────┘
```

### 数据流向

1. **数据上行** (MCU → 小程序):
   - MCU设备采集环境数据
   - 通过MQTT发布到阿里云IoT平台
   - 小程序订阅Topic接收数据
   - 更新UI显示

2. **数据下行** (小程序 → MCU):
   - 用户在小程序操作设备
   - 小程序通过MQTT发布控制指令
   - IoT平台转发指令到MCU
   - MCU执行相应控制动作

3. **辅助功能**:
   - 天气API: 获取天气预报数据
   - LLM API: AI助手对话服务
   - 短信API: 可能用于告警通知

### 支持的农作物类型

| 代码 | 农作物 | 病虫害识别 |
|------|--------|-----------|
| 1 | 玉米 | 花叶病、叶斑病、叶锈病、灰斑病 |
| 2 | 小麦 | 根冠腐病、叶锈病、白粉病、散黑穗病、蚜虫、胞囊线虫、红蜘蛛、赤霉病、纹枯病、茎腐病、全蚀病 |
| 3 | 水稻 | 细菌性叶枯病、稻褐斑病、稻瘟病、叶瘟病、害虫 |
| 4 | 高粱 | 暂无特定病虫害 |
| 5 | 大豆 | 暂无特定病虫害 |

### 环境监测指标

1. **基础环境**:
   - 空气温度
   - 空气湿度 (%)
   - 土壤湿度 (%)

2. **安全监测**:
   - 一氧化碳浓度
   - 烟雾浓度
   - 火焰检测
   - 鸟类检测

3. **农业监测**:
   - 病虫害类型识别
   - 种植类型管理

### 设备控制能力

| 设备 | 功能 | 自动控制逻辑 |
|------|------|-------------|
| 风扇 | 通风/降温 | 温度/湿度/气体超标时自动开启 |
| 加热器 | 升温 | 温度过低时自动开启 |
| 加湿器 | 增加湿度 | 湿度过低时自动开启 |
| 水泵 | 灌溉 | 土壤湿度过低时自动开启 |
| 抽水机 | 排水 | 土壤湿度过高时自动开启 |
| 蜂鸣器 | 报警 | 异常情况时报警 |

---

## API和密钥信息

### 阿里云IoT平台
- **ProductKey**: k0t8ejX211I
- **DeviceName**: wechat
- **DeviceSecret**: 7e9e072ba7db938fc30c825b6721813f
- **Region**: cn-shanghai

### 思知天气API
- **API Key**: SoAr75JGUgwhBvWU2
- **Base URL**: https://api.seniverse.com/v3/weather/daily.json

### LLM API (火山引擎)
- **API Endpoint**: https://ark.cn-beijing.volces.com/api/v3/chat/completions
- **Model**: ep-20240702121843-ndt75
- **Authorization**: Bearer 7462e2c3-ffa0-4da7-9227-5f78c59305d8

### 微信小程序
- **AppID**: wx0b23b19fb811d8a0

---

## .gitignore 可能屏蔽的文件

### 当前已屏蔽
```
/.claude/    # Claude AI配置目录
```

### 建议添加的屏蔽项

虽然当前`.gitignore`内容很少，但通常小程序项目应该忽略：

```gitignore
# 依赖包
/node_modules/

# 微信小程序相关
/miniprogram_npm/
/.vscode/
.project.config.json

# 日志文件
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 系统文件
.DS_Store
Thumbs.db
*~

# 编辑器
.vscode/
.idea/
*.swp
*.swo
*~

# 私有配置
project.private.config.json

# 临时文件
.temp/
tmp/
```

---

## 开发建议

### 1. 安全性
- ⚠️ **重要**: 设备密钥(deviceSecret)硬编码在代码中，建议迁移到服务端
- API密钥应考虑使用环境变量或配置管理服务
- 建议实现HTTPS双向认证

### 2. 代码优化
- 考虑将硬编码的配置提取到独立配置文件
- 统一错误处理机制
- 添加单元测试

### 3. 功能扩展
- 添加数据可视化图表
- 实现历史数据查询
- 添加多设备管理
- 支持数据导出功能

---

## 总结

LOT_MCU是一个功能完整的**智能温室大棚管理系统**微信小程序，通过以下技术实现智能化农业管理：

1. **物联网技术**: 基于阿里云IoT平台和MQTT协议实现设备连接
2. **实时监控**: 监控温度、湿度、土壤等多维度环境参数
3. **智能控制**: 支持手动和自动控制各类农业设备
4. **AI助手**: 集成大语言模型提供智能对话和种植建议
5. **病虫害识别**: 支持多种农作物的病虫害类型识别
6. **天气服务**: 集成天气API提供精准的种植建议

项目结构清晰，模块划分合理，是一个典型的物联网+微信小程序应用案例。

---

**文档生成时间**: 2026-01-30
**项目路径**: d:\github_fork\LOT_MCU
**文档版本**: v1.0
