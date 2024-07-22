#!/usr/bin/python
# -*- coding:utf-8 -*-
from requests import request
import sys
import urllib
import struct
import os
from PIL import Image

url = "http://{ip}:1448/api/core/slam/v1/maps/explore"
headers = {'Content-Type': 'application/octet-stream'}

try:
   rq = request(method = "GET",url = url.format(ip = sys.argv[1]),headers = headers,timeout=30)
except Exception as e:
        print(e.__str__())
if (rq.status_code not in [200,204,203,201]):
        print("request {0} status code is not right".format(url))
else:
   
    print("接口调用成功" )
 
print("~~~~~~~~~~~~~~~~将获取的explore data 保存到本地~~~~~~~~~~~~~~~~~~~~~~")
urllib.request.urlretrieve(url.format(ip = sys.argv[1]),"./map/map.bin")
file = open("./map/map.bin","rb")
size = os.path.getsize("./map/map.bin") #获得文件大小

map_info = file.read(36) #前36字节为当前地图的一些基本信息（地图的起始位置，x轴方向的栅格数量，y轴方向的栅格数量， 地图分辨率及地图大小）

map_x = struct.unpack('f', map_info[0:4])
map_y = struct.unpack('f', map_info[4:8])
map_width = struct.unpack('I', map_info[8:12])
map_heigh = struct.unpack('I', map_info[12:16])
map_resolution = struct.unpack('f', map_info[16:20])
map_cell_size = struct.unpack('I', map_info[32:36])

print("地图起始位置坐标为:(" ,map_x[0], map_y[0],")" )
print("X轴方向栅格数量为:",map_width[0] )
print("y轴方向栅格数量为：",map_heigh[0] )
print("地图分辨率为：", map_resolution[0])
print("地图大小为:",map_cell_size[0])

map_data = file.read(map_cell_size[0])
im = Image.frombytes('L', size=[map_width[0], map_heigh[0]], data=map_data)#灰度图
im.save('./map/map.png')
file.close()