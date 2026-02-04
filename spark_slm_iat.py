# -*- coding:utf-8 -*-
#
#   author: iflytek
#
#  本demo测试时运行的环境为：Windows + Python3.7
#  本demo测试成功运行时所安装的第三方库及其版本如下，您可自行逐一或者复制到一个新的txt文件利用pip一次性安装：
#   cffi==1.12.3
#   gevent==1.4.0
#   greenlet==0.4.15
#   pycparser==2.19
#   six==1.12.0
#   websocket==0.2.1
#   websocket-client==0.56.0
#
#  错误码链接：https://www.xfyun.cn/document/error-code （code返回错误码时必看）
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
import _thread as thread
import time
from time import mktime

import websocket

import base64
import datetime
import hashlib
import hmac
import json
import ssl
from datetime import datetime
from urllib.parse import urlencode
from wsgiref.handlers import format_date_time
import os

STATUS_FIRST_FRAME = 0  # 第一帧的标识
STATUS_CONTINUE_FRAME = 1  # 中间帧标识
STATUS_LAST_FRAME = 2  # 最后一帧的标识

# ============ 配置区域 ============
# 从微信小程序配置文件中获取的真实API信息
APPID = 'bfcf5342'
APIKey = 'c5836bcbb370e34dd19ffc0edbb2a0dc'
APISecret = 'ODMwNGYzN2Y3YmUwYjQ3MzJkN2MwNjFj'

# 音频文件路径（请修改为实际的音频文件路径）
# 支持格式：PCM (raw), 采样率16kHz, 16位深, 单声道
AudioFile = r'test_audio.pcm'

# WebSocket服务地址 - 方言识别大模型（官方地址）
HOST = 'iat.cn-huabei-1.xf-yun.com'
PATH = '/v1'
# ===============================

print("=" * 60)
print("科大讯飞语音识别API测试")
print("=" * 60)
print(f"APPID: {APPID}")
print(f"APIKey: {APIKey}")
print(f"APISecret: {APISecret[:10]}..." if len(APISecret) > 10 else f"APISecret: {APISecret}")
print(f"音频文件: {AudioFile}")
print(f"服务地址: wss://{HOST}{PATH}")
print("=" * 60)

# 检查音频文件是否存在
if not os.path.exists(AudioFile):
    print(f"\n[错误] 音频文件不存在: {AudioFile}")
    print("请准备一个PCM格式的音频文件（16kHz, 16bit, 单声道）")
    print("或者修改 AudioFile 变量指向正确的文件路径")
    exit(1)

file_size = os.path.getsize(AudioFile)
print(f"\n[信息] 音频文件大小: {file_size} 字节 ({file_size/1024:.2f} KB)")
print("=" * 60)


class Ws_Param(object):
    # 初始化
    def __init__(self, APPID, APIKey, APISecret, AudioFile):
        self.APPID = APPID
        self.APIKey = APIKey
        self.APISecret = APISecret
        self.AudioFile = AudioFile
        self.iat_params = {
            "domain": "slm",
            "language": "zh_cn",
            "accent": "mulacc",
            "result": {
                "encoding": "utf8",
                "compress": "raw",
                "format": "json"
            }
        }

    # 生成url
    def create_url(self):
        url = f'wss://{HOST}{PATH}'
        # 生成RFC1123格式的时间戳
        now = datetime.now()
        date = format_date_time(mktime(now.timetuple()))

        print("\n[鉴权] 开始生成鉴权URL...")
        print(f"[鉴权] 原始参数:")
        print(f"  - host: {HOST}")
        print(f"  - date: {date}")
        print(f"  - path: {PATH}")

        # 拼接字符串
        signature_origin = "host: " + HOST + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + PATH + " HTTP/1.1"

        print(f"[鉴权] signature_origin:\n{repr(signature_origin)}")

        # 进行hmac-sha256进行加密
        signature_sha = hmac.new(self.APISecret.encode('utf-8'), signature_origin.encode('utf-8'),
                                 digestmod=hashlib.sha256).digest()
        signature_sha = base64.b64encode(signature_sha).decode(encoding='utf-8')

        print(f"[鉴权] signature (base64): {signature_sha}")

        authorization_origin = "api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"" % (
            self.APIKey, "hmac-sha256", "host date request-line", signature_sha)

        print(f"[鉴权] authorization_origin: {authorization_origin}")

        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

        print(f"[鉴权] authorization (base64): {authorization[:50]}...")

        # 将请求的鉴权参数组合为字典
        v = {
            "authorization": authorization,
            "date": date,
            "host": HOST
        }
        # 拼接鉴权参数，生成url
        url = url + '?' + urlencode(v)

        print(f"[鉴权] 完整URL长度: {len(url)} 字符")
        print("[鉴权] URL生成完成\n")

        return url


# 收到websocket消息的处理
def on_message(ws, message):
    message = json.loads(message)
    code = message["header"]["code"]
    status = message["header"]["status"]

    print(f"[消息] 收到响应 - code: {code}, status: {status}")

    if code != 0:
        print(f"[错误] 请求错误码：{code}")
        print(f"[错误] 错误信息：{message}")
        ws.close()
    else:
        payload = message.get("payload")
        if payload:
            text = payload["result"]["text"]
            text = json.loads(str(base64.b64decode(text), "utf8"))
            text_ws = text['ws']
            result = ''
            for i in text_ws:
                for j in i["cw"]:
                    w = j["w"]
                    result += w
            print(f"[识别] 结果: {result}")

        if status == 2:
            print("[完成] 识别结束，WebSocket连接关闭")
            ws.close()


# 收到websocket错误的处理
def on_error(ws, error):
    print(f"[错误] WebSocket错误: {error}")


# 收到websocket关闭的处理
def on_close(ws, close_status_code, close_msg):
    print(f"[关闭] WebSocket连接已关闭 - status_code: {close_status_code}, msg: {close_msg}")


# 收到websocket连接建立的处理
def on_open(ws):
    print("[连接] WebSocket连接建立成功，开始发送音频数据...")

    def run(*args):
        frameSize = 1280  # 每一帧的音频大小
        intervel = 0.04  # 发送音频间隔(单位:s)
        status = STATUS_FIRST_FRAME  # 音频的状态信息，标识音频是第一帧，还是中间帧、最后一帧

        with open(wsParam.AudioFile, "rb") as fp:
            frame_count = 0
            while True:

                buf = fp.read(frameSize)
                audio = str(base64.b64encode(buf), 'utf-8')

                # 文件结束
                if not buf:
                    print(f"[发送] 音频文件读取完毕，发送最后一帧")
                    status = STATUS_LAST_FRAME

                # 第一帧处理
                if status == STATUS_FIRST_FRAME:
                    frame_count += 1
                    print(f"[发送] 第 {frame_count} 帧 (第一帧/握手帧)")

                    d = {"header":
                        {
                            "status": 0,
                            "app_id": wsParam.APPID
                        },
                        "parameter": {
                            "iat": wsParam.iat_params
                        },
                        "payload": {
                            "audio":
                                {
                                    "audio": audio, "sample_rate": 16000, "encoding": "raw"
                                }
                        }}
                    d = json.dumps(d)
                    ws.send(d)
                    status = STATUS_CONTINUE_FRAME
                # 中间帧处理
                elif status == STATUS_CONTINUE_FRAME:
                    frame_count += 1
                    if frame_count % 10 == 0:
                        print(f"[发送] 第 {frame_count} 帧...")

                    d = {"header": {"status": 1,
                                    "app_id": wsParam.APPID},
                         "payload": {
                             "audio":
                                 {
                                     "audio": audio, "sample_rate": 16000, "encoding": "raw"
                                 }}}
                    ws.send(json.dumps(d))
                # 最后一帧处理
                elif status == STATUS_LAST_FRAME:
                    frame_count += 1
                    print(f"[发送] 第 {frame_count} 帧 (最后一帧)")

                    d = {"header": {"status": 2,
                                    "app_id": wsParam.APPID
                                    },
                         "payload": {
                             "audio":
                                 {
                                     "audio": "", "sample_rate": 16000, "encoding": "raw"
                                 }}}
                    ws.send(json.dumps(d))
                    print(f"[发送] 音频数据发送完成，共发送 {frame_count} 帧")
                    break

                # 模拟音频采样间隔
                time.sleep(intervel)

    thread.start_new_thread(run, ())


if __name__ == "__main__":
    # 测试时候在此处正确填写相关信息即可运行
    print("\n[启动] 开始初始化WebSocket参数...")
    wsParam = Ws_Param(APPID=APPID, APISecret=APISecret,
                       APIKey=APIKey,
                       AudioFile=AudioFile)

    # 注意：WebSocket底层详细日志已禁用
    # 我们的代码中已经有详细的print输出，足够调试使用

    print(f"[启动] 生成鉴权URL...")
    wsUrl = wsParam.create_url()

    print(f"[启动] 连接地址: {wsUrl[:80]}...")
    print(f"\n[启动] 创建WebSocket连接...")
    ws = websocket.WebSocketApp(wsUrl, on_message=on_message, on_error=on_error, on_close=on_close)
    ws.on_open = on_open

    print(f"[启动] 开始运行WebSocket...")
    print("=" * 60)
    ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
