module.exports = {
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      rules: {
        'no-unused-vars': 'off',
        'no-undef': 'off',
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ],
  extends: [
    'plugin:vue/vue3-recommended',
    'love'
  ],
  parserOptions: {
    project: 'tsconfig.json',
    extraFileExtensions: ['.vue']
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'vue/max-attributes-per-line': ['warn', { singleline: 5 }],
    'vue/multi-word-component-names': 'off'
  }
}
