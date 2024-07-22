<template>
  <component
    :map="map"
    :scale="scale"
    :layer="layer"
    :lineStyle="lineStyle"
    :poseStyle="poseStyle"
    :rectStyle="rectStyle"
    :mapStyle="mapStyle"
    :is="currentComponent"
    v-if="currentComponent && map && layer"
  />
</template>

<script>
import ExploreMapLayer from './ExploreMapLayer'
import LineLayer from './LineLayer'
import PoseLayer from './PoseLayer'
import RectLayer from './RectLayer'
import DeviceLayer from './DeviceLayer'
import PointLayer from './PointLayer'

export default {
  name: 'MapLayer',
  components: {
    ExploreMapLayer,
    LineLayer,
    PoseLayer,
    RectLayer,
    DeviceLayer,
    PointLayer
  },
  data () {
    return {
      mapLeft: 0,
      mapTop: 0
    }
  },
  props: {
    scale: {
      type: Number,
      required: false,
      default: 1
    },
    map: {
      type: Object,
      required: false,
      default: null
    },
    layer: {
      type: Object,
      required: false,
      default: null
    },
    showDevice: {
      type: Boolean,
      required: false,
      default: true
    },
    showPointsOfInterest: {
      type: Boolean,
      required: false,
      default: true
    },
    showHome: {
      type: Boolean,
      required: false,
      default: true
    },
    showVirtualWall: {
      type: Boolean,
      required: false,
      default: true
    },
    showVirtualTrack: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  watch: {
    scale: {
      handler (newScale, oldScale) {
        if (newScale > oldScale) {
          this.mapLeft = this.map.dimension.width * (newScale - 1) / 2
          this.mapTop = this.map.dimension.height * (newScale - 1) / 2
        } else {
          this.mapLeft = this.map.dimension.width * (newScale - 1) / 2
          this.mapTop = this.map.dimension.height * (newScale - 1) / 2
        }
      }
    }
  },
  computed: {
    lines () {
      if (this.layer && this.layer.metadata.type === 'vnd.slamtec.map-layer/vnd.line-map+binary') {
        return this.layer.body
      } else {
        return null
      }
    },

    lineStyle () {
      if (this.layer && this.layer.metadata.usage === 'virtual_tracks') {
        return `stroke:rgba(0,255,0,1); storke-width: 2;transform: scale(${this.scale}, ${this.scale})`
      } else if (this.layer && this.layer.metadata.usage === 'device_tracks') {
        return `stroke:rgba(0,0,255,1); storke-width: 2;transform: scale(${this.scale}, ${this.scale})`
      } else if (this.layer && this.layer.metadata.usage === 'device_trajectory') {
        return `stroke:rgba(127 255 0); storke-width: 2;transform: scale(${this.scale}, ${this.scale})`
      } else {
        return `stroke:rgba(245,86,86,1); storke-width: 2;transform: scale(${this.scale}, ${this.scale})`
      }
    },

    poseStyle () {
      if (this.layer && this.layer.metadata.usage === 'home_dock_pose') {
        return `fill:rgb(255,95,95);stroke-width:4;stroke:rgba(255,95,95,0.5);transform: scale(${this.scale}, ${this.scale})`
      } else {
        return `fill:rgb(186,52,63);stroke-width:4;stroke:rgba(186,52,63,0.1);transform: scale(${this.scale}, ${this.scale})`
      }
    },

    rectStyle () {
      if (this.layer && this.layer.metadata.usage === 'lidar_pose') {
        return `fill:rgb(255,95,95);stroke-width:0.1;stroke:rgba(255,95,95,0.1);fill-opacity:0.7;stroke-opacity:0.7;transform: scale(${this.scale}, ${this.scale})`
      } else {
        return `fill:rgb(186,52,63);stroke-width:4;stroke:rgba(186,52,63,0.1);transform: scale(${this.scale}, ${this.scale})`
      }
    },

    pointStyle () {
      if (this.layer && this.layer.metadata.usage === 'location_pose') {
        return `fill:rgb(255,95,95);stroke-width:0.1;stroke:rgba(255,95,95,0.1);fill-opacity:0.7;stroke-opacity:0.7;transform: scale(${this.scale}, ${this.scale})`
      } else {
        return `fill:rgb(186,52,63);stroke-width:4;stroke:rgba(186,52,63,0.1);transform: scale(${this.scale}, ${this.scale})`
      }
    },

    mapStyle () {
      return `left: ${this.mapLeft}px; top: ${this.mapTop}px; transform: scale(${this.scale}, ${this.scale})`
    },

    currentComponent () {
      if (!this.layer) {
        return null
      }

      switch (this.layer.metadata.type) {
        case 'vnd.slamtec.map-layer/vnd.grid-map+binary':
          return 'ExploreMapLayer'
        case 'vnd.slamtec.map-layer/vnd.line-map+binary':
          if (this.layer.metadata.usage === 'virtual_tracks') {
            return this.showVirtualTrack ? 'LineLayer' : null
          } else if (this.layer.metadata.usage === 'device_tracks') {
            return 'LineLayer'
          } else if (this.layer.metadata.usage === 'device_trajectory') {
            return 'LineLayer'
          } else {
            return this.showVirtualWall ? 'LineLayer' : null
          }
        case 'vnd.slamtec.map-layer/vnd.pose-map+binary':
          if (this.layer.metadata.usage === 'home_dock_pose') {
            return this.showHome ? 'PoseLayer' : null
          } else {
            return this.showPointsOfInterest ? 'PoseLayer' : null
          }
        case 'vnd.slamtec.map-layer/vnd.lidar-map+binary':
          if (this.layer.metadata.usage === 'lidar_pose') {
            return 'RectLayer'
          } else {
            return null
          }
        case 'vnd.slamtec.map-layer/vnd.location-map+binary':
          if (this.layer.metadata.usage === 'location_pose') {
            return 'PointLayer'
          } else {
            return null
          }
        case 'vnd.slamtec.map-layer/vnd.device-map+binary':
          return this.showDevice ? 'DeviceLayer' : null
        default:
          return null
      }
    }
  }
}
</script>
