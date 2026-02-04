// pages/test/test.js
/**
 * 测试 crypto-js 的 HMAC-SHA256 实现
 */

const { hmacSha256 } = require('../../utils/crypto_js_hmac.js');

Page({
    data: {
        testResult: '',
        pythonSignature: 'w4oxPFSauGb5B5v65JLmNQ/hnGZ0paRKeGP6SYVIdJE=',
        wechatSignature: ''
    },

    onLoad() {
        console.log('测试页面加载');
    },

    // 测试 HMAC-SHA256 签名
    testSignature: function() {
        const that = this;

        // 测试数据 - 与Python脚本相同
        const host = 'iat.cn-huabei-1.xf-yun.com';
        const date = 'Tue, 03 Feb 2026 14:47:02 GMT';
        const path = '/v1';
        const apiSecret = 'ODMwNGYzN2Y3YmUwYjQ3MzJkN2MwNjFj';

        // 构造signature_origin
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

        that.setData({
            testResult: '正在计算签名...'
        });

        try {
            // 使用 crypto-js 计算签名（同步）
            const signature = hmacSha256(signatureOrigin, apiSecret);

            console.log('Python期望签名:', that.data.pythonSignature);
            console.log('微信小程序计算签名:', signature);

            that.setData({
                wechatSignature: signature
            });

            // 比对签名
            if (signature === that.data.pythonSignature) {
                that.setData({
                    testResult: '✅ SUCCESS: 签名一致！HMAC-SHA256实现正确'
                });
                wx.showToast({
                    title: '签名验证成功',
                    icon: 'success'
                });
            } else {
                that.setData({
                    testResult: '❌ FAILED: 签名不一致\n\n' +
                                'Python期望: ' + that.data.pythonSignature + '\n' +
                                '微信小程序: ' + signature
                });
                wx.showToast({
                    title: '签名验证失败',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('签名计算失败:', error);
            that.setData({
                testResult: '❌ 错误: ' + error.message
            });
            wx.showToast({
                title: '签名计算失败',
                icon: 'none'
            });
        }
    }
});
