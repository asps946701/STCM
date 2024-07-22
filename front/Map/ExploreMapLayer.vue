<template>
  <canvas
    ref="canvas"
    :draggable="false"
    :width="map.dimension.width"
    :height="map.dimension.height"
    :style="mapStyle"
    v-if="map"
  />
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
    scale: {
      type: Number,
      required: false,
      default: 1
    },
    mapStyle: {
      type: String,
      required: false,
      default: 'transform: scale(1, 1)'
    }
  },
  watch: {
    map (val) {
      this.renderMap(val)
    },

    scale: {
      handler (newScale, oldScale) {
        this.scaleMap(newScale, oldScale)
      }
    }
  },
  data () {
    return {
      imageData: null
    }
  },
  created () {
    this.renderMap(this.map)
  },
  methods: {
    renderMap (map) {
      setTimeout(() => {
        const context = this.$refs.canvas.getContext('2d')

        const w = map.dimension.width
        const h = map.dimension.height

        this.imageData = context.createImageData(w, h)

        var pxOffset = 0
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++, pxOffset += 4) {
            const rawData = 128 + map.data[(h - y - 1) * w + x]
            this.imageData.data[pxOffset] = rawData
            this.imageData.data[pxOffset + 1] = rawData
            this.imageData.data[pxOffset + 2] = rawData
            this.imageData.data[pxOffset + 3] = 255
          }
        }

        context.putImageData(this.imageData, 0, 0)
      })
    },

    scaleMap (newScale, oldScale) {
      this.renderMap(this.map)
    }
  }
}
</script>
