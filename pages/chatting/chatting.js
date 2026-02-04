// pages/chatting/chatting.js

const app = getApp();
// 使用 crypto-js 库的 HMAC-SHA256 实现
const { hmacSha256, base64Encode } = require('../../utils/crypto_js_hmac.js');
const xfyunConfig = require('../../config/xfyun.config.js');

var conversationHistory = []; // 用于保存对话历史的数组

Page({
    data: {
        content: '',
        chatList: [], // 假设这是用来在界面上显示对话的数组
        isIphoneXHeight: app.globalData.isIphoneXHeight,
        keyboardHeight: '', // 键盘高度
        toolViewHeight: '',
        functionShow: false,
        isRecording: false, // 是否正在录音
        voiceText: '', // 语音识别的文本
        isWebSocketConnected: false, // WebSocket 连接状态
        menuList: [
            {
              type: 'photo',
              icon: 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/picture.png',
              text: '照片'
            },
            {
              type: 'camera',
              icon: 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/camera.png',
              text: '拍摄'
            },
            {
                type: 'chatting',
                icon: '/static/chatting(black).png',
                text: '删除聊天记录'
              }
          ],
        // 科大讯飞配置（从配置文件加载）
        xfyun: xfyunConfig.xfyun
    },

    onLoad() {
        this.setData({
            login: {
                id: '2026',
                user: '游客',
                avatar: 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/myself.png'
            },
            chatList: []
        });
        this.initChat();
        this.requestLLMGPTAdvice();
        this.initRecorderManager();
    },

    // 初始化聊天
    initChat: function() {
        var date = new Date();
        var now = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
        const welcomeMsg = {
            msgId: 'system',
            nickname: '系统',
            avatar: 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/robot.png',
            message: '欢迎来到智能温室大棚管理系统。我是您的智能助手，请问有什么可以帮助您的吗？',
            type: 'text',
            date: now
        };
        this.setData({
            chatList: [welcomeMsg]
        });
    },

    // 输入监听
    inputClick(e) {
        this.setData({
            content: e.detail.value
        })
    },

    // 发送监听
    sendClick: function() {
        var that = this;
        var list = this.data.chatList;
        var date = new Date();
        var now = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
        var msg = {
            msgId: this.data.login.id,
            nickname: this.data.login.user,
            avatar: this.data.login.avatar || 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/myself.png',
            message: this.data.content,
            type: 'text',
            date: now
        };
        list.push(msg);

        this.setData({
            chatList: list,
            content: ''
        });
    
        // 尝试根据内容回复环境数据或设置值
        const chat = that.replyWithDataOrSettings(msg.message);
        if (!chat) {
            // 如果不是设置或查询指令，将消息发送给 LLMGPT
            that.sendMessageToChatGPT(msg.message).then((replyMsg) => {
                that.updateChatList(replyMsg);
            }).catch((error) => {
                console.error("Error sending message to LLMGPT:", error);
            });
        }
    },

    // 根据发送的内容回复环境数据或设置值
    replyWithDataOrSettings(content) {
        if (content.includes('查询：')) {
            let replyMessage = '';
            let settingMessage = '';
            let askMessage = '温室大棚中的';
            let homeData = app.globalData.homeData;
            let num = 1;
            let controlActions = [];
            var isSettingMessage = '';

            const constructSettingReply = (setting, value) => {
                if (settingMessage === '') {
                    settingMessage = `好的，已为您成功设置`;
                } else {
                    settingMessage += `，`;
                }
                settingMessage += `${setting}为${value}`;
            };

            const constructQueryReply = (query, value) => {
                if (replyMessage === '') {
                    replyMessage = `好的，已为您查询到`;
                } else {
                    replyMessage += `，`;
                }
                replyMessage += `${query}：${value}`;
            };

            const constructAlertReply = (alert, message) => {
                if (replyMessage === '') {
                    replyMessage = `好的，已为您检测到`;
                } else {
                    replyMessage += `；`;
                }
                replyMessage += `${alert}，${message}`;
            };

            if (content.includes('种植类型') || content.includes('种植农作物') || content.includes('种植的农作物')) {
                if (content.includes('设置种植类型')) {
                    isSettingMessage = /设置种植类型为(\d+)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('corp', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('种植类型', this.getCropType(parseInt(isSettingMessage[1])));
                            this.updateCropType(); // 更新显示
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else {
                    constructQueryReply('当前种植类型', this.getCropType(homeData.corp));
                }
            }

            if (content.includes('更新间隔') || content.includes('更新的间隔') || content.includes('更新时间') || content.includes('更新的时间') || content.includes('上传时间') || content.includes('上传的时间') ) {
                if (content.includes('设置更新间隔') || content.includes('设置更新时间') || content.includes('设置上传时间')) {
                    isSettingMessage = /设置(?:更新间隔|更新时间|上传时间)为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('updata_time', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('更新间隔', `${isSettingMessage[1]}s`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else {
                    constructQueryReply('当前两次数据更新之间的间隔为', `${homeData.updata_time}s`);
                }
            }

            if (content.includes('温度')) {
                if (content.includes('设置温度上限')) {
                    isSettingMessage = /设置温度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('temperature_upvalue', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('温度上限', `${isSettingMessage[1]}℃`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('设置温度下限')) {
                    isSettingMessage = /设置温度下限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('temperature_downvalue', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('温度下限', `${isSettingMessage[1]}℃`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('温度上限') || content.includes('温度最大值') || content.includes('温度最高值')) {
                    constructQueryReply('当前温度上限值', `${homeData.temperature_upvalue}℃`);
                } else if (content.includes('温度下限') || content.includes('温度最小值') || content.includes('温度最低值')) {
                    constructQueryReply('当前温度下限值', `${homeData.temperature_downvalue}℃`);
                } else if (content.includes('温度的正常范围') || content.includes('温度的阈值')) {
                    constructQueryReply('当前温度的正常范围', `${homeData.temperature_downvalue} ~ ${homeData.temperature_upvalue}℃`);
                } else if (content.includes('温度')) {
                    constructQueryReply('当前温度', `${homeData.temperature}℃`);
                    if (homeData.temperature > homeData.temperature_upvalue) {
                        constructAlertReply('当前温度高于温度上限', `降温风扇已自动打开`);
                        askMessage += '温度高于适宜农作物生长的温度';
                    } else if (homeData.temperature < homeData.temperature_downvalue) {
                        constructAlertReply('当前温度低于温度下限', `加热器已自动打开`);
                        askMessage += '温度低于适宜农作物生长的温度';
                    } else {
                        constructAlertReply('当前温度处于正常范围内', '');
                    }
                }
            }

            if (content.includes('湿度')) {
                if (content.includes('设置湿度上限')) {
                    isSettingMessage = /设置湿度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('humidity_upvalue', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('湿度上限', `${isSettingMessage[1]}%`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('设置湿度下限')) {
                    isSettingMessage = /设置湿度下限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('humidity_downvalue', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('湿度下限', `${isSettingMessage[1]}%`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('湿度上限') || content.includes('湿度最大值') || content.includes('湿度最高值')) {
                    constructQueryReply('当前设定的湿度上限值', `${homeData.humidity_upvalue}%`);
                } else if (content.includes('湿度下限') || content.includes('湿度最小值') || content.includes('湿度最低值')) {
                    constructQueryReply('当前设定的湿度下限值', `${homeData.humidity_downvalue}%`);
                } else if (content.includes('湿度的正常范围') || content.includes('湿度的阈值')) {
                    constructQueryReply('当前湿度的正常范围', `${homeData.humidity_downvalue} ~ ${homeData.humidity_upvalue}%`);
                } else if (content.includes('湿度')) {
                    constructQueryReply('当前湿度', `${homeData.humidity}%`);
                    if (homeData.humidity > homeData.humidity_upvalue) {
                        constructAlertReply('当前湿度高于湿度上限', `排湿风扇已自动打开`);
                        askMessage += '湿度高于适宜农作物生长的湿度';
                    } else if (homeData.humidity < homeData.humidity_downvalue) {
                        constructAlertReply('当前湿度低于湿度下限', `加湿器已自动打开`);
                        askMessage += '湿度低于适宜农作物生长的湿度';
                    } else {
                        constructAlertReply('当前湿度处于正常范围内', '');
                    }
                }
            }

            if (content.includes('土壤湿度')) {
                if (content.includes('设置土壤湿度上限')) {
                    isSettingMessage = /设置土壤湿度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('soil_humidity_upvalue', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('土壤湿度上限', `${isSettingMessage[1]}%`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('设置土壤湿度下限')) {
                    isSettingMessage = /设置土壤湿度下限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('soil_humidity_downvalue', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('土壤湿度下限', `${isSettingMessage[1]}%`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('土壤湿度上限') || content.includes('土壤湿度最大值') || content.includes('土壤湿度最高值')) {
                    constructQueryReply('当前设定的土壤湿度上限值', `${homeData.soil_humidity_upvalue}%`);
                } else if (content.includes('土壤湿度下限') || content.includes('土壤湿度最小值') || content.includes('土壤湿度最低值')) {
                    constructQueryReply('当前设定的土壤湿度下限值', `${homeData.soil_humidity_downvalue}%`);
                } else if (content.includes('土壤湿度的正常范围') || content.includes('土壤湿度的阈值')) {
                    constructQueryReply('当前土壤湿度的正常范围', `${homeData.soil_humidity_downvalue} ~ ${homeData.soil_humidity_upvalue}%`);
                } else if (content.includes('土壤湿度')) {
                    constructQueryReply('当前土壤湿度', `${homeData.soil_humidity}%`);
                    if (homeData.soil_humidity > homeData.soil_humidity_upvalue) {
                        constructAlertReply('当前土壤湿度高于土壤湿度上限', `抽水器已自动打开`);
                        askMessage += '土壤湿度高于适宜农作物生长的土壤湿度';
                    } else if (homeData.soil_humidity < homeData.soil_humidity_downvalue) {
                        constructAlertReply('当前土壤湿度低于土壤湿度下限', `水泵已自动打开`);
                        askMessage += '土壤湿度低于适宜农作物生长的土壤湿度';
                    } else {
                        constructAlertReply('当前土壤湿度处于正常范围内', '');
                    }
                }
            }

            if (content.includes('一氧化碳') || content.includes('CO')) {
                if (content.includes('设置一氧化碳浓度上限')) {
                    isSettingMessage = /设置一氧化碳浓度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('cogas_value', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('一氧化碳浓度上限', `${isSettingMessage[1]}ppm`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('一氧化碳浓度上限') || content.includes('一氧化碳浓度最大值') || content.includes('一氧化碳浓度最高值')) {
                    constructQueryReply('当前设定的一氧化碳浓度上限值', `${homeData.cogas_value}ppm`);
                } else if (content.includes('一氧化碳浓度的正常范围') || content.includes('一氧化碳浓度的阈值')) {
                    constructQueryReply('当前一氧化碳浓度的正常范围', `${homeData.cogas_value}ppm ≤ 一氧化碳浓度`);
                } else if (content.includes('一氧化碳浓度')) {
                    constructQueryReply('当前一氧化碳浓度', `${homeData.cogas}ppm`);
                    if (homeData.cogas > homeData.cogas_value) {
                        constructAlertReply('当前一氧化碳浓度高于上限', `风扇已自动打开`);
                        askMessage += '一氧化碳高于一氧化碳浓度上限值';
                    } else {
                        constructAlertReply('当前一氧化碳浓度处于正常范围内', '');
                    }
                }
            }

            if (content.includes('烟雾浓度')) {
                if (content.includes('设置烟雾浓度上限')) {
                    isSettingMessage = /设置烟雾浓度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('smoggas_value', isSettingMessage[1]);
                        if (success) {
                            constructSettingReply('烟雾浓度上限', `${isSettingMessage[1]}ppm`);
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('烟雾浓度上限') || content.includes('烟雾浓度最大值') || content.includes('烟雾浓度最高值')) {
                    constructQueryReply('当前设定的烟雾浓度上限值', `${homeData.smoggas_value}ppm`);
                } else if (content.includes('烟雾浓度的正常范围') || content.includes('烟雾浓度的阈值')) {
                    constructQueryReply('当前烟雾浓度的正常范围', `${homeData.smoggas_value}ppm ≤ 烟雾浓度`);
                } else if (content.includes('烟雾浓度')) {
                    constructQueryReply('当前烟雾浓度', `${homeData.smoggas}ppm`);
                    if (homeData.smoggas > homeData.smoggas_value) {
                        constructAlertReply('当前烟雾浓度高于上限', `风扇已自动打开`);
                        askMessage += '烟雾浓度高于烟雾浓度上限值';
                    } else {
                        constructAlertReply('当前烟雾浓度处于正常范围内', '');
                    }
                }
            }

            if (content.includes('火')) {
                if (homeData.fire == 0) {
                    replyMessage += `！！已为您检测到当前出现了火源，系统已为您自动打开了淋水器灭火！！`;
                } else {
                    replyMessage += `已为您检测到当前未出现火源。`;
                }
            }

            if (content.includes('鸟')) {
                if (homeData.bird == 0) {
                    replyMessage += `已为您检测到当前不存在鸟类。`;
                } else {
                    replyMessage += `！！已为您检测到当前存在鸟类，系统已为您自动打开了驱鸟器驱鸟！！`;
                }
            }

            if (content.includes('病虫害')) {
                if (homeData.waring == 0) {
                    replyMessage += `未检测到当前植株存在病虫害。`;
                } else if (homeData.waring >= 1 && homeData.waring <= 20) {
                    replyMessage += `！！已为您检测到当前种植的是${homeData.cropType}存在${homeData.waringType}！！`;
                } else {
                    replyMessage += `抱歉，系统无法识别${homeData.cropType}获得了哪种病虫害。`;
                }
            }

            if (content.includes('打开风扇')) {
                if (homeData.fan == 1) {
                    replyMessage += `${num}、已为您打开风扇。\n`;
                } else {
                    controlActions.push({ action: 'open', device: 'fan', chinese: '风扇' });
                }
            } else if (content.includes('关闭风扇')) {
                if (homeData.fan == 0) {
                    replyMessage += `${num}、已为您关闭风扇。\n`;
                } else {
                    controlActions.push({ action: 'close', device: 'fan', chinese: '风扇' });
                }
            } else if (content.includes('风扇')) {
                if (homeData.fan == 1) {
                    replyMessage += `${num}、风扇已处于打开状态。\n`;
                } else if (homeData.fan == 0) {
                    replyMessage += `${num}、风扇已处于关闭状态。\n`;
                }
            }

            if (content.includes('打开加热器')) {
                if (homeData.heat == 1) {
                    replyMessage += `${num}、已为您打开加热器。\n`;
                } else {
                    controlActions.push({ action: 'open', device: 'heat', chinese: '加热器' });
                }
            } else if (content.includes('关闭加热器')) {
                if (homeData.heat == 0) {
                    replyMessage += `${num}、已为您关闭加热器。\n`;
                } else {
                    controlActions.push({ action: 'close', device: 'heat', chinese: '加热器' });
                }
            } else if (content.includes('加热器')) {
                if (homeData.heat == 1) {
                    replyMessage += `${num}、加热器已处于打开状态。\n`;
                } else if (homeData.heat == 0) {
                    replyMessage += `${num}、加热器已处于关闭状态。\n`;
                }
            }

            if (content.includes('打开加湿器')) {
                if (homeData.humidification == 1) {
                    replyMessage += `${num}、已为您打开加湿器。\n`;
                } else {
                    controlActions.push({ action: 'open', device: 'humidification', chinese: '加湿器' });
                }
            } else if (content.includes('关闭加湿器')) {
                if (homeData.humidification == 0) {
                    replyMessage += `${num}、已为您关闭加湿器。\n`;
                } else {
                    controlActions.push({ action: 'close', device: 'humidification', chinese: '加湿器' });
                }
            } else if (content.includes('加湿器')) {
                if (homeData.humidification == 1) {
                    replyMessage += `${num}、加湿器已处于打开状态。\n`;
                } else if (homeData.humidification == 0) {
                    replyMessage += `${num}、加湿器已处于关闭状态。\n`;
                }
            }

            if (content.includes('打开水泵')) {
                if (homeData.pumpout == 1) {
                    replyMessage += `${num}、已为您打开水泵。\n`;
                } else {
                    controlActions.push({ action: 'open', device: 'pumpout', chinese: '水泵' });
                }
            } else if (content.includes('关闭水泵')) {
                if (homeData.pumpout == 0) {
                    replyMessage += `${num}、已为您关闭水泵。\n`;
                } else {
                    controlActions.push({ action: 'close', device: 'pumpout', chinese: '水泵' });
                }
            } else if (content.includes('水泵')) {
                if (homeData.pumpout == 1) {
                    replyMessage += `${num}、水泵已处于打开状态。\n`;
                } else if (homeData.pumpout == 0) {
                    replyMessage += `${num}、水泵已处于关闭状态。\n`;
                }
            }

            if (content.includes('打开抽水')) {
                if (homeData.pumpin == 1) {
                    replyMessage += `${num}、已为您打开抽水器。\n`;
                } else {
                    controlActions.push({ action: 'open', device: 'pumpin', chinese: '抽水机' });
                }
            } else if (content.includes('关闭抽水')) {
                if (homeData.pumpin == 0) {
                    replyMessage += `${num}、已为您关闭抽水器。\n`;
                } else {
                    controlActions.push({ action: 'close', device: 'pumpin', chinese: '抽水机' });
                }
            } else if (content.includes('抽水')) {
                if (homeData.pumpin == 1) {
                    replyMessage += `${num}、抽水器已处于打开状态。\n`;
                } else if (homeData.pumpin == 0) {
                    replyMessage += `${num}、抽水器已处于关闭状态。\n`;
                }
            }

            if (content.includes('打开蜂鸣器')) {
                if (homeData.buzzer == 1) {
                    replyMessage += `${num}、已为您打开蜂鸣器。\n`;
                } else {
                    controlActions.push({ action: 'open', device: 'buzzer', chinese: '蜂鸣器' });
                }
            } else if (content.includes('关闭蜂鸣器')) {
                if (homeData.buzzer == 0) {
                    replyMessage += `${num}、已为您关闭蜂鸣器。\n`;
                } else {
                    controlActions.push({ action: 'close', device: 'buzzer', chinese: '蜂鸣器' });
                }
            } else if (content.includes('蜂鸣器')) {
                if (homeData.buzzer == 1) {
                    replyMessage += `${num}、蜂鸣器已处于打开状态。\n`;
                } else if (homeData.buzzer == 0) {
                    replyMessage += `${num}、蜂鸣器已处于关闭状态。\n`;
                }
            }

            for (let { action, device, chinese } of controlActions) {
                if (this.controlDevice(device, action === 'open' ? 1 : 0)) {
                    replyMessage += `${num}、${chinese}已${action === 'open' ? '打开' : '关闭'}。\n`;
                    num += 1;
                }
            }

            if (settingMessage !== '') {
                settingMessage += '。\n';
                replyMessage = settingMessage + replyMessage;
            }

            if (replyMessage !== '' || askMessage !== '温室大棚中的') {
                if (replyMessage !== '') {
                    let replyMsg = this.constructReplyMessage(replyMessage);
                    this.updateChatList(replyMsg);
                }
                if (askMessage !== '温室大棚的') {
                    askMessage += '时可能会导致的农作物生长时出现的问题都有哪些？';
                    this.sendMessageToChatGPT(askMessage).then((gptReply) => {
                        this.updateChatList(gptReply);
                    });
                }
                return true;
            } else {
                console.log('对话不存在关键字。');
                return false;
            }
        } else {
            console.log('对话不存在关键字。');
            return false;
        }
    },

    getCropType: function (corp) { 
        switch (corp) {
            case 1:
                return '玉米';
            case 2:
                return '小麦';
            case 3:
                return '水稻';
            case 4:
                return '高粱';
            case 5:
                return '大豆';
            default:
                return '未知';
        }
    },

    // 展示附件 Panel
    showFunction: function () {
        this.setData({
        functionShow: !this.data.functionShow,
        toolViewHeight: !this.data.functionShow ? 200 + this.data.toolHeight / 2 - this.data.isIphoneXHeight / 2 : 0,
        });
    },
    bindBlur: function () {
        this.setData({
        keyboardHeight: 0,
        });
    },

    // 菜单栏事件
    menuFun: function (e) {
        let type = e.currentTarget.dataset.type;
        switch (type) {
        case 'photo':
            this.choosePic();
            console.log('选择上传照片');
            break;
        case 'camera':
            this.choosePic();
            console.log('选择上传照片');
            break;
        case 'chatting':
            this.clearHistory();
            console.log('历史聊天记录已清除');
            break;
        }
    },

    // 相册选取图片
    choosePic: function () {
        const that = this;
        wx.chooseMedia({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                var tempFilePaths = res.tempFilePaths;
                console.log('图片选择成功');
            },
            fail(res) { 
                console.log('图片选择失败');
            }
        });
    },

    // 更新chatList
    updateChatList: function(newMsg) {
        var newList = this.data.chatList.slice();
        newList.push(newMsg);
        this.setData({
            chatList: newList
        }, () => {
            this.scrollToBottom();
        });
    },

    // 构造回复消息对象
    constructReplyMessage(replyMessage) {
        var date = new Date();
        var now = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
        return {
            msgId: 'system',
            nickname: '系统',
            avatar: 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/robot.png',
            message: replyMessage,
            type: 'text',
            date: now
        };
    },

    // 滑动到最底部
    scrollToBottom() {
        setTimeout(() => {
            wx.pageScrollTo({
                scrollTop: 200000,
                duration: 3
            });
        }, 600)
    },

    // 发布数据
    sendDataToAliyunIoT: function(payload) {
        return new Promise((resolve, reject) => {
            // 构造发送的数据格式
            const topic = `/sys/k0t8ejX211I/wechat/thing/event/property/post`;
            const message = JSON.stringify({
                params: payload,
                method: "thing.event.property.post",
                id: Date.now().toString(),
                version: "1.0.0",
            });

            if (!app.mqttService.client || !app.mqttService.client.connected) {
                console.error('MQTT客户端未连接');
                reject('MQTT客户端未连接');
                return false;
            } else {
                app.mqttService.client.publish(topic, message, function(err) {
                    if (!err) {
                        console.log('数据发送成功');
                        resolve();
                        return true;
                    } else {
                        console.error('数据发送失败:', err);
                        reject('数据发送失败');
                        return false;
                    }
                });
            }
        });
    },

    // 控制设备状态
    controlDevice(device, status) {
        const payload = {};
        payload[device] = status; // 根据设备和状态动态构建payload对象
        if(this.sendDataToAliyunIoT(payload)) {
            return true;
        }
        return false;
    },

    // 更新阈值信息
    settingDevicevalue: function(device, settingValue){
        const payload = {};
        payload[device] = parseFloat(settingValue);
        if(this.sendDataToAliyunIoT(payload)) {
            return true;
        }
        return false;
    },

    // 智能聊天机器人
    sendMessageToChatGPT: function(message) {
        var that = this;
        return new Promise((resolve, reject) => {
            const systemMessage = {
                    role: "system",
                    content: "你现在是智能大棚管理系统的智能助手及农业领域的知识专家，第一：回答问题的语言要通俗易懂、流畅；第二：你在和用户的对话中不能回答农业邻域以外的问题，如果用户提及的话，请你礼貌的回避，第三：回答的语言根据用户的语言进行改变。"
                };
            const CHWSM = [systemMessage, ...conversationHistory, {
                role: "user",
                content: message
            }];
            wx.request({
                url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                // url: 'https://migow.club/v1/chat/completions',
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 7462e2c3-ffa0-4da7-9227-5f78c59305d8'
                    // 'Authorization': 'Bearer sk-ut2khvQ2Z88BounwB73b752f949c407192Fb0077FaC3AfF3'
                },
                data: {
                    // model: "glm-4",
                    // messages: CHWSM,
                    model: "ep-20240702121843-ndt75",
                    messages: CHWSM,
                    max_tokens: 2048,
                },
                success: function(res) {
                    if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
                        console.log(res); 
                        var replyMsg = {
                            msgId: 'system',
                            nickname: '系统',
                            avatar: 'https://picture-lsz.oss-cn-shanghai.aliyuncs.com/wechat/static/robot.png',
                            message: res.data.choices[0]["message"]["content"],
                            type: 'text',
                            date: `${new Date().getMonth() + 1}-${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}`
                        };
                        conversationHistory.push({
                            role: "user",
                            content: res.data.choices[0]["message"]["content"]
                        });
                        resolve(replyMsg);
                    } else {
                        reject('Failed to get valid response from LLMGPT');
                    }
                },
                fail: function(err) {
                    reject(err);
                }
            });
        });
    },

    clearHistory: function() {
        conversationHistory = [];
        this.setData({
            chatList: []
        });
        wx.showToast({
            title: '历史记录已清除',
            icon: 'none',
            duration: 2000
        });
        this.initChat();
    },

    requestLLMGPTAdvice: function() {
        if (this.data.adviceRequested) {
            return;
        }
        var that = this;
        let weatherInfo = app.globalData.weatherInfo;
        let temperature = app.globalData.homeData.temperature;
        let humidity = app.globalData.homeData.humidity;
        let soilHumidity = app.globalData.homeData.soil_humidity;
        if (!app.globalData.homeData || app.globalData.homeData.temperature === undefined) {
            console.log('homeData 未准备好或 temperature 未定义');
            if (weatherInfo && temperature && humidity && soilHumidity ) {
                let message = `温室大棚当前在${weatherInfo.location.name}，当前天气状况为${weatherInfo.daily[0].text_day}到${weatherInfo.daily[0].text_night}，当前温度为${weatherInfo.daily[0].low}到${weatherInfo.daily[0].high}℃。现在大棚种植的农作物为${corpType}，室内温度为${temperature}℃，湿度为${humidity}%，土壤湿度为${soilHumidity}%。请你针对当前该地的天气和温室大棚内的环境提供合理的种植与管理建议。`;
                that.sendMessageToChatGPT(message);
                return true;
            } else {
                console.log('天气或环境数据尚未准备好。');
                return false;
            }
        }
        return false;
    },

    // ==================== 语音识别相关函数 ====================

    // ==================== 备份：原始录音逻辑 ====================
    // 初始化录音管理器
    initRecorderManager: function() {
        const that = this;
        this.recorderManager = wx.getRecorderManager();
        this.audioFrameBuffer = [];  // 音频帧缓冲区
        this.isFirstFrame = true;    // 是否第一帧

        // 实时音频帧事件（可能返回PCM数据）
        this.recorderManager.onFrameRecorded((res) => {
            console.log('收到音频帧:', res);
            const { frameBuffer, isLastFrame } = res;

            // 将 ArrayBuffer 转换为 Base64
            const base64Data = wx.arrayBufferToBase64(frameBuffer);
            console.log('音频帧大小:', frameBuffer.byteLength, 'Base64长度:', base64Data.length);

            // 如果已经连接了 WebSocket，直接发送
            if (that.webSocketTask && that.data.isWebSocketConnected) {
                if (that.isFirstFrame) {
                    // 第一帧：包含参数
                    that.sendFirstAudioFrame(base64Data);
                    that.isFirstFrame = false;
                } else {
                    // 中间帧
                    that.sendMiddleAudioFrame(base64Data);
                }
            } else {
                // 如果 WebSocket 还没连接，先缓存
                that.audioFrameBuffer.push(base64Data);
                console.log('WebSocket 未连接，音频帧已缓存，当前缓存:', that.audioFrameBuffer.length, '帧');
            }
        });

        this.recorderManager.onStop((res) => {
            console.log('录音停止', res);

            // 发送最后一帧
            if (that.webSocketTask && that.data.isWebSocketConnected) {
                that.sendLastAudioFrame();
            }

            that.setData({ isRecording: false });
        });

        this.recorderManager.onError((err) => {
            console.error('录音错误', err);
            wx.showToast({
                title: '录音失败',
                icon: 'none'
            });
            that.setData({ isRecording: false });
        });
    },

    // 备份：开始录音（按住触发）
    startRecordingBackup: function() {
        const that = this;

        // 防止重复触发
        if (that.data.isRecording) {
            return;
        }

        // 检查配置
        if (!that.data.xfyun.apiKey || !that.data.xfyun.apiSecret || !that.data.xfyun.appId) {
            wx.showToast({
                title: '请先配置讯飞API',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 开始录音（使用 PCM 格式）
        that.recorderManager.start({
            duration: 60000, // 最长60秒
            sampleRate: 16000,
            numberOfChannels: 1,
            encodeBitRate: 48000,
            format: 'pcm', // 使用 PCM 格式
            frameSize: 5 // 设置帧大小，触发 onFrameRecorded
        });

        that.setData({
            isRecording: true,
            voiceText: ''
        });

        wx.vibrateShort(); // 震动反馈
    },

    // ==================== 测试逻辑：生成并发送测试音频 ====================

    // 开始录音（使用PCM格式）
    startRecording: function() {
        const that = this;

        // 防止重复触发
        if (that.data.isRecording) {
            return;
        }

        // 检查配置
        if (!that.data.xfyun.apiKey || !that.data.xfyun.apiSecret || !that.data.xfyun.appId) {
            wx.showToast({
                title: '请先配置讯飞API',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 重置状态
        that.audioFrameBuffer = [];
        that.isFirstFrame = true;

        // 先建立 WebSocket 连接
        console.log('开始录音，先建立 WebSocket 连接...');
        that.connectWebSocket();

        // 开始录音（使用 PCM 格式）
        that.recorderManager.start({
            duration: 60000, // 最长60秒
            sampleRate: 16000,
            numberOfChannels: 1,
            encodeBitRate: 48000,
            format: 'pcm', // 使用 PCM 格式
            frameSize: 5 // 设置帧大小，触发 onFrameRecorded
        });

        that.setData({
            isRecording: true,
            voiceText: ''
        });

        wx.vibrateShort(); // 震动反馈
        wx.showToast({
            title: '开始录音...',
            icon: 'none',
            duration: 1000
        });
    },

    // ==================== 以下为已废弃的测试代码 ====================
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

    // 通过代理服务器调用讯飞API
    callProxyServer: function(audioBase64) {
        const that = this;

        if (!that.data.xfyun.useProxy) {
            // 如果不使用代理，尝试直接连接WebSocket
            that.audioDataBase64 = audioBase64;
            that.connectWebSocket();
            return;
        }

        console.log('通过代理服务器调用讯飞API...');

        wx.request({
            url: that.data.xfyun.proxyUrl,
            method: 'POST',
            header: {
                'content-type': 'application/json'
            },
            data: {
                audio: audioBase64
            },
            success: function(res) {
                console.log('代理服务器响应:', res.data);

                if (res.data.success) {
                    console.log('识别成功:', res.data.result);
                    that.setData({
                        content: that.data.content + res.data.result
                    });

                    if (res.data.result) {
                        wx.showToast({
                            title: '识别成功: ' + res.data.result,
                            icon: 'success',
                            duration: 2000
                        });
                    }
                } else {
                    console.error('识别失败:', res.data.error);
                    wx.showToast({
                        title: '识别失败: ' + (res.data.error || '未知错误'),
                        icon: 'none',
                        duration: 2000
                    });
                }

                that.setData({ isRecording: false });
            },
            fail: function(err) {
                console.error('代理服务器请求失败:', err);
                wx.showModal({
                    title: '代理服务器连接失败',
                    content: '请确保代理服务器已启动(python xfyun_proxy_server.py)',
                    showCancel: false
                });
                that.setData({ isRecording: false });
            }
        });
    },

    // 停止录音（松手触发）
    stopRecording: function() {
        const that = this;

        if (!that.data.isRecording) {
            return;
        }

        // 停止录音管理器
        that.recorderManager.stop();

        that.setData({
            isRecording: false
        });
        wx.vibrateShort(); // 震动反馈

        wx.showToast({
            title: '录音结束，正在识别...',
            icon: 'loading',
            duration: 1000
        });
    },

    // 取消录音（意外中断）
    cancelRecording: function() {
        const that = this;

        if (!that.data.isRecording) {
            return;
        }

        that.recorderManager.stop();
        that.setData({
            isRecording: false
        });

        wx.showToast({
            title: '录音已取消',
            icon: 'none',
            duration: 1000
        });
    },

    // 录音停止处理（已废弃 - 现在使用实时音频帧发送）
    handleRecordingStop: function(res) {
        const that = this;
        console.log('录音文件:', res.tempFilePath);
        console.log('录音停止，最后一帧已通过 onFrameRecorded 发送');

        // 不再需要读取文件，因为音频已经通过 onFrameRecorded 实时发送了
        // that.readAudioAndRecognize(res.tempFilePath);
    },

    // 读取音频文件并进行语音识别
    readAudioAndRecognize: function(audioFilePath) {
        const that = this;

        wx.getFileSystemManager().readFile({
            filePath: audioFilePath,
            encoding: 'base64',
            success: function(res) {
                console.log('=== 录音文件读取成功 ===');
                console.log('文件路径:', audioFilePath);
                console.log('数据大小:', res.data.length, '字节');
                console.log('数据前100字符:', res.data.substring(0, 100));
                console.log('=====================');

                // 使用代理服务器调用讯飞API
                if (that.data.xfyun.useProxy) {
                    that.callProxyServer(res.data);
                } else {
                    // 如果不使用代理，保存音频数据，等待WebSocket连接
                    that.audioDataBase64 = res.data;
                    that.connectWebSocket();
                }
            },
            fail: function(err) {
                console.error('读取音频文件失败:', err);
                wx.showToast({
                    title: '读取音频失败',
                    icon: 'none'
                });
            }
        });
    },

    // 生成科大讯飞鉴权URL（使用 crypto-js）
    generateAuthUrl: function() {
        const that = this;
        const { apiKey, apiSecret, host, path } = that.data.xfyun;

        // 生成RFC1123格式的时间
        const date = new Date().toUTCString();

        // 构造signature_origin - 使用实际连接的域名进行签名
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

        console.log('=== 鉴权调试信息 ===');
        console.log('host:', host);
        console.log('date:', date);
        console.log('signature_origin:', signatureOrigin);

        // 使用 crypto-js 进行 HMAC-SHA256 签名（同步）
        try {
            const signature = that.hmacSha256(signatureOrigin, apiSecret);
            console.log('signature:', signature);

            // 构造authorization_origin
            const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;

            console.log('authorization_origin:', authorizationOrigin);

            // base64编码authorization
            const authorization = that.base64Encode(authorizationOrigin);

            console.log('authorization (base64):', authorization.substring(0, 50) + '...');

            // 拼接URL - 使用实际连接的域名
            const url = `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;

            console.log('完整URL长度:', url.length);
            console.log('==================');

            return url;
        } catch (error) {
            console.error('生成鉴权URL失败:', error);
            throw error;
        }
    },

    // HMAC-SHA256签名（使用 crypto-js，同步）
    hmacSha256: function(message, secret) {
        try {
            const signature = hmacSha256(message, secret);
            return signature;
        } catch (error) {
            console.error('HMAC-SHA256 签名失败:', error);
            throw error;
        }
    },

    // Base64编码
    base64Encode: function(str) {
        return base64Encode(str);
    },

    // 建立WebSocket连接（使用 crypto-js 同步鉴权）
    connectWebSocket: function() {
        const that = this;

        try {
            // 生成鉴权URL（同步）
            const url = that.generateAuthUrl();
            console.log('WebSocket URL:', url);

            // 不设置任何header，与Python脚本保持一致
            that.webSocketTask = wx.connectSocket({
                url: url,
                success: function() {
                    console.log('WebSocket初始化成功');
                }
            });

            // 连接打开
            that.webSocketTask.onOpen(() => {
                console.log('WebSocket连接已打开，准备发送数据');
                that.setData({ isWebSocketConnected: true });

                // 不再自动发送数据，等待实时音频帧
                // setTimeout(() => {
                //     that.sendAudioData();
                // }, 100);
            });

            // 接收消息
            that.webSocketTask.onMessage((res) => {
                console.log('收到消息:', res.data);
                that.handleWSMessage(res.data);
            });

            // 连接关闭
            that.webSocketTask.onClose(() => {
                console.log('WebSocket连接已关闭');
            });

            // 连接错误
            that.webSocketTask.onError((err) => {
                console.error('=== WebSocket连接失败 ===');
                console.error('错误详情:', err);
                console.error('错误码:', err.errCode);
                console.error('错误信息:', err.errMsg);
                console.error('==================');

                // 根据错误码给出具体提示
                let tips = '连接失败';
                if (err.errCode === 1004) {
                    if (err.errMsg.includes('Invalid HTTP status')) {
                        tips = '鉴权失败：请检查API密钥和服务是否开通';
                    } else if (err.errMsg.includes('Host not found')) {
                        tips = '域名解析失败';
                    } else {
                        tips = '鉴权失败';
                    }
                } else if (err.errCode === 1002) {
                    tips = '服务器关闭连接';
                }

                wx.showToast({
                    title: tips,
                    icon: 'none',
                    duration: 3000
                });
            });

        } catch (error) {
            console.error('WebSocket连接失败:', error);
            wx.showToast({
                title: '连接失败',
                icon: 'none'
            });
        }
    },

    // 发送音频数据（分帧发送，参考 Python 实现）
    sendAudioData: function() {
        const that = this;
        const audioData = that.audioDataBase64;

        console.log('=== 音频数据调试信息 ===');
        console.log('音频数据总长度:', audioData.length);
        console.log('音频数据前100个字符:', audioData.substring(0, 100));
        console.log('音频数据后100个字符:', audioData.substring(audioData.length - 100));
        console.log('=====================');

        // 每次发送 1280 字节的音频数据（与 Python 保持一致）
        const frameSize = 1280;
        let offset = 0;
        let frameCount = 0;

        // 第一帧：status=0，包含参数配置
        function sendFirstFrame() {
            frameCount++;
            console.log(`发送第 ${frameCount} 帧（第一帧，包含参数）`);

            const firstChunk = audioData.slice(0, frameSize);
            offset += frameSize;

            const frame = {
                header: {
                    app_id: that.data.xfyun.appId,
                    status: 0  // 第一帧
                },
                parameter: {
                    iat: {
                        domain: 'slm',
                        language: 'zh_cn',
                        accent: 'mulacc',
                        result: {
                            encoding: 'utf8',
                            compress: 'raw',
                            format: 'json'
                        }
                    }
                },
                payload: {
                    audio: {
                        audio: firstChunk,
                        encoding: 'raw',
                        sample_rate: 16000
                    }
                }
            };

            that.webSocketTask.send({
                data: JSON.stringify(frame),
                success: function() {
                    console.log('第一帧发送成功');
                    // 继续发送中间帧
                    setTimeout(sendMiddleFrames, 40);  // 40ms 间隔，与 Python 一致
                },
                fail: function(err) {
                    console.error('第一帧发送失败:', err);
                }
            });
        }

        // 中间帧：status=1
        function sendMiddleFrames() {
            if (offset >= audioData.length) {
                // 音频发送完毕，发送最后一帧
                sendLastFrame();
                return;
            }

            frameCount++;
            if (frameCount % 10 === 0) {
                console.log(`发送第 ${frameCount} 帧...`);
            }

            const chunk = audioData.slice(offset, offset + frameSize);
            offset += frameSize;

            const frame = {
                header: {
                    app_id: that.data.xfyun.appId,
                    status: 1  // 中间帧
                },
                payload: {
                    audio: {
                        audio: chunk,
                        encoding: 'raw',
                        sample_rate: 16000
                    }
                }
            };

            that.webSocketTask.send({
                data: JSON.stringify(frame),
                success: function() {
                    // 继续发送下一帧
                    setTimeout(sendMiddleFrames, 40);
                },
                fail: function(err) {
                    console.error(`第 ${frameCount} 帧发送失败:`, err);
                }
            });
        }

        // 最后一帧：status=2，audio 为空
        function sendLastFrame() {
            frameCount++;
            console.log(`发送第 ${frameCount} 帧（最后一帧，结束标记）`);

            const frame = {
                header: {
                    app_id: that.data.xfyun.appId,
                    status: 2  // 最后一帧
                },
                payload: {
                    audio: {
                        audio: '',  // 空字符串，表示结束
                        encoding: 'raw',
                        sample_rate: 16000
                    }
                }
            };

            that.webSocketTask.send({
                data: JSON.stringify(frame),
                success: function() {
                    console.log(`音频数据发送完成，共发送 ${frameCount} 帧`);
                },
                fail: function(err) {
                    console.error('最后一帧发送失败:', err);
                }
            });
        }

        // 开始发送第一帧
        sendFirstFrame();
    },

    // 发送第一帧音频（包含参数配置）
    sendFirstAudioFrame: function(base64Data) {
        const that = this;

        const frame = {
            header: {
                app_id: that.data.xfyun.appId,
                status: 0  // 第一帧
            },
            parameter: {
                iat: {
                    domain: 'slm',
                    language: 'zh_cn',
                    accent: 'mulacc',
                    result: {
                        encoding: 'utf8',
                        compress: 'raw',
                        format: 'json'
                    }
                }
            },
            payload: {
                audio: {
                    audio: base64Data,
                    encoding: 'raw',
                    sample_rate: 16000
                }
            }
        };

        that.webSocketTask.send({
            data: JSON.stringify(frame),
            success: function() {
                console.log('✅ 第一帧发送成功（包含参数）');
            },
            fail: function(err) {
                console.error('❌ 第一帧发送失败:', err);
            }
        });
    },

    // 发送中间帧音频
    sendMiddleAudioFrame: function(base64Data) {
        const that = this;

        const frame = {
            header: {
                app_id: that.data.xfyun.appId,
                status: 1  // 中间帧
            },
            payload: {
                audio: {
                    audio: base64Data,
                    encoding: 'raw',
                    sample_rate: 16000
                }
            }
        };

        that.webSocketTask.send({
            data: JSON.stringify(frame),
            success: function() {
                console.log('✅ 中间帧发送成功');
            },
            fail: function(err) {
                console.error('❌ 中间帧发送失败:', err);
            }
        });
    },

    // 发送最后一帧（结束标记）
    sendLastAudioFrame: function() {
        const that = this;

        const frame = {
            header: {
                app_id: that.data.xfyun.appId,
                status: 2  // 最后一帧
            },
            payload: {
                audio: {
                    audio: '',  // 空字符串，表示结束
                    encoding: 'raw',
                    sample_rate: 16000
                }
            }
        };

        that.webSocketTask.send({
            data: JSON.stringify(frame),
            success: function() {
                console.log('✅ 最后一帧发送成功（结束标记）');
            },
            fail: function(err) {
                console.error('❌ 最后一帧发送失败:', err);
            }
        });
    },

    // 处理WebSocket消息
    handleWSMessage: function(data) {
        const that = this;
        try {
            const response = JSON.parse(data);

            if (response.header && response.header.code !== 0) {
                console.error('识别错误:', response.header);
                return;
            }

            if (response.payload && response.payload.result) {
                const result = response.payload.result;
                if (result.text) {
                    try {
                        // 讯飞API的text字段是Base64编码的JSON，需要先解码
                        // 使用 crypto-js 解码 Base64
                        const CryptoJS = require('crypto-js');
                        const words = CryptoJS.enc.Base64.parse(result.text);
                        const decodedText = words.toString(CryptoJS.enc.Utf8);
                        console.log('解码后的text:', decodedText);

                        const textObj = JSON.parse(decodedText);
                        if (textObj.ws && textObj.ws.length > 0) {
                            let sentence = '';
                            textObj.ws.forEach(item => {
                                if (item.cw && item.cw.length > 0) {
                                    sentence += item.cw[0].w;
                                }
                            });

                            // 判断是流式结果还是最终结果
                            if (textObj.pgs === 'rpl' || textObj.ls === true) {
                                // 最终结果，替换之前的内容
                                that.setData({
                                    voiceText: sentence
                                });
                            } else if (textObj.pgs === 'apd') {
                                // 流式结果，追加内容
                                that.setData({
                                    voiceText: that.data.voiceText + sentence
                                });
                            }

                            console.log('识别结果:', sentence);

                            // 检查是否是最后一帧（status=2表示识别结束）
                            if (response.header.status === 2) {
                                console.log('识别完成，最终结果:', that.data.voiceText);
                                // 更新到输入框
                                if (that.data.voiceText) {
                                    that.setData({
                                        content: that.data.content + that.data.voiceText
                                    });
                                }
                                // 关闭WebSocket连接
                                if (that.webSocketTask) {
                                    that.webSocketTask.close();
                                }
                            }
                        }
                    } catch (e) {
                        console.error('解析识别结果失败:', e);
                    }
                }
            }
        } catch (e) {
            console.error('处理消息失败:', e);
        }
    },
})
