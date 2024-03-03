// pages/chatting/chatting.js

const app = getApp();

var conversationHistory = []; // 用于保存对话历史的数组

Page({
    data: {
        content: '',
        chatList: [], // 假设这是用来在界面上显示对话的数组
        adviceRequested: false, // 标志位，表示advice是否已请求
    },

    onLoad() {
        this.setData({
            login: {
                id: '2024',
                user: '游客',
                avatar: '/static/myself.png'
            },
            chatList: []
        });
        this.initChat();
        // if (!this.data.adviceRequested) {
        //     this.requestChatGPTAdvice();
        //     this.setData({ adviceRequested: true });
        // }
    },

    // 初始化聊天
    initChat: function() {
        var date = new Date();
        var now = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
        const welcomeMsg = {
            msgId: 'system',
            nickname: '系统',
            avatar: '/static/robot.png',
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
            avatar: this.data.login.avatar || '/static/myself.png',
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
            // 如果不是设置或查询指令，将消息发送给 ChatGPT
            that.sendMessageToChatGPT(this.data.content).then((replyMsg) => {
                that.updateChatList(replyMsg);
            }).catch((error) => {
                console.error("Error sending message to ChatGPT:", error);
            });
        }
    },

    // 根据发送的内容回复环境数据或设置值
    replyWithDataOrSettings(content) {
        if (content.includes('温度') || content.includes('湿度') || content.includes('一氧化碳') || content.includes('烟雾') || content.includes('火') || content.includes('鸟') || content.includes('火') || content.includes('风扇') || content.includes('加热器') || content.includes('加湿器') || content.includes('火') || content.includes('水泵') || content.includes('抽水机') || content.includes('蜂鸣器')) {
            let replyMessage = '';
            let settingMessage = '';
            let askMessage = '温室大棚中的';
            let homeData = app.globalData.homeData;
            let num = 0;
            let cnum = 0;
            let dnum = 0;
            let anum = 0;
            let fnum = 0;
            const controlActions = [];
            var isSettingMessage = '';
            let isSettingCommand = 0;

            if (content.includes('温度')) {
                if(num == 0) {
                    replyMessage += `好的，`;
                    settingMessage += `好的，`;
                    num = 1;
                }
                if (content.includes('设置温度上限')) {
                    isSettingMessage = /设置温度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('temperature_upvalue', isSettingMessage[1]);
                        if(success) {
                            if(cnum == 0) {
                                settingMessage += `已为您成功设置`;
                                cnum = 1;
                            }
                            settingMessage += `温度上限为${isSettingMessage[1]}℃。`;
                        } else {
                            settingMessage += `出现错误，设置失败。\n`;
                        }
                    }
                } else if (content.includes('设置温度下限')) {
                    isSettingMessage = /设置温度下限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('temperature_downvalue', isSettingMessage[1]);
                        if(success) {
                            if(cnum == 0) {
                                settingMessage += `已为您成功设置`;
                                cnum = 1;
                            }
                            settingMessage += `温度下限为${isSettingMessage[1]}℃。`;
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('温度上限') || content.includes('温度最大值') || content.includes('温度最高值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    replyMessage += `当前温度上限值是：${homeData.temperature_upvalue}℃。`;
                } else if (content.includes('温度下限') || content.includes('温度最小值') || content.includes('温度最低值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    replyMessage += `当前温度下限值是：${homeData.temperature_downvalue}℃。`;
                } else if (content.includes('温度的正常范围') || content.includes('温度的阈值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    replyMessage += `当前温度的正常范围是：${homeData.temperature_downvalue} ~ ${homeData.temperature_upvalue}℃。`;
                } else if (content.includes('温度')) {
                    if(anum == 0) {
                        replyMessage += `已为您检测到`;
                        anum = 1;
                    }
                    replyMessage += `当前温度是：${homeData.temperature}℃。`;
                    if (homeData.temperature > homeData.temperature_upvalue) {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        replyMessage += `当前的温度高于您设定的温度上限值${homeData.temperature_upvalue}℃，降温风扇已自动为您打开。`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '温度高于适宜农作物生长的温度';
                        fnum = 1;
                    } else if (homeData.temperature < homeData.temperature_downvalue) {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        replyMessage += `当前的温度低于您设定的温度下限值${homeData.temperature_downvalue}，加热器已自动为您打开。`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '温度低于适宜农作物生长的温度';
                        fnum = 1;
                    } else {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        replyMessage += `当前的温度处于正常范围内。`;
                    }
                }
            }

            if (content.includes('湿度')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                    settingMessage += `好的，`;
                    num = 1;
                }
                if (content.includes('设置湿度上限')) {
                    isSettingMessage = /设置湿度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('humidity_upvalue', isSettingMessage[1]);
                        if(success) {
                            if(cnum == 0) {
                                settingMessage += `已为您成功设置`;
                                cnum = 1;
                            }
                            if(cnum !== 0) {
                                settingMessage += `，`;
                                cnum = 1;
                            }
                            settingMessage += `湿度上限为${isSettingMessage[1]}%。`;
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('设置湿度下限')) {
                    isSettingMessage = /设置湿度下限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('humidity_downvalue', isSettingMessage[1]);
                        if(success) {
                            if(cnum == 0) {
                                settingMessage += `已为您成功设置`;
                                cnum = 1;
                            }
                            if(cnum !== 0) {
                                settingMessage += `，`;
                                cnum = 1;
                            }
                            settingMessage += `湿度下限为${isSettingMessage[1]}%。`;
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('湿度上限') || content.includes('湿度最大值') || content.includes('湿度最高值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前设定的湿度上限值是：${homeData.humidity_upvalue}%`;
                } else if (content.includes('湿度下限') || content.includes('湿度最小值') || content.includes('湿度最低值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前设定的湿度下限值是：${homeData.humidity_downvalue}%`;
                } else if (content.includes('湿度的正常范围') || content.includes('湿度的阈值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前湿度的正常范围是：${homeData.humidity_downvalue} ~ ${homeData.humidity_upvalue}%`;
                } else if (content.includes('湿度')) {
                    if(anum == 0) {
                        replyMessage += `已为您检测到`;
                        anum = 1;
                    }
                    if(anum !== 0) {
                        replyMessage += `；`;
                        anum = 1;
                    }
                    replyMessage += `当前湿度是：${homeData.humidity}`;
                    if (homeData.humidity > homeData.humidity_upvalue){
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `；`;
                            anum = 1;
                        }
                        replyMessage += `当前的湿度高于您设定的温度上限值${homeData.humidity_upvalue}，排湿风扇已自动为您打开`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '湿度高于适宜农作物生长的湿度';
                        fnum = 1;
                    } else if (homeData.humidity < homeData.humidity_downvalue) {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `；`;
                            anum = 1;
                        }
                        replyMessage += `当前的湿度低于您设定的湿度下限值${homeData.humidity_downvalue}，加湿器已自动为您打开`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '湿度低于适宜农作物生长的湿度';
                        fnum = 1;
                    } else {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `，`;
                            anum = 1;
                        }
                        replyMessage += `当前的湿度处于正常范围内`;
                    }
                }
            }

            if (content.includes('土壤湿度')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                    settingMessage += `好的，`;
                }
                if (content.includes('设置土壤湿度上限')) {
                    isSettingMessage = /设置土壤湿度上限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('soil_humidity_upvalue', isSettingMessage[1]);
                        if(success) {
                            if(cnum == 0) {
                                settingMessage += `已为您成功设置`;
                            }
                            if(cnum !== 0) {
                                settingMessage += `，`;
                                cnum = 1;
                            }
                            settingMessage += `土壤湿度上限为${isSettingMessage[1]}%`;
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('设置土壤湿度下限')) {
                    isSettingMessage = /设置土壤湿度下限为(\d+(\.\d+)?)/.exec(content);
                    if (isSettingMessage) {
                        let success = this.settingDevicevalue('soil_humidity_downvalue', isSettingMessage[1]);
                        if(success) {
                            if(cnum == 0) {
                                settingMessage += `已为您成功设置`;
                            }
                            if(cnum !== 0) {
                                settingMessage += `，`;
                                cnum = 1;
                            }
                            settingMessage += `土壤湿度下限为${isSettingMessage[1]}%`;
                        } else {
                            settingMessage += `出现错误，设置失败。`;
                        }
                    }
                } else if (content.includes('土壤湿度上限') || content.includes('土壤湿度最大值') || content.includes('土壤湿度最高值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前设定的土壤湿度上限值是：${homeData.soil_humidity_upvalue}%`;
                } else if (content.includes('土壤湿度下限')  || content.includes('土壤湿度最小值') || content.includes('土壤湿度最低值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前设定的土壤湿度下限是：${homeData.soil_humidity_downvalue}%`;
                } else if (content.includes('土壤湿度的正常范围') || content.includes('土壤湿度的阈值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前土壤湿度的正常范围是：${homeData.soil_humidity_downvalue} ~ ${homeData.soil_humidity_upvalue}%`;
                } else if (content.includes('土壤湿度')) {
                    if(anum == 0) {
                        replyMessage += `已为您检测到`;
                        anum = 1;
                    }
                    if(anum !== 0) {
                        replyMessage += `，`;
                        anum = 1;
                    }
                    replyMessage += `当前土壤湿度是：${homeData.soil_humidity}`;
                    if (homeData.soil_humidity > homeData.soil_humidity_upvalue){
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `；`;
                            anum = 1;
                        }
                        replyMessage += `当前的土壤湿度高于您设定的土壤湿度上限值${homeData.soil_humidity_upvalue}，抽水器已自动为您打开`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '土壤湿度高于适宜农作物生长的土壤湿度';
                        fnum = 1;
                    } else if (homeData.soil_humidity < homeData.soil_humidity_downvalue) {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `；`;
                            anum = 1;
                        }
                        replyMessage += `当前的土壤湿度低于您设定的土壤湿度下限值${homeData.soil_humidity_downvalue}，水泵已自动为您打开`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '土壤湿度低于适宜农作物生长的土壤湿度';
                        fnum = 1;
                    } else {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `，`;
                            anum = 1;
                        }
                        replyMessage += `当前的土壤湿度处于正常范围内`;
                    }
                }
            }

            if (content.includes('设置一氧化碳浓度上限')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                    settingMessage += `好的，`;
                }
                isSettingMessage = /设置一氧化碳浓度上限为(\d+(\.\d+)?)/.exec(content);
                if (isSettingMessage) {
                    let success = this.settingDevicevalue('cogas_value', isSettingMessage[1]);
                    if(success) {
                        if(cnum == 0) {
                            settingMessage += `已为您成功设置`;
                        }
                        if(cnum !== 0) {
                            settingMessage += `，`;
                            cnum = 1;
                        }
                        settingMessage += `一氧化碳浓度上限为${isSettingMessage[1]}ppm`;
                    } else {
                        settingMessage += `出现错误，设置失败。`;
                    }
                }
            } else if (content.includes('一氧化碳') || content.includes('CO')) {
                if (content.includes('一氧化碳浓度上限') || content.includes('一氧化碳浓度最大值') || content.includes('一氧化碳浓度最高值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前设定的一氧化碳浓度上限值是：${homeData.cogas_value}ppm`;
                } else if (content.includes('一氧化碳浓度的正常范围') || content.includes('一氧化碳浓度的阈值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前一氧化碳浓度的正常范围是：${homeData.cogas_value}ppm ≤ 一氧化碳浓度`;
                } else if (content.includes('一氧化碳浓度')) {
                    if(anum == 0) {
                        replyMessage += `已为您检测到`;
                        anum = 1;
                    }
                    if(anum !== 0) {
                        replyMessage += `，`;
                        anum = 1;
                    }
                    replyMessage += `当前一氧化碳浓度是：${homeData.cogas}ppm`;
                    if (homeData.cogas > homeData.cogas_value){
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `；`;
                            anum = 1;
                        }
                        replyMessage += `当前一氧化碳的浓度高于您设定的一氧化碳浓度上限值${homeData.cogas_value}，风扇已自动为您打开`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '一氧化碳高于一氧化碳浓度上限值';
                        fnum = 1;
                    } else {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `，`;
                            anum = 1;
                        }
                        replyMessage += `当前一氧化碳的浓度处于正常范围内`;
                    }
                }
            }

            if (content.includes('设置烟雾浓度上限')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                    settingMessage += `好的，`;
                }
                isSettingMessage = /设置烟雾浓度上限为(\d+(\.\d+)?)/.exec(content);
                if (isSettingMessage) {
                    let success = this.settingDevicevalue('smoggas_value', isSettingMessage[1]);
                    if(success) {
                        if(cnum == 0) {
                            settingMessage += `已为您成功设置`;
                        }
                        if(cnum !== 0) {
                            settingMessage += `，`;
                            cnum = 1;
                        }
                        settingMessage += `烟雾浓度上限为${isSettingMessage[1]}ppm。`;
                    } else {
                        settingMessage += `出现错误，设置失败。`;
                    }
                }
            } else if (content.includes('烟雾浓度')) {
                if (content.includes('烟雾浓度上限') || content.includes('烟雾浓度最大值') || content.includes('烟雾浓度最高值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前设定的烟雾浓度上限是：${homeData.smoggas_value}ppm`;
                } else if (content.includes('烟雾浓度的正常范围') || content.includes('烟雾浓度的阈值')) {
                    if(dnum == 0) {
                        replyMessage += `已为您查询到`;
                        dnum = 1;
                    }
                    if(dnum !== 0) {
                        replyMessage += `，`;
                        dnum = 1;
                    }
                    replyMessage += `当前烟雾浓度的正常范围是：${homeData.smoggas_value}ppm ≤ 烟雾浓度`;
                } else if (content.includes('烟雾浓度')) {
                    if(anum == 0) {
                        replyMessage += `已为您检测到`;
                        anum = 1;
                    }
                    if(anum !== 0) {
                        replyMessage += `，`;
                        anum = 1;
                    }
                    replyMessage += `当前烟雾浓度是：${homeData.smoggas}`;
                    if (homeData.smoggas > homeData.smoggas_value){
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `；`;
                            anum = 1;
                        }
                        replyMessage += `当前的烟雾浓度高于您设定的烟雾浓度上限值${homeData.smoggas_value}，风扇已自动为您打开`;
                        if(fnum !== 0) {
                            askMessage += `，`;
                        }
                        askMessage += '烟雾浓度高于烟雾浓度上限值';
                        fnum = 1;
                    } else {
                        if(anum == 0) {
                            replyMessage += `已为您检测到`;
                            anum = 1;
                        }
                        if(anum !== 0) {
                            replyMessage += `，`;
                            anum = 1;
                        }
                        replyMessage += `当前的烟雾浓度处于正常范围内`;
                    }
                }
            }

            // settingMessage += '。\n';
            // replyMessage += '。';
            // settingMessage += replyMessage;
            // replyMessage = settingMessage;

            if (content.includes('火')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.fire == 0){
                    replyMessage += `！！已为您检测到当前出现了火源，系统已为您自动打开了淋水器灭火！！`;
                } else{
                    replyMessage += `已为您检测到当前未出现火源。`;
                }
            }

            if (content.includes('鸟')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.fire == 0) {
                    replyMessage += `已为您检测到当前不存在鸟类。`;
                } else{
                    replyMessage += `！！已为您检测到当前存在鸟类，系统已为您自动打开了驱鸟器驱鸟！！`;
                }
            }
            
            if (content.includes('打开风扇')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.fan == 1) {
                    replyMessage += `已为您打开了风扇。`;
                } else {
                    controlActions.push({ action: 'open', device: 'fan', chinese: '风扇' });
                }
            } else if (content.includes('关闭风扇')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.fan == 0) {
                    replyMessage += `已为您关闭了风扇。`;
                } else {
                    controlActions.push({ action: 'close', device: 'fan', chinese: '风扇' });
                }
            } else if(content.includes('风扇')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.fan == 1) {
                    replyMessage += `已为您检测到风扇已处于打开状态。`;
                } else if (homeData.fan == 0) {
                    replyMessage += `已为您检测到风扇已处于关闭状态。`;
                }
            }

            if (content.includes('打开加热器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.heat == 1) {
                    replyMessage += `已为您打开了加热器。`;
                } else {
                    controlActions.push({ action: 'open', device: 'heat', chinese: '加热器' });
                }
            } else if (content.includes('关闭加热器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.heat == 0) {
                    replyMessage += `已为您打开了加热器。`;
                } else {
                    controlActions.push({ action: 'close', device: 'heat', chinese: '加热器' });
                }
            } else if(content.includes('加热器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.heat == 1) {
                    replyMessage += `已为您检测到加热器已处于打开状态。`;
                } else if (homeData.heat == 0) {
                    replyMessage += `已为您检测到加热器已处于关闭状态。`;
                }
            }

            if (content.includes('打开加湿器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.humidification == 1) {
                    replyMessage += `已为您打开了加湿器。`;
                } else {
                    controlActions.push({ action: 'open', device: 'humidification', chinese: '加湿器' });
                }
            } else if (content.includes('关闭加湿器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.humidification == 0) {
                    replyMessage += `已为您关闭了加湿器。`;
                } else {
                    controlActions.push({ action: 'close', device: 'humidification', chinese: '加湿器' });
                }
            } else if(content.includes('加湿器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.humidification == 1) {
                    replyMessage += `已为您检测到加湿器已处于打开状态。`;
                } else if (homeData.humidification == 0) {
                    replyMessage += `已为您检测到加湿器已处于关闭状态。`;
                }
            }

            if (content.includes('打开水泵')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.pumpout == 1) {
                    replyMessage += `已为您打开了水泵。`;
                } else {
                    controlActions.push({ action: 'open', device: 'pumpout', chinese: '水泵' });
                }
            } else if (content.includes('关闭水泵')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.pumpout == 0) {
                    replyMessage += `已为您关闭了水泵。`;
                } else {
                    controlActions.push({ action: 'close', device: 'pumpout', chinese: '水泵' });
                }
            } else if(content.includes('水泵')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.pumpout == 1) {
                    replyMessage += `已为您检测到水泵已处于打开状态。`;
                } else if (homeData.pumpout == 0) {
                    replyMessage += `已为您检测到水泵已处于关闭状态。`;
                }
            }

            if (content.includes('打开抽水')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.pumpin == 1) {
                    replyMessage += `已为您打开了抽水器。`;
                } else {
                    controlActions.push({ action: 'open', device: 'pumpin', chinese: '抽水机' });
                }
            } else if (content.includes('关闭抽水')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.pumpin == 0) {
                    replyMessage += `已为您关闭了抽水器。`;
                } else {
                    controlActions.push({ action: 'close', device: 'pumpin', chinese: '抽水机' });
                }
            } else if(content.includes('抽水')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.pumpin == 1) {
                    replyMessage += `已为您检测到抽水器已处于打开状态。`;
                } else if (homeData.pumpin == 0) {
                    replyMessage += `已为您检测到抽水器已处于关闭状态。`;
                }
            }

            if (content.includes('打开蜂鸣器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.buzzer == 1) {
                    replyMessage += `已为您打开了蜂鸣器。`;
                } else {
                    controlActions.push({ action: 'open', device: 'buzzer', chinese: '蜂鸣器' });
                }
            } else if (content.includes('关闭蜂鸣器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.buzzer == 0) {
                    replyMessage += `已为您关闭了蜂鸣器。`;
                } else {
                    controlActions.push({ action: 'close', device: 'buzzer', chinese: '蜂鸣器' });
                }
            } else if(content.includes('蜂鸣器')) {
                isSettingCommand = 1;
                if(num == 0){
                    replyMessage += `好的，`;
                }
                if (homeData.buzzer == 1) {
                    replyMessage += `已为您检测到蜂鸣器已处于打开状态。`;
                } else if (homeData.buzzer == 0) {
                    replyMessage += `已为您检测到蜂鸣器已处于关闭状态。`;
                }
            }

            for (let { action, device, chinese } of controlActions) {
                if(this.controlDevice(device, action === 'open' ? 1 : 0)) {
                    replyMessage += `${num}、${chinese}已${action === 'open' ? '打开' : '关闭'}。\n`;
                num += 1;
                }
            }

            if (replyMessage !== '' || askMessage !== '温室大棚中的') {
                if (replyMessage !== '') {
                    var replyMsg = this.constructReplyMessage(replyMessage);
                    this.updateChatList(replyMsg);
                }
                if (askMessage !== '温室大棚中的') {
                    askMessage += '时可能会导致的农作物生长时出现的问题都有哪些？';
                    this.sendMessageToChatGPT(askMessage).then((gptReply) => {
                        this.updateChatList(gptReply);
                    });
                }
                return true;
            } 
        } else {
            console.log('对话不存在关键字。');
            return false;
        }
    },

    // 查找关键字
    messageMeetsCriteria: function(message) {
        const keywords=["温度","湿度","土壤","土壤湿度","二氧化碳","光照","植物","农作物",
                        "火","鸟","大棚","通风","灌溉","加热","降温","加湿","除湿","风扇",
                        "加热","水泵","抽水机","蜂鸣器","灯光","阀门","火灾","烟雾","泄露",
                        "一氧化碳","监控","种植","作物","营养液","病虫害","上限","下限",
                        "最大值","最高值","最小值","最低值","阈值","范围","收成","报告",
                        "数据分析","实时数据","帮助","设置","查询","历史","稻谷","大米",
                        "小麦","玉米","大麦","黍","高粱","黑麦","燕麦","谷子","雀麦",
                        "西红柿","黄瓜","茄子","菠菜","生菜","卷心菜","花椰菜","西兰花",
                        "胡萝卜","土豆","马铃薯","洋葱","大蒜","辣椒","豆","青豆","豌豆",
                        "苹果","梨","桃","樱桃","橙子","香蕉","葡萄","芒果","猕猴桃","柠檬",
                        "棉花","烟草","橡胶树","油菜籽","花生","向日葵","大豆","甘蔗","甜菜",
                        "牧草","紫花苜蓿","高粱","玉米","豆类","人参","黄芪","甘草","茯苓",
                        "胡椒","肉桂","丁香","香草"]; // 关键词列表
        return keywords.some(keyword => message.includes(keyword));
    },
    
    sendGenericResponse: function() {
        constructReplyMessage("很抱歉，我目前只能回答关于智能温室大棚的问题。");
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
            avatar: '/static/robot.png',
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
            conversationHistory.push({
                role: "user",
                content: message
            });
            wx.request({
                url: 'https://migow.club/v1/chat/completions',
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-ut2khvQ2Z88BounwB73b752f949c407192Fb0077FaC3AfF3'
                },
                data: {
                    model: "gpt-4-vision-preview",
                    messages: conversationHistory,
                    max_tokens: 1024,
                },
                success: function(res) {
                    if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
                        console.log(res); 
                        var replyMsg = {
                            msgId: 'system',
                            nickname: '系统',
                            avatar: '/static/robot.png',
                            message: res.data.choices[0]["message"]["content"],
                            type: 'text',
                            date: `${new Date().getMonth() + 1}-${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}`
                        };
                        resolve(replyMsg);
                    } else {
                        reject('Failed to get valid response from ChatGPT');
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
    },

    requestChatGPTAdvice: function() {
        if (this.data.adviceRequested) {
            return;
        }
        var that = this;
        let weatherInfo = app.globalData.weatherInfo;
        let temperature = app.globalData.homeData.temperature;
        let humidity = app.globalData.homeData.humidity;
        let soilHumidity = app.globalData.homeData.soil_humidity;
        if (weatherInfo && temperature && humidity && soilHumidity ) {
            let message = `温室大棚当前在${weatherInfo.location.name}，当前天气状况为${weatherInfo.daily[0].text_day}到${weatherInfo.daily[0].text_night}，当前温度为${weatherInfo.daily[0].low}到${weatherInfo.daily[0].high}℃。现在大棚温室内温度为${temperature}℃，湿度为${humidity}%，土壤湿度为${soilHumidity}%。请你针对当前该地的天气和温室大棚内的环境提供合理的种植与管理建议。`;
            that.sendMessageToChatGPT(message);
        } else {
            console.log('天气或环境数据尚未准备好。');
        }
        this.setData({ adviceRequested: true });
    },
})
