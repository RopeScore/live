import { defineConfig } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  theme: {
    colors: {
      'svgf-blue': '#006aa7',
      'svgf-yellow': '#fecc00'
    },
    fontFamily: {
      svgf: 'Tahoma,Verdana,Segoe,sans-serif'
    }
  },
  presets: [
    presetWind3()
  ],
  transformers: [
    transformerDirectives()
  ]
})
