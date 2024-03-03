// app.js

const mqttService = require('utils/mqttService.js');

App({
    globalData: {
        userInfo: null
    },

    onLaunch: function() {
        const logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)

        // 登录
        wx.login({
            success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            }
        })

        const deviceConfig = {
            productKey: "k0t8ejX211I",
            deviceName: "wechat",
            deviceSecret: "7e9e072ba7db938fc30c825b6721813f",
            regionId: "cn-shanghai",
        };
        
        mqttService.connect(deviceConfig);
    },

    mqttService: mqttService
})
