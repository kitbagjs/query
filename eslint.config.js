import config from '@kitbag/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      '@stylistic/no-confusing-arrow': ['off'],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-invalid-void-type': ['off'],
      '@typescript-eslint/no-non-null-assertion': ['off'],
      '@typescript-eslint/no-unsafe-function-type': ['off'],
      '@typescript-eslint/only-throw-error': ['off'],
    },
  },
]
