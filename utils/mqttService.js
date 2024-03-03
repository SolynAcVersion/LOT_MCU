// utils/mqttService.js

const mqtt = require('../utils/mqtt.min.js');
const crypto = require('../utils/hex_hmac_sha1.js');

class MqttService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    connect(deviceConfig) {
        if (this.client && this.isConnected) {
            return;
        }

        const options = this.initMqttOptions(deviceConfig); 
        this.client = mqtt.connect('wxs://k0t8ejX211I.iot-as-mqtt.cn-shanghai.aliyuncs.com', options);

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('MQTT服务连接成功');
        });

        this.client.on('close', () => {
            this.isConnected = false;
            console.log('MQTT服务连接关闭');
        });

        this.client.on('error', (error) => {
            console.error('MQTT服务连接错误:', error);
        });
    }

    //IoT平台mqtt连接参数初始化
    initMqttOptions(deviceConfig) {
        const params = {
            productKey: deviceConfig.productKey,
            deviceName: deviceConfig.deviceName,
            timestamp: Date.now(),
            clientId: Math.random().toString(36).substr(2),
        }
    
        //CONNECT参数
        const options = {
        keepalive: 60, //60s
            clean: true, //cleanSession不保持持久会话
            protocolVersion: 4 //MQTT v3.1.1
        }
    
        options.password = this.signHmacSha1(params, deviceConfig.deviceSecret);
        options.clientId = `${params.clientId}|securemode=2,signmethod=hmacsha1,timestamp=${params.timestamp}|`;
        options.username = `${params.deviceName}&${params.productKey}`;
        return options;
    }

    /*
        生成基于HmacSha1的password
        参考文档：https://help.aliyun.com/document_detail/73742.html?#h2-url-1
    */
    signHmacSha1(params, deviceSecret) {
        let keys = Object.keys(params).sort();
        keys = keys.sort();
        const list = [];
        keys.map((key) => {
            list.push(`${key}${params[key]}`);
        });
        const contentStr = list.join('');
        return crypto.hex_hmac_sha1(deviceSecret, contentStr);
    }
}

// 实例化并导出MQTT服务
const mqttService = new MqttService();
module.exports = mqttService;
