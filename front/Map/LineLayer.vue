<template>
  <svg
    :draggable="false"
    v-if="map && lines"
    :width="map.dimension.width * scale"
    :height="map.dimension.height * scale"
    pointer-events="visible"
  >
    <line
      :x1="getScreenX(line.start.x)"
      :y1="getScreenY(line.start.y)"
      :x2="getScreenX(line.end.x)"
      :y2="getScreenY(line.end.y)"
      :style="lineStyle"
      v-for="line of lines"
      :key="line.name"
    />
  </svg>
</template>

<script>
export default {
  name: 'ExploreMapLayer',
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
    lineStyle: {
      type: String,
      required: false,
      default: 'stroke:rgba(255,0,0,0.5); storke-width: 2;transform: scale(1, 1)'
    },
    scale: {
      type: Number,
      required: false,
      default: 1
    }
  },
  computed: {
    lines () {
      return this.layer.body
    }
  },
  methods: {
    getScreenPoint (point) {
      return {
        x: this.getScreenX(point.x),
        y: this.getScreenY(point.y)
      }
    },

    getScreenX (x) {
      return Math.round((x - this.map.origin.x) / this.map.resolution.x)
    },

    getScreenY (y) {
      return Math.round(this.map.dimension.height - 1 - (y - this.map.origin.y) / this.map.resolution.y)
    }
  }
}
</script>
