stcm文件解析入口stcm.js->loadCompositeMap(localfile or net url)
1, 通过jbinary来解析文件流
2, 再解析成json格式数据
3, 地图的数据存放在key为sections的列表中
4,主要包含5个图层：
	地图位图数据层
	type: "vnd.slamtec.map-layer/vnd.grid-map+binary"
	usage: "explore"
	虚拟墙
	type: "vnd.slamtec.map-layer/vnd.line-map+binary"
	usage: "virtual_walls"
	虚拟轨道
	type: "vnd.slamtec.map-layer/vnd.line-map+binary"
	usage: "virtual_tracks"
	充电桩位置
	type: "vnd.slamtec.map-layer/vnd.pose-map+binary"
	usage: "home_dock_pose"
	兴趣点位置
	type: "vnd.slamtec.map-layer/vnd.pose-map+binary"
	usage: "point_of_interest"
5,前端再将这些图层映射倒对应的html标签中：
	基础地图用canvas中的位图 （front/Map/ExploreMapLayer.vue）
	其它特征(front/Map/MapLayer.vue）
	虚拟墙和虚拟轨道用svg画线 （front/Map/LineLayer.vue）
	充电桩和兴趣点用svg画点 （front/Map/PointLayer.vue）