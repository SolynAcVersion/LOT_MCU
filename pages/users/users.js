// pages/users/users.js

const app = getApp();

Page({
    data: {
        login: {
            show: false,
            avatar: '/static/userpage.png',
        }
    },

    chooseAvatar(e) {
        this.setData({
            login: {
                show: true,
                avatar: e.detail.avatarUrl,
            }
        })
    },

    basicClick() {
        console.log('基本信息监听');
    },

    feedbackClick() {
        console.log('匿名反馈监听');
    },

    aboutClick: function() {
        console.log('关于我们监听');
        wx.navigateTo({
            url: '/pages/about/about'
        });
    },

    exitClick() {
        let that = this;
        wx.showModal({
            title: '提示',
            content: '确定退出登录吗？',
            success(res) {
                if (res.confirm) {
                    that.setData({
                        login: {
                            show: false,
                            avatar: '/static/userpage.png',
                        }
                    })
                }
            }
        })
    },
})
