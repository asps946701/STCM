<template>
  <svg
    :draggable="false"
    v-if="map && poses"
    :width="map.dimension.width * scale"
    :height="map.dimension.height * scale"
    pointer-events="visible"
  >
    <a-tooltip
      v-for="pose of poses"
      :key="pose.name"
      :title="pose.metadata.display_name || pose.name"
    >
      <rect
        :x="getScreenX(pose.pose.x)-1.4"
        :y="getScreenY(pose.pose.y)-1.4"
        width="2.8"
        height="2.8"
        :style="rectStyle"
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
  name: 'RectLayer',
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
    rectStyle: {
      type: String,
      required: false,
      default: 'fill:rgb(255,95,95);stroke:rgba(255,95,95,0.5);stroke-width:1;transform: scale(1, 1);fill-opacity:0.7;stroke-opacity:0.7'
    },
    scale: {
      type: Number,
      required: false,
      default: 1
    }
  },
  computed: {
    poses () {
      return this.layer.body
    }
  },
  methods: {
    getScreenX (x) {
      return Math.round((x - this.map.origin.x) / this.map.resolution.x)
    },

    getScreenY (y) {
      return Math.round(this.map.dimension.height - 1 - (y - this.map.origin.y) / this.map.resolution.y)
    }
  }
}
</script>
