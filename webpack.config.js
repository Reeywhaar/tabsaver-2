const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const SvgMakerPlugin = require('@reeywhaar/svgmaker/webpack-plugin')

// Handle docker's SIGINT
process.on('SIGINT', () => {
  console.warn('\nGot "SIGINT", exiting...')
  process.exit(0)
})

module.exports = (_h, args) => {
  const isProduction = args.mode === 'production'

  return [
    {
      entry: {
        panel: './src/panel.tsx',
        options: './src/options.tsx',
        background: './src/background.ts',
        handler: './src/handler.ts',
        diagnostics: './src/diagnostics.tsx',
      },
      output: {
        path: path.resolve(__dirname, 'ext/dist'),
        filename: '[name].js',
        publicPath: '/dist/',
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
          },
          {
            test: /\.s?css$/,
            use: [
              {
                loader: 'style-loader',
              },
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 2,
                  sourceMap: !isProduction,
                  // of all settings I wanted only to define localIdentName
                  // all others are default
                  modules: {
                    mode: 'local',
                    auto: true,
                    exportGlobals: false,
                    localIdentName: isProduction ? '[hash:base64]' : '[name]__[local]--[hash:base64:5]',
                    localIdentContext: path.resolve(__dirname, 'src'),
                    localIdentHashSalt: 'sdnjkje33mwnnbudkc883jn',
                    namedExport: false,
                    exportLocalsConvention: 'asIs',
                    exportOnlyLocals: false,
                  },
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: !isProduction,
                },
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: !isProduction,
                  sassOptions: {
                    silenceDeprecations: ['legacy-js-api'],
                  },
                },
              },
            ],
          },
        ],
      },
      stats: 'minimal',
      plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        // new webpack.IgnorePlugin({ resourceRegExp: /\.woff/i }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(args.mode ?? 'production'),
          'process.env.ENABLE_DIAGNOSTICS': process.env.ENABLE_DIAGNOSTICS === 'true' ? 'true' : undefined,
          __VUE_OPTIONS_API__: true,
          __VUE_PROD_DEVTOOLS__: false,
        }),
        ...[
          {
            name: 'panel',
            chunks: ['panel'],
          },
          {
            name: 'sidebar',
            chunks: ['panel'],
          },
          {
            name: 'options',
            chunks: ['options'],
          },
          {
            name: 'background',
            chunks: ['background'],
          },
          {
            name: 'handler',
            chunks: ['handler'],
          },
          {
            name: 'diagnostics',
            chunks: ['diagnostics'],
          },
        ].map(item => {
          return new HtmlWebpackPlugin({
            chunks: item.chunks,
            filename: `${item.name}.html`,
            title: `TabSaver ${item.name}`,
            template: `html_templates/${item.name}.html`,
          })
        }),
        ...['./icon.svg.js', './icon-light.svg.js'].map(file => new SvgMakerPlugin({ file, output: '../icons' })),
      ],
      optimization: {
        minimize: args.mode !== 'development',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
        },
      },
      devtool: args.mode === 'development' ? 'cheap-module-source-map' : false,
      resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.css', '.scss'],
        alias: {
          '@app': path.resolve(__dirname, 'src'),
        },
      },
    },
  ]
}
