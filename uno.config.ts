import { defineConfig } from 'unocss'
import presetWind from '@unocss/preset-wind'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  theme: {
    colors: {
      'swe-blue': '#006aa7',
      'swe-yellow': '#fecc00'
    }
  },
  presets: [
    presetWind()
  ],
  transformers: [
    transformerDirectives()
  ]
})
