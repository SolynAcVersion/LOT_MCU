// pages/home/home.js

const app = getApp(); // 获取全局app实例

Page({
    data: {
        weatherInfo: null,
        viewHeight: 700, // 默认高度
        current: 0,
        pages: ['page1', 'page2', 'page3'],

        temperature: 0.0, // 温度
        humidity: 0.0, // 湿度
        soil_humidity: 0.0, // 土壤湿度
        cogas: 0.0, // 一氧化碳浓度
        smoggas: 0.0, // 烟雾浓度
        fire: 1, // 火焰状态

        /* 状态'1'表示打开，'0'表示关闭 */
        fan: 0, // 风扇状态
        heat: 0, // 加热器状态
        humidification: 0, // 加湿器状态
        pumpout: 0,  // 水泵状态
        pumpin: 0, // 抽水机状态
        buzzer: 0, // 蜂鸣器状态

        temperature_upvalue: 0.0, // 温度上限
        temperature_downvalue: 0.0, // 温度下限
        humidity_upvalue: 0.0, // 湿度上限
        humidity_downvalue: 0.0, // 湿度下限
        soil_humidity_upvalue: 0.0, // 土壤湿度上限
        soil_humidity_downvalue: 0.0, // 土壤湿度下限
        cogas_value: 0.0, // 一氧化碳浓度
        smoggas_value: 0.0, // 烟雾浓度

        bird: 0, // 鸟

        somewhere_temperature: 0.0, // 任意地方温度
        somewhere_humidity: 0.0, // 任意地方湿度
    },

    // 轮播图滑动监听
    bindchange(e) {
        this.setData({
            current: e.detail.current
        })
    },

    // 轮播图点击监听
    previewImageClick(e) {
        var url = e.currentTarget.dataset.path;
    },

    // 生命周期函数--监听页面初次渲染完成
    onReady() {
        var that = this;
        wx.getSystemInfo({
            success(res) {
                that.setData({
                    viewHeight: res.windowHeight
                })
            }
        })
    },

    onLoad: function() {
        this.fetchLocationAndWeather();
        this.doConnect();
        app.globalData.homeData = {
            temperature: 0, // 温度
            humidity: 0, // 湿度
            soil_humidity: 0, // 土壤湿度
            cogas: 0, // 一氧化碳浓度
            smoggas: 0, // 烟雾浓度
            fire: 0, // 火焰状态

            temperature_upvalue: 0, // 温度上限
            temperature_downvalue: 0, // 温度下限
            humidity_upvalue: 0, // 湿度上限
            humidity_downvalue: 0, // 湿度下限
            soil_humidity_upvalue: 0, // 土壤湿度上限
            soil_humidity_downvalue: 0, // 土壤湿度下限
            cogas_value: 0, // 一氧化碳浓度
            smoggas_value: 0, // 烟雾浓度

            bird: 0, // 鸟

            /* 状态'1'表示打开，'0'表示关闭 */
            fan: 0, // 风扇状态
            heat: 0, // 加热器状态
            humidification: 0, // 加湿器状态
            pumpout: 0,  // 水泵状态
            pumpin: 0, // 抽水机状态
            buzzer: 0, // 蜂鸣器状态

            somewhere_temperature: 0.0, // 任意地方温度
            somewhere_humidity: 0.0, // 任意地方湿度
        };
        this.fetchLocationAndWeather();
        this.doConnect();
    },

    fetchLocationAndWeather: function() {
        let that = this;
        wx.getLocation({
            type: 'wgs84',
            success(res) {
                const latitude = res.latitude
                const longitude = res.longitude
                that.fetchWeather(latitude, longitude);
            }
        })
    },

    fetchWeather: function(latitude, longitude) {
        let that = this;
        wx.request({
            url: `https://api.seniverse.com/v3/weather/daily.json`,
            data: {
                key: 'SoAr75JGUgwhBvWU2',
                location: `${latitude}:${longitude}`,
                language: 'zh-Hans',
                unit: 'c',
                start: 0,
                days: 3
            },
            success: function(res) {
                that.setData({
                    weatherInfo: res.data.results[0]
                });
                app.globalData.weatherInfo = res.data.results[0];
            }
        });
    },

    doConnect: function() {
        var _this = this;
        const deviceConfig = {
            productKey: "k0t8ejX211I",
            deviceName: "wechat",
            deviceSecret: "7e9e072ba7db938fc30c825b6721813f",
            regionId: "cn-shanghai",
        };

        // 使用mqttService进行连接
        app.mqttService.connect(deviceConfig);

        // 订阅消息
        if (app.mqttService.client) {
            app.mqttService.client.on('message', function (topic, message) {
                // message is Buffer
                message = message.toString();
                console.log('收到消息：' + message);

                // 解析JSON格式的消息
                let msgObj;
                try {
                    msgObj = JSON.parse(message);
                } catch (e) {
                    console.error('消息解析失败', e);
                    return;
                }

                if (msgObj && msgObj.items) {
                    _this.setData({
                        temperature: msgObj.items.temperature ? msgObj.items.temperature.value : _this.data.temperature,
                        humidity: msgObj.items.humidity ? msgObj.items.humidity.value : _this.data.humidity,
                        soil_humidity: msgObj.items.soil_humidity ? msgObj.items.soil_humidity.value : _this.data.soil_humidity,
                        cogas: msgObj.items.cogas ? msgObj.items.cogas.value : _this.data.cogas,
                        smoggas: msgObj.items.smoggas ? msgObj.items.smoggas.value : _this.data.smoggas,
                        fire: msgObj.items.fire ? msgObj.items.fire.value : _this.data.fire,
                        bird:  msgObj.items.bird ? msgObj.items.bird.value : _this.data.bird,
                        somewhere_temperature: msgObj.items.somewhere_temperature ? msgObj.items.somewhere_temperature.value : _this.data.somewhere_temperature,
                        somewhere_humidity: msgObj.items.somewhere_humidity ? msgObj.items.somewhere_humidity.value : _this.data.somewhere_humidity,
                    });

                    const newState = {
                        fan: msgObj.items.fan ? msgObj.items.fan.value : _this.data.fan,
                        heat: msgObj.items.heat ? msgObj.items.heat.value : _this.data.heat,
                        humidification: msgObj.items.humidification ? msgObj.items.humidification.value : _this.data.humidification,
                        pumpout: msgObj.items.pumpout ? msgObj.items.pumpout.value : _this.data.pumpout,
                        pumpin: msgObj.items.pumpin ? msgObj.items.pumpin.value : _this.data.pumpin,
                        buzzer: msgObj.items.buzzer ? msgObj.items.buzzer.value : _this.data.buzzer,

                        temperature_upvalue: msgObj.items.temperature_upvalue ? msgObj.items.temperature_upvalue.value : _this.data.temperature_upvalue,
                        temperature_downvalue: msgObj.items.temperature_downvalue ? msgObj.items.temperature_downvalue.value : _this.data.temperature_downvalue,
                        humidity_upvalue: msgObj.items.humidity_upvalue ? msgObj.items.humidity_upvalue.value : _this.data.humidity_upvalue,
                        humidity_downvalue: msgObj.items.humidity_downvalue ? msgObj.items.humidity_downvalue.value : _this.data.humidity_downvalue,
                        soil_humidity_upvalue: msgObj.items.soil_humidity_upvalue ? msgObj.items.soil_humidity_upvalue.value : _this.data.soil_humidity_upvalue,
                        soil_humidity_downvalue: msgObj.items.soil_humidity_downvalue ? msgObj.items.soil_humidity_downvalue.value : _this.data.soil_humidity_downvalue,
                        cogas_value: msgObj.items.cogas_value ? msgObj.items.cogas_value.value : _this.data.cogas_value,
                        smoggas_value: msgObj.items.smoggas_value ? msgObj.items.smoggas_value.value : _this.data.smoggas_value,
                    };

                    for (let key in newState) {
                        if (newState[key] !== _this.data[key]) {
                            let updateObj = {};
                            updateObj[key] = newState[key];
                            _this.setData(updateObj);
                        }
                    }
                    _this.setData(newState);
                } else if (msgObj && msgObj.params) {
                    _this.setData({
                        fan: msgObj.params.fan !== undefined ? msgObj.params.fan : _this.data.fan,
                        heat: msgObj.params.heat !== undefined ? msgObj.params.heat : _this.data.heat,
                        humidification: msgObj.params.humidification !== undefined ? msgObj.params.humidification : _this.data.humidification,
                        pumpout: msgObj.params.pumpout !== undefined ? msgObj.params.pumpout : _this.data.pumpout,
                        pumpin: msgObj.params.pumpin !== undefined ? msgObj.params.pumpin : _this.data.pumpin,
                        buzzer: msgObj.params.buzzer !== undefined ? msgObj.params.buzzer : _this.data.buzzer,
                        
                        temperature_upvalue: msgObj.params.temperature_upvalue || _this.data.temperature_upvalue,
                        temperature_downvalue: msgObj.params.temperature_downvalue || _this.data.temperature_downvalue,
                        humidity_upvalue: msgObj.params.humidity_upvalue || _this.data.humidity_upvalue,
                        humidity_downvalue: msgObj.params.humidity_downvalue || _this.data.humidity_downvalue,
                        soil_humidity_upvalue: msgObj.params.soil_humidity_upvalue || _this.data.soil_humidity_upvalue,
                        soil_humidity_downvalue: msgObj.params.soil_humidity_downvalue || _this.data.soil_humidity_downvalue,
                        cogas_value: msgObj.params.cogas_value || _this.data.cogas_value,
                        smoggas_value: msgObj.params.smoggas_value || _this.data.smoggas_value,
                    });
                } else {
                    console.error('消息中不包含期望的数据或 params 对象未定义');
                }
                app.globalData.homeData = {
                    temperature: _this.data.temperature, // 温度
                    humidity: _this.data.humidity, // 湿度
                    soil_humidity: _this.data.soil_humidity, // 土壤湿度
                    cogas: _this.data.cogas, // 一氧化碳浓度
                    smoggas: _this.data.smoggas, // 烟雾浓度
                    fire: _this.data.fire, // 火焰状态

                    temperature_upvalue: _this.data.temperature_upvalue, // 温度上限
                    temperature_downvalue: _this.data.temperature_downvalue, // 温度下限
                    humidity_upvalue: _this.data.humidity_upvalue, // 湿度上限
                    humidity_downvalue: _this.data.humidity_downvalue, // 湿度下限
                    soil_humidity_upvalue: _this.data.soil_humidity_upvalue, // 土壤湿度上限
                    soil_humidity_downvalue: _this.data.soil_humidity_downvalue, // 土壤湿度下限
                    cogas_value: _this.data.cogas_value, // 一氧化碳浓度
                    smoggas_value: _this.data.smoggas_value, // 烟雾浓度
                };
            });
        }
    },

    // 风扇按钮的状态的变化
    handleFanSwitchChange: function(e) {
        const newStatus = e.detail.value; // 获取开关新的状态
        console.log('风扇状态变化:', newStatus);
        this.setData({
            fan: newStatus // 更新风扇状态
        });
        const payload = {
            fan: newStatus ? 1 : 0, // '1'表示打开，'0'表示关闭
        };
        this.sendDataToAliyunIoT(payload); // 调用发送数据到阿里云的函数
    },

    // 加热器按钮的状态的变化
    handleHeatSwitchChange: function(e) {
        const newStatus = e.detail.value; // 获取开关新的状态
        console.log('风扇状态变化:', newStatus);
        this.setData({
            heat: newStatus // 更新加热器状态
        });
        const payload = {
            heat: newStatus ? 1 : 0, // '1'表示打开，'0'表示关闭
        };
        this.sendDataToAliyunIoT(payload); // 调用发送数据到阿里云的函数
    },

    // 加湿器按钮的状态的变化
    handleHumidificationSwitchChange: function(e) {
        const newStatus = e.detail.value; // 获取开关新的状态
        console.log('风扇状态变化:', newStatus);
        this.setData({
            humidification: newStatus // 更新加湿器状态
        });
        const payload = {
            humidification: newStatus ? 1 : 0, // '1'表示打开，'0'表示关闭
        };
        this.sendDataToAliyunIoT(payload); // 调用发送数据到阿里云的函数
    },

    // 水泵按钮的状态的变化
    handlePumpoutSwitchChange: function(e) {
        const newStatus = e.detail.value; // 获取开关新的状态
        console.log('风扇状态变化:', newStatus);
        this.setData({
            pumpout: newStatus // 更新水泵状态
        });
        const payload = {
            pumpout: newStatus ? 1 : 0, // '1'表示打开，'0'表示关闭
        };
        this.sendDataToAliyunIoT(payload); // 调用发送数据到阿里云的函数
    },

    // 抽水器按钮的状态的变化
    handlePumpinSwitchChange: function(e) {
        const newStatus = e.detail.value; // 获取开关新的状态
        console.log('风扇状态变化:', newStatus);
        this.setData({
            pumpin: newStatus // 更新抽水器状态
        });
        const payload = {
            pumpin: newStatus ? 1 : 0, // '1'表示打开，'0'表示关闭
        };
        this.sendDataToAliyunIoT(payload); // 调用发送数据到阿里云的函数
    },

    // 蜂鸣器按钮的状态的变化
    handleBuzzerSwitchChange: function(e) {
        const newStatus = e.detail.value; // 获取开关新的状态
        console.log('风扇状态变化:', newStatus);
        this.setData({
            buzzer: newStatus // 更新蜂鸣器状态
        });
        const payload = {
            buzzer: newStatus ? 1 : 0, // '1'表示打开，'0'表示关闭
        };
        this.sendDataToAliyunIoT(payload); // 调用发送数据到阿里云的函数
    },

    // 发布数据
    sendDataToAliyunIoT: function(payload) {
        var _this = this;

        // 构造发送的数据格式
        const topic = `/sys/k0t8ejX211I/wechat/thing/event/property/post`;
        const message = JSON.stringify({
            params: payload,
            method: "thing.event.property.post",
            id: Date.now().toString(),
            version: "1.0.0",
        });

        if (app.mqttService.client && app.mqttService.client.connected) {
            app.mqttService.client.publish(topic, message, function(err) {
                if (!err) {
                    console.log('数据发送成功');
                } else {
                    console.error('数据发送失败:', err);
                }
            });
        } else {
            console.error('MQTT客户端未连接');
        }
    },

    onAddDevice: function() {
        wx.navigateTo({
            url: '/pages/add/add'
        });
    },
})
