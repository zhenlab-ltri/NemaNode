module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      impliedScrict: true
    }
  },
  rules: {
    // Potential errors.
    'semi': 'error',
    'curly': 'error',
    'no-else-return': 'error',
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-labels': 'error',
    'no-console': 'error',
    'no-var': 'error',
    'no-warning-comments': 'warn',
    'max-depth': [
      'error', 
      5
    ],
    'no-mixed-operators': [
      'error',
      {'groups': [['&&', '||']]}
    ],
    'no-unneeded-ternary': 'error',
    'no-prototype-builtins': 'off', // Allow using hasOwnProperty.
    'max-len': [
      'warn', 
      100
    ],
    // Styling.
    'yoda': 'error',
    'no-multi-spaces': 'error',
    'camelcase': 'warn',
    'quotes': [
      'error',
      'single'
    ],
    'brace-style': [
      'error', 
      '1tbs',
      {'allowSingleLine': true}
    ],
    'func-names': [
      'error', 
      'never'
    ],
    'indent': [
      'error',
      2,
      {'SwitchCase': 1}
    ],
    'operator-assignment': 'error',
    'no-tabs': 'error',
    'comma-spacing': 'error',
    'block-spacing': 'error',
    'space-before-blocks': 'error',
    'func-call-spacing': 'error',
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'no-whitespace-before-property': 'error',
    'space-infix-ops': 'error',
    'semi-spacing': 'error',
    'space-unary-ops': 'error',
    'space-before-function-paren': ['error', {
      'anonymous': 'never',
      'named': 'never',
      'asyncArrow': 'always',
    }],
    'computed-property-spacing': 'error',
    'space-in-parens': 'error',
    /*'array-bracket-spacing': [
      'error', 
      'never'
    ],
    'object-curly-spacing': 'error',*/
    
  }
};
