module.exports = {
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: [/node_modules/, /examples/],
          use: [{
            loader: 'ts-loader',
          }],
        },
      ],
    },
  }