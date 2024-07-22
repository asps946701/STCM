<template>
  <svg
    :draggable="false"
    v-if="map && devices"
    pointer-events="visible"
    :width="map.dimension.width * scale"
    :height="map.dimension.height * scale"
  >
    <a-tooltip
      v-for="device of devices"
      :key="device.name"
      :title="device.name"
    >
      <polygon v-if="device.pose && device.pose.visiable" :style="deviceStyle(device.pose)" points="0,0 25,12.5 0,25 9,12.5"/>
      <!-- <svg v-if="device.pose && device.pose.visiable">
      </svg> -->
    </a-tooltip>
  </svg>
</template>

<style>
svg circle {
  cursor: pointer;
}
</style>

<script>
export default {
  name: 'DeviceLayer',
  components: {},
  props: {
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
    scale: {
      type: Number,
      required: false,
      default: 1
    }
  },
  computed: {
    devices () {
      return this.layer.body
    },

    deviceStyle: function () {
      return function (pose) {
        return {
          width: '25px',
          height: '25px',
          fill: pose.isOnline ? '#18B891' : 'gray',
          stroke: pose.isOnline ? '#18B891' : '#18B891',
          'stroke-width': '1',
          position: 'absolute',
          'transform-origin': `${this.getScreenX(pose.x) * this.scale}px ${this.getScreenY(pose.y) * this.scale}px`,
          transform: `rotate(${pose.angle}deg) scale(${this.scale}) translateX(${this.getScreenX(pose.x) * this.scale - 12.5}px) translateY(${this.getScreenY(pose.y) * this.scale - 12.5}px)`
        }
      }
    }
  },
  methods: {
    getScreenX (x) {
      return (x - this.map.origin.x) / this.map.resolution.x
    },

    getScreenY (y) {
      return this.map.dimension.height - 1 - (y - this.map.origin.y) / this.map.resolution.y
    }
  }
}
</script>
