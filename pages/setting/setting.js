// pages/setting/setting.js

const app = getApp(); // 获取全局app实例

Page({
    data: {
        isButtonActive: false, // 按钮激活状态
        temperature_upvalue: "", // 温度上限
        temperature_downvalue: "", // 温度下限
        humidity_upvalue: "", // 湿度上限
        humidity_downvalue: "", // 湿度下限
        soil_humidity_upvalue: "", // 土壤湿度上限
        soil_humidity_downvalue: "", // 土壤湿度下限
        cogas_value: "", // 一氧化碳浓度
        smoggas_value: "", // 烟雾浓度
    },

    handleInput: function(e) {
        const inputType = e.currentTarget.dataset.type;
        const value = e.detail.value.trim();
        this.data[inputType] = value;
    
        const isActive = Object.keys(this.data).some(key => {
            if (key.includes('value')) {
                return this.data[key] !== '';
            }
            return false;
        });
        
        this.setData({
            isButtonActive: isActive
        });
    },
    
    dataUpload: function() {
        wx.getNetworkType({
            success: (res) => {
                if (res.networkType === 'none') {
                    wx.showToast({
                        title: '无网络连接',
                        icon: 'none',
                    });
                    return;
                }

                wx.showLoading({
                    title: '上传数据中',
                });
                
                this.connectAndPublish(() => {
                    wx.hideLoading();
                    wx.showToast({
                        title: '上传设置成功',
                        icon: 'success',
                    });
                    // 清空所有输入框的内容
                    this.setData({
                        temperature_upvalue: "",
                        temperature_downvalue: "",
                        humidity_upvalue: "",
                        humidity_downvalue: "",
                        soil_humidity_upvalue: "",
                        soil_humidity_downvalue: "",
                        cogas_value: "",
                        smoggas_value: "",
                        isButtonActive: false, // 更新按钮状态为不可点击
                    });
                }, () => {
                    wx.hideLoading();
                    wx.showToast({
                        title: '上传设置失败',
                        icon: 'none',
                    });
                });
            },
        });
    },

    connectAndPublish: function(onSuccess, onFailure) {
        if (!app.mqttService.isConnected) {
            wx.showToast({
                title: 'MQTT未连接',
                icon: 'none',
            });
            onFailure && onFailure();
            return;
        }

        const topic = `/sys/k0t8ejX211I/wechat/thing/event/property/post`;
        const params = {
            method: "thing.event.property.post",
            id: Date.now().toString(),
            params: {}
        };
        Object.keys(this.data).forEach(key => {
            if (key.includes('value') && this.data[key] !== '') {
                const numericValue = parseFloat(this.data[key]);
                if (!isNaN(numericValue)) {
                    params.params[key] = numericValue;
                } else {
                    console.log(`Value for ${key} is not a valid number.`);
                }
            }
        });

        const message = JSON.stringify(params);

        if (app.mqttService.client && app.mqttService.client.connected) {
            app.mqttService.client.publish(topic, message, function(err) {
                if (!err) {
                    onSuccess && onSuccess();
                } else {
                    onFailure && onFailure();
                }
            });
        } else {
            console.error('MQTT客户端未连接');
            onFailure && onFailure();
        }
    },
})
