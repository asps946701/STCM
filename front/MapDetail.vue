<template>
  <div>
    <div v-if="isLoading" class="loading-div">
      <span style="fontSize : 24px"><a-icon type="loading"/>地图加载中...</span>
    </div>
    <div>
      <a-card v-if="exploreMap">
        <div class="map-container" :style="mapContainerStyle">
          <div class="maps">
            <div
              class="drags"
              @mousedown="onDragStart"
              @mousemove="onDrag"
              @mouseup="onDragEnd"
              @mousewheel="onMouseWheel"
              @DOMMouseScroll="onMouseWheel"
            >
              <div id="heatmap" v-if="layers" class="layers" :style="layersStyle">
                <MapLayer
                  ref="mapLayer"
                  v-for="layer of layers"
                  :scale="scale"
                  :key="layer.metadata.usage"
                  :map="exploreMap"
                  :layer="layer"
                  :showDevice="showDevice"
                  :showPointsOfInterest="showPointsOfInterest"
                  :showHome="showHome"
                  :showVirtualWall="showVirtualWall"
                  :showVirtualTrack="showVirtualTrack"
                />
                <svg
                  v-if="isSetRobotStartPos"
                  class="deviceLayer"
                  :style="deviceStyle"
                  @mousedown="onDeviceDragStart"
                  @mousemove="onDeviceDrag"
                  @mouseup="onDeviceDragEnd"
                  @mousedown.stop
                  @mousemove.stop
                >
                  <polygon class="device" points="0,0 25,12.5 0,25 9,12.5"/>
                  <circle
                    class="direction"
                    cx="50"
                    cy="12.5"
                    r="6.25"
                    @mousedown="onRotateStart"
                    @mousemove="onRotate"
                    @mouseup="onRotateEnd"
                    @mousedown.stop
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <OperatorLayer
          ref="operatorLayer"
          :exploreMap="exploreMap"
          :scaleLength="scaleLength"
          :needDevicePos="needDevicePos"
          :roundedMidScaleLength="roundedMidScaleLength"
          :currentMousePosX="currentX"
          :currentMousePosY="currentY"
          :needColorPanel="needColorPanel"
          :needReplayPanel="needReplayPanel"
          :replayProcess="replayProcess"
          @showDevice="handlerShowRobotPos"
          @showHome="handlerShowHome"
          @showPointsOfInterest="handlerShowPointsOfInterest"
          @showVirtualWall="handlerShowVirtualWall"
          @showVirtualTrack="handlerShowVirtualTracks"
          @toOrigin="toOrigin"
          @zoomIn="zoomIn"
          @zoomOut="zoomOut"
          @speedChange="speedChange"
          @processChange="processChange"
        />
      </a-card>
    </div>
  </div>
</template>

<script>
import { loadCompositeMap } from '@/slam/stcm'
import MapLayer from '@/components/Map/MapLayer'
import OperatorLayer from './components/OperatorLayer'
import DetailList from '@/components/DescriptionList'
import { getStcmUrl } from '@/api/stcm'
import { getSceneDevices } from '@/api/scene'
import { getShadowDevice } from '@/api/device'
import { debounce } from 'underscore'
import { setInterval, clearInterval } from 'timers'
import { deviceIsOnline } from '../../utils/util'
const DetailListItem = DetailList.Item

export default {
  name: 'MapDetail',
  components: {
    DetailList,
    DetailListItem,
    MapLayer,
    OperatorLayer
  },
  props: {
    mapHeight: {
      type: Number,
      default: 82.5
    },
    isMapdetail: {
      type: Boolean,
      default: true
    },
    isSetRobotStartPos: {
      type: Boolean,
      default: false
    },
    devicePoses: {
      type: Array,
      default: null
    },
    lidarPoses: {
      type: Array,
      default: null
    },
    lidarPose: {
      type: Object,
      default: null
    },
    locationQualities: {
      type: Array,
      default: null
    },
    deviceTrajectories: {
      type: Array,
      default: null
    },
    replayDevice: {
      type: Object,
      default: null
    },
    replayProcess: {
      type: Number,
      default: 0
    },
    needReplayPanel: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    mapHeight (val) {
      this.mapHeightProportion = val
    },

    replayDevice (val) {
      if (val !== null) {
        this.devices.body.splice(0)
        this.showDevice = true
        this.devices.body.push(val)
      }
    }
  },
  data () {
    return {
      screenHeight: 0,
      mapHeightProportion: 82.5,
      isLoading: false,
      scale: 1,
      map: null,
      exploreMap: null,
      layers: [],
      mapOffsetX: 200,
      mapOffsetY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      showInfo: false,
      showLayer: false,
      showPointsOfInterest: true,
      showHome: true,
      showVirtualWall: true,
      showVirtualTrack: true,
      showDevice: true,
      scaleLength: 100,
      roundedMidScaleLength: 1,
      device: null,
      isDeviceDragging: false,
      deviceOffsetX: 50,
      deviceOffsetY: 50,
      isRotating: false,
      angle: 0,
      rotateCenterPoint: {},
      rotateStartPoint: {},
      rotateEndPoint: {},
      timer: null,
      devices: {
        metadata: {
          type: 'vnd.slamtec.map-layer/vnd.device-map+binary',
          usage: 'device_pose',
          count: 0
        },
        body: []
      },
      homePose: {
        x: 0,
        y: 0
      },
      hasShowMaxMessage: false,
      hasShowMinMessage: false,
      needDevicePos: false,
      needColorPanel: false,
      sceneId: null,
      sceneName: null
    }
  },
  created () {
    this.mapHeightProportion = this.mapHeight
    if (this.$route.params.id && this.isMapdetail) {
      this.isLoading = true
      getStcmUrl(this.$route.params.id).then(data => {
        this.loadStcm(new Blob([data], { type: 'application/octet-stream' }))
      }).catch(() => {
        this.isLoading = false
      })
    }

    this.sceneId = this.$route.query.scene_id ? this.$route.query.scene_id : null
    this.sceneName = this.$route.query.scene_name ? this.$route.query.scene_name : null
    this.needDevicePos = this.$route.query.is_default === 'true'

    window.onresize = () => {
      if (this.isMapdetail) {
        this.screenHeight = window.innerHeight
        this.mapHeightProportion = 99.9 - (98 + 64) * 100 / this.screenHeight
      }
    }
  },
  mounted () {
    if (this.needDevicePos) {
      this.timer = setInterval(this.getRealtimePosition, 10 * 1000)
    }
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  computed: {
    mapContainerStyle () {
      return {
        height: this.mapHeightProportion + 'vh'
      }
    },

    mapSizeStyle () {
      return {
        width: this.exploreMap.dimension.width + 'px',
        height: this.exploreMap.dimension.height + 'px'
      }
    },

    layersStyle () {
      return [
        this.mapSizeStyle,
        { left: this.mapOffsetX + 'px', top: this.mapOffsetY + 'px', position: 'absolute' }
      ]
    },

    scaleDivStyle () {
      return 'height:2px;width:' + this.scaleLength + 'px;background-color:#000000;margin:2px 0'
    },

    deviceSizeStyle () {
      return {
        width: '66px',
        height: '25px'
      }
    },

    deviceStyle () {
      return [
        this.deviceSizeStyle,
        {
          left: this.deviceOffsetX + 'px',
          top: this.deviceOffsetY + 'px',
          position: 'absolute',
          'transform-origin': '9px 12.5px',
          transform: `rotate(${this.angle}deg) scale(${this.scale})`
        }
      ]
    }
  },

  methods: {
    loadStcm (path, device) {
      this.device = device
      this.isLoading = true
      loadCompositeMap(path).then(map => {
        this.initMap(map)

        this.showDevices()

        this.showDevicePoses()

        this.showLidarPoses()

        this.showLocationQualities()

        this.showDeviceTrajectories()

        if (this.device && this.device.properties && this.isSetRobotStartPos) {
          this.scale = 1
          this.deviceOffsetX = this.device.properties.start_x ? this.getScreenX(Number(this.device.properties.start_x)) : 50
          this.deviceOffsetY = this.device.properties.start_y ? this.getScreenY(Number(this.device.properties.start_y)) : 50
          this.angle = this.device.properties.start_yaw ? 360 - Number(this.device.properties.start_yaw) * 180 / Math.PI : 0
        }
        if (this.isMapdetail) {
          this.screenHeight = window.innerHeight
          this.mapHeightProportion = 99 - (98 + 64) * 100 / this.screenHeight
        }

        this.getDisplayScale(1)
      })
    },

    initMap (map) {
      this.isLoading = false
      this.map = map
      this.exploreMap = null
      this.virtual_walls = null
      const layers = [...map.sections]
      layers.sort((a, b) => {
        if (a.metadata.type === 'vnd.slamtec.map-layer/vnd.grid-map+binary' && b.metadata.type !== 'vnd.slamtec.map-layer/vnd.grid-map+binary') {
          return -1
        } else if (a.metadata.type !== 'vnd.slamtec.map-layer/vnd.grid-map+binary' && b.metadata.type === 'vnd.slamtec.map-layer/vnd.grid-map+binary') {
          return 1
        } else {
          return 0
        }
      })
      this.layers = layers
      map.sections.forEach(section => {
        switch (section.metadata.usage) {
          case 'explore':
            this.exploreMap = section.body
            this.toOrigin()
            break
        }
      })
    },

    showDevices () {
      if (this.needDevicePos) {
        this.getHomePose()
        this.getDevices()
        this.layers.push(this.devices)
      }
    },

    showDevicePoses () {
      if (this.devicePoses) {
        const section = {
          'metadata': {
            'count': this.devicePoses.length,
            'type': 'vnd.slamtec.map-layer/vnd.line-map+binary',
            'usage': 'device_tracks'
          },
          'body': this.devicePoses
        }
        this.layers.push(section)
      }
    },

    showLidarPoses () {
      if (this.lidarPoses && this.lidarPose) {
        const lidarSection = {
          'metadata': {
            'count': this.lidarPoses.length,
            'type': 'vnd.slamtec.map-layer/vnd.lidar-map+binary',
            'usage': 'lidar_pose'
          },
          'body': this.lidarPoses
        }

        this.layers.push(lidarSection)

        const devicePose = {
          pose: {
            deviceId: this.lidarPose.device_id,
            x: this.lidarPose.x,
            y: this.lidarPose.y,
            angle: 360 - Number(this.lidarPose.yaw) * 180 / Math.PI,
            visiable: true,
            isOnline: true
          }
        }
        this.showDevice = true
        this.devices.body.push(devicePose)
        this.layers.push(this.devices)
      }
    },

    showLocationQualities () {
      if (this.locationQualities) {
        const locationQualitySection = {
          'metadata': {
            'count': this.locationQualities.length,
            'type': 'vnd.slamtec.map-layer/vnd.location-map+binary',
            'usage': 'location_pose'
          },
          'body': this.locationQualities
        }
        this.needColorPanel = true
        this.layers.push(locationQualitySection)
      }
    },

    showDeviceTrajectories () {
      if (this.deviceTrajectories) {
        const deviceTrajectorySection = {
          'metadata': {
            'count': this.deviceTrajectories.length,
            'type': 'vnd.slamtec.map-layer/vnd.line-map+binary',
            'usage': 'device_trajectory'
          },
          'body': this.deviceTrajectories
        }
        this.layers.push(deviceTrajectorySection)
        this.layers.push(this.devices)
      }
    },

    onDragStart (event) {
      if (this.isRotating) {
        return
      }

      this.isDragging = true
    },

    onDrag (event) {
      if (this.isRotating) {
        this.getAngle(event)
        return
      }

      if (this.isDeviceDragging) {
        this.deviceOffsetX += event.movementX
        this.deviceOffsetY += event.movementY
        return
      }

      this.currentX = event.layerX
      this.currentY = event.layerY
      if (!this.isDragging) {
        return
      }

      this.mapOffsetX += event.movementX
      this.mapOffsetY += event.movementY
    },

    onDragEnd () {
      if (this.isRotating) {
        this.isRotating = false
        return
      }

      if (this.isDeviceDragging) {
        this.isDeviceDragging = false
        this.onSelectedPostion()
        return
      }

      this.isDragging = false
    },

    onSelectedPostion () {
      const position = {
        x: this.getMapX(this.deviceOffsetX / this.scale),
        y: this.getMapY(this.deviceOffsetY / this.scale),
        angle: this.angle
      }
      this.$emit('selectedPostion', position)
    },

    onMouseWheel (event) {
      if (event.detail > 0 || event.deltaY > 0) {
        debounce(this.zoomOut(), 300)
      } else {
        debounce(this.zoomIn(), 300)
      }
    },

    handlerShowinfo () {
      this.showInfo = !this.showInfo
    },

    handlerShowLayer () {
      this.showLayer = !this.showLayer
    },

    handlerShowRobotPos () {
      this.showDevice = !this.showDevice
    },

    handlerShowHome () {
      this.showHome = !this.showHome
    },

    handlerShowPointsOfInterest () {
      this.showPointsOfInterest = !this.showPointsOfInterest
    },

    handlerShowVirtualWall () {
      this.showVirtualWall = !this.showVirtualWall
    },

    handlerShowVirtualTracks () {
      this.showVirtualTrack = !this.showVirtualTrack
    },

    gotoScene () {
      this.$router.push('/scenes/detail/' + this.sceneId)
    },

    toOrigin () {
      this.mapOffsetX = (window.innerWidth - this.exploreMap.dimension.width * this.scale - 260) / 2
      this.mapOffsetY = (window.innerHeight - this.exploreMap.dimension.height * this.scale - 162) / 2
    },

    zoomIn () {
      if (this.scale <= 20) {
        this.deviceOffsetX /= this.scale
        this.deviceOffsetY /= this.scale
        this.scale += 0.5
        this.deviceOffsetX *= this.scale
        this.deviceOffsetY *= this.scale
        this.getDisplayScale(this.scale)
        return
      }
      if (!this.hasShowMaxMessage) {
        this.hasShowMaxMessage = true
        this.$message.info('已放大至最大').then(() => {
          this.hasShowMaxMessage = false
        })
      }
    },

    zoomOut () {
      if (this.scale > 1) {
        this.deviceOffsetX /= this.scale
        this.deviceOffsetY /= this.scale
        this.scale -= 0.5
        this.deviceOffsetX *= this.scale
        this.deviceOffsetY *= this.scale
        this.getDisplayScale(this.scale)
        return
      }
      if (!this.hasShowMinMessage) {
        this.hasShowMinMessage = true
        this.$message.info('已缩小至最小').then(() => {
          this.hasShowMinMessage = false
        })
      }
    },

    getDisplayScale (scale) {
      const resolution = 0.05 // 地图的分辨率（表示原始地图1个像素代表5cm）
      const scaleMinLength = 50
      const scaleMaxLength = 100
      const midScaleLength = (scaleMinLength + scaleMaxLength) / 2 * resolution / scale
      this.roundedMidScaleLength = 1
      if (midScaleLength >= 1) {
        this.roundedMidScaleLength = Math.floor(midScaleLength)
      } else if (midScaleLength >= 0.1) {
        this.roundedMidScaleLength = Math.floor(midScaleLength * 10) / 10
      } else if (midScaleLength >= 0.01) {
        this.roundedMidScaleLength = Math.floor(midScaleLength * 100) / 100
      } else {
        this.roundedMidScaleLength = midScaleLength
      }

      const actualLength = this.roundedMidScaleLength / resolution * scale
      this.scaleLength = actualLength - 2
    },

    onDeviceDragStart (event) {
      this.isDeviceDragging = true
    },

    onDeviceDrag (event) {
      if (this.isRotating) {
        this.getAngle(event)
        return
      }

      if (!this.isDeviceDragging) {
        return
      }

      this.deviceOffsetX += event.movementX
      this.deviceOffsetY += event.movementY
    },

    onDeviceDragEnd (event) {
      this.isDeviceDragging = false
      this.onSelectedPostion()
    },

    onRotateStart (event) {
      this.rotateStartPoint.X = event.clientX
      this.rotateStartPoint.Y = event.clientY
      if (this.angle === 0 || this.angle === 360) {
        this.rotateCenterPoint.X = event.clientX - 41 * this.scale
        this.rotateCenterPoint.Y = event.clientY
      }
      if (this.angle > 0 && this.angle < 90) {
        const x = 41 * this.scale * Math.cos(this.angle * Math.PI / 180)
        const y = 41 * this.scale * Math.sin(this.angle * Math.PI / 180)
        this.rotateCenterPoint.X = event.clientX - x
        this.rotateCenterPoint.Y = event.clientY - y
      }
      if (this.angle === 90) {
        this.rotateCenterPoint.X = event.clientX
        this.rotateCenterPoint.Y = event.clientY + 41 * this.scale
      }
      if (this.angle > 90 && this.angle < 180) {
        const x = 41 * this.scale * Math.sin((this.angle - 90) * Math.PI / 180)
        const y = 41 * this.scale * Math.cos((this.angle - 90) * Math.PI / 180)
        this.rotateCenterPoint.X = event.clientX + x
        this.rotateCenterPoint.Y = event.clientY - y
      }
      if (this.angle === 180) {
        this.rotateCenterPoint.X = event.clientX + 41 * this.scale
        this.rotateCenterPoint.Y = event.clientY
      }
      if (this.angle > 180 && this.angle < 270) {
        const x = 41 * this.scale * Math.cos((this.angle - 180) * Math.PI / 180)
        const y = 41 * this.scale * Math.sin((this.angle - 180) * Math.PI / 180)
        this.rotateCenterPoint.X = event.clientX + x
        this.rotateCenterPoint.Y = event.clientY + y
      }
      if (this.angle === 270) {
        this.rotateCenterPoint.X = event.clientX
        this.rotateCenterPoint.Y = event.clientY - 41 * this.scale
      }
      if (this.angle > 270 && this.angle < 360) {
        const x = 41 * this.scale * Math.sin((this.angle - 270) * Math.PI / 180)
        const y = 41 * this.scale * Math.cos((this.angle - 270) * Math.PI / 180)
        this.rotateCenterPoint.X = event.clientX - x
        this.rotateCenterPoint.Y = event.clientY + y
      }
      this.isRotating = true
    },

    onRotate (event) {
      if (!this.isRotating) {
        return
      }
      this.getAngle(event)
    },

    onRotateEnd (event) {
      this.isRotating = false
      this.onSelectedPostion()
    },

    getAngle (event) {
      this.rotateEndPoint.X = event.clientX
      this.rotateEndPoint.Y = event.clientY
      this.getCurrentAngle()
      this.rotateStartPoint.X = this.rotateEndPoint.X
      this.rotateStartPoint.Y = this.rotateEndPoint.Y
    },

    getDirection (startPosition, endPosition, centerPosition) {
      return (endPosition.X - startPosition.X) * (centerPosition.Y - startPosition.Y) - (endPosition.Y - startPosition.Y) * (centerPosition.X - startPosition.X) > 0
    },

    getCurrentAngle () {
      const lengthAB = Math.sqrt(Math.pow(this.rotateCenterPoint.X - this.rotateStartPoint.X, 2) + Math.pow(this.rotateCenterPoint.Y - this.rotateStartPoint.Y, 2))
      const lengthAC = Math.sqrt(Math.pow(this.rotateCenterPoint.X - this.rotateEndPoint.X, 2) + Math.pow(this.rotateCenterPoint.Y - this.rotateEndPoint.Y, 2))
      const lengthBC = Math.sqrt(Math.pow(this.rotateStartPoint.X - this.rotateEndPoint.X, 2) + Math.pow(this.rotateStartPoint.Y - this.rotateEndPoint.Y, 2))
      const cosA = (Math.pow(lengthAB, 2) + Math.pow(lengthAC, 2) - Math.pow(lengthBC, 2)) / (2 * lengthAB * lengthAC)
      const angleA = Math.round(Math.acos(cosA) * 180 / Math.PI)

      const direction = this.getDirection(this.rotateStartPoint, this.rotateEndPoint, this.rotateCenterPoint)
      if (direction) {
        this.angle += angleA
        if (this.angle > 360) {
          this.angle = 360 - this.angle
        }
      } else {
        this.angle -= angleA
        if (this.angle < 0) {
          this.angle = 360 + this.angle
        }
      }
    },

    getScreenX (x) {
      return (x - this.exploreMap.origin.x) / this.exploreMap.resolution.x
    },

    getScreenY (y) {
      return this.exploreMap.dimension.height - 1 - (y - this.exploreMap.origin.y) / this.exploreMap.resolution.y
    },

    getMapX (x) {
      return x * this.exploreMap.resolution.x + this.exploreMap.origin.x
    },

    getMapY (y) {
      return (this.exploreMap.dimension.height - 1 - y) * this.exploreMap.resolution.y + this.exploreMap.origin.y
    },

    getHomePose () {
      this.layers.forEach(layer => {
        if (layer.metadata.usage === 'home_dock_pose' && layer.body.length > 0) {
          this.homePose = layer.body[0].pose
        }
      })
    },

    getDevices () {
      const query = {
        'num': 0,
        'size': 1000
      }
      getSceneDevices(this.sceneId, query).then(result => {
        const devices = result.content
        this.devices.metadata.count = devices.length
        devices.forEach(device => {
          const devicePose = {
            pose: {
              deviceId: device.device_id,
              x: this.homePose.x,
              y: this.homePose.y,
              angle: 360 - Number(this.homePose.yaw) * 180 / Math.PI,
              visiable: false,
              isOnline: false
            }
          }
          this.updatePosition(devicePose)
          this.devices.body.push(devicePose)
        })
      })
    },

    getRealtimePosition () {
      this.devices.body.forEach(devicePose => {
        this.updatePosition(devicePose)
      })
    },

    updatePosition (devicePose) {
      getShadowDevice(devicePose.pose.deviceId).then(shadow => {
        if (shadow.data && shadow.data.robot_pose) {
          const robotPose = JSON.parse(shadow.data.robot_pose)
          devicePose.pose.x = robotPose.x
          devicePose.pose.y = robotPose.y
          devicePose.pose.angle = 360 - Number(robotPose.yaw) * 180 / Math.PI
          devicePose.pose.visiable = true
          devicePose.pose.isOnline = shadow ? deviceIsOnline(shadow.last_updated) : false
        }
      }).catch(() => {
        devicePose.pose.visiable = false
      })
    },

    speedChange (value) {
      this.$emit('speedChange', value)
    },

    processChange (value) {
      this.$emit('processChange', value)
    }
  }
}
</script>

<style scoped>
.loading-div {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
}

.map-container {
  width: 120%;
  height: 82.7vh;
  position: relative;
  overflow-x: hidden;
  background-color: rgb(128, 128, 128);
  cursor: move;
  margin: -24px -32px;
}

.map-container .layers > * {
  position: absolute;
  left: 0;
  top: 0;
}

.polygon {
  position: absolute;
  margin: 3px 0;
  background: #FFFFFF;
  border-left: 15px solid #18B891;
  border-top: 7px solid transparent;
  border-right: 0px solid #18B891;
  border-bottom: 7px solid transparent;
  box-sizing: border-box;
}

.device {
  fill: #18B891;
  stroke: #18B891;
  stroke-width: 1
}

.direction {
  fill: #2733C8;
  stroke: #2733C8;
  stroke-width: 1
}
</style>
