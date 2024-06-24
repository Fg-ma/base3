const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./index.tsx",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index_bundle.js",
    publicPath: "/", // Ensure correct public path
  },
  target: "web",
  devServer: {
    port: 8080,
    static: [
      {
        directory: path.join(__dirname, "public"),
        publicPath: "/", // Correct public path for static files
      },
      {
        directory: path.join(__dirname, "models"),
        publicPath: "/models",
      },
    ],
    open: true,
    hot: true,
    liveReload: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    fallback: {
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 10000,
              name: "[name].[hash:8].[ext]",
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[hash].[ext]",
              outputPath: "/public", // Ensure output path matches devServer.static.directory
              publicPath: "/public", // Ensure public path matches devServer.static.publicPath
            },
          },
        ],
      },
      {
        test: /\.json$/,
        type: "javascript/auto",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
    }),
  ],
};
