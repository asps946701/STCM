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
      <circle
        :cx="getScreenX(pose.pose.x)"
        :cy="getScreenY(pose.pose.y)"
        :r="4"
        :style="poseStyle"
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
  name: 'PoseLayer',
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
    poseStyle: {
      type: String,
      required: false,
      default: 'fill:rgb(0,200,0);stroke-width:4;stroke:rgba(0,200,0,0.5);transform: scale(1, 1)'
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
