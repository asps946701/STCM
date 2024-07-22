<template>
  <svg
    :draggable="false"
    v-if="map && points"
    :width="map.dimension.width * scale"
    :height="map.dimension.height * scale"
    pointer-events="visible"
  >
    <a-tooltip
      v-for="point of points"
      :key="point.name"
      :title="point.metadata.display_name || point.name"
    >
      <circle
        :cx="getScreenX(point.pose.x)"
        :cy="getScreenY(point.pose.y)"
        :r="3"
        :style="getStyle(point.quality)"
      />
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
  name: 'PointLayer',
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
    points () {
      return this.layer.body
    }
  },
  methods: {
    getStyle (quality) {
      const color = this.perc2color(quality)
      return `fill:${color};stroke-width:4;stroke:${color};stroke-opacity:0.5;transform: scale(${this.scale}, ${this.scale})`
    },

    getScreenX (x) {
      return (x - this.map.origin.x) / this.map.resolution.x
    },

    getScreenY (y) {
      return this.map.dimension.height - 1 - (y - this.map.origin.y) / this.map.resolution.y
    },

    quality2color (perc, min, max) {
      var base = (max - min)

      if (base === 0) {
        perc = 100
      } else {
        perc = (perc - min) / base * 100
      }
      var r = 0
      var g = 0
      var b = 0
      if (perc < 50) {
        r = 255
        g = Math.round(5.1 * perc)
      } else {
        g = 255
        r = Math.round(510 - 5.10 * perc)
      }
      const h = r * 0x10000 + g * 0x100 + b * 0x1
      return '#' + ('000000' + h.toString(16)).slice(-6)
    },

    perc2color (perc) {
      var r = 0
      var g = 0
      var b = 0
      if (perc < 50) {
        r = 255
        g = Math.round(5.1 * perc)
      } else {
        g = 255
        r = Math.round(510 - 5.10 * perc)
      }
      var h = r * 0x10000 + g * 0x100 + b * 0x1
      return '#' + ('000000' + h.toString(16)).slice(-6)
    }
  }
}
</script>
