const path = require('path');
const fs = require('fs-extra');
const ini = require('ini');
const webpack = require('webpack');
const sass = require('node-sass');
const PostCompilePlugin = require('post-compile-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

const SRC_DIR = 'src/client';
const ASSET_PATHS = [
  'style/',
  'image/'
];
const DIST_DIR = 'dist';
const SASS_INPUT_FILE = 'src/client/scss/main.scss';
const SASS_OUTPUT_FILE = 'dist/style/bundle.css';

const license = fs.readFileSync('LICENSE', 'utf-8');



module.exports = (env, argv) => {
  let googleAnalyticsCode = '';
  if (argv.mode == 'production') {
    const { google_analytics_id } = ini.parse(
      fs.readFileSync(path.join(__dirname, 'config.ini'), 'utf-8')
    ).google_analytics;
    googleAnalyticsCode = `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${google_analytics_id}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${google_analytics_id}');
    </script>`
  }

  return {
    entry: './src/client/js/init.js',
    devtool: 'inline-source-map',
    output: {
      path: path.resolve(__dirname, DIST_DIR),
      filename: '[name].[contenthash].js'
    },
    resolve: {
      alias:{
        'three/OrbitControls': path.join(__dirname, 'node_modules/three/examples/js/controls/OrbitControls.js'),
        'three/OrthographicTrackballControls': path.join(__dirname, 'node_modules/three/examples/js/controls/OrthographicTrackballControls.js'),
        'three/LineSegments2': path.join(__dirname, 'node_modules/three/examples/js/lines/LineSegments2.js'),
        'three/LineSegmentsGeometry': path.join(__dirname, 'node_modules/three/examples/js/lines/LineSegmentsGeometry.js'),
        'three/LineMaterial': path.join(__dirname, 'node_modules/three/examples/js/lines/LineMaterial.js'),
        'three/GLTFLoader': path.join(__dirname, 'node_modules/three/examples/js/loaders/GLTFLoader.js'),
        vue: 'vue/dist/vue.esm.js'
      }
    },
    plugins: [
      new ExtraWatchWebpackPlugin({
        dirs: [
          'src/client/scss/',
          'src/client/image/',
          'src/client/3d-models/'
        ]
      }),
      new CleanWebpackPlugin(), // clears unused files after build.
      new webpack.ProvidePlugin({
        'THREE': 'three'
      }),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      }),
      new HtmlWebpackPlugin({
        hash: true,
        template: './src/client/webpack-template.index.html',
        inject: 'head',
        templateParameters: {
          'license': license,
          'google_analytics': googleAnalyticsCode
        },
      }),
      new PostCompilePlugin(() => {
        let result = sass.renderSync({
          file: path.resolve(__dirname, SASS_INPUT_FILE),
          outputStyle: 'compressed'
        });

        ASSET_PATHS.forEach( path => {
          fs.copySync(`${SRC_DIR}/${path}`, `${DIST_DIR}/${path}`);
        } );

        fs.writeFileSync(path.resolve(__dirname, SASS_OUTPUT_FILE), result.css);
      })
    ],
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    },
    watchOptions: {
      poll: true,
      ignored: /node_modules/
    }
  }
};
