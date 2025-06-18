module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      targets: { esmodules: true }
    }]
  ],
  plugins: [
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-runtime', {
      helpers: false,
      regenerator: true
    }]
  ]
};
