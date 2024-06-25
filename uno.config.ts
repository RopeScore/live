import { defineConfig } from 'unocss'
import presetWind from '@unocss/preset-wind'
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
    presetWind()
  ],
  transformers: [
    transformerDirectives()
  ]
})
