Webpack是一个现代JavaScript应用程序的静态模块打包器。它主要的目标是将JavaScript文件打包在一起，但也能够转换、打包或包裹任何资源，如CSS、HTML、图片等。Webpack会从这些资源中构建一个依赖图，然后打包成一个或多个bundle。

#### 核心概念
+ **Entry（入口）**：
    - Webpack的编译起点，可以是一个文件或者一个文件数组。Webpack会从这些文件开始解析模块依赖。 
+ **Output（输出）**：
    - 指定Webpack打包后的文件如何输出，包括输出的路径和文件名。 
+ **Module（模块）**：
    - Webpack的基本构建块。一切皆模块，包括JavaScript文件、CSS、图片等。 
+ **Chunk**：
    - 一个Chunk是由多个模块组成的一个文件，Webpack会根据依赖关系将模块分配到不同的Chunks。 
+ **Loader（加载器）**：
    - Webpack只能处理JavaScript和JSON文件，对于其他类型的文件，需要使用Loader来转换和处理。Loader是一个转换文件的工具。 
+ **Plugin（插件）**：
    - 扩展Webpack功能的工具。Webpack的插件可以在Webpack生命周期的钩子中执行自定义构建任务。 
+ **Dependency（依赖）**：
    - 模块间的依赖关系。Webpack通过分析模块间的依赖关系，生成对应的依赖图。 
+ **Bundle（打包文件）**：
    - 最终生成的文件，包含了一个或多个模块，以及运行时代码。 
+ **DevServer（开发服务器）**：
    - Webpack提供的开发服务器，支持实时重载。 



#### 常见配置
+ **Entry配置**： 

```javascript
entry: './src/index.js', // 入口文件
```

+ **Output配置**： 

```javascript
output: {
  path: path.resolve(__dirname, 'dist'), // 输出路径
  filename: 'bundle.js', // 输出文件名
},
```

+ **Loader配置**： 

```javascript
module: {
  rules: [
    {
      test: /\.css$/, // 匹配文件类型
      use: ['style-loader', 'css-loader'] // 应用的loader
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }
  ]
}
```

+ **Plugin配置**： 

```javascript
plugins: [
  new CleanWebpackPlugin(), // 清理dist目录
  new HtmlWebpackPlugin({ // 自动生成index.html文件
    template: './src/index.html'
  }),
  // 更多插件...
]
```

+ **DevServer配置**： 

```javascript
devServer: {
  contentBase: path.join(__dirname, 'dist'), // 服务器所加载的页面所在的目录
  compress: true, // 是否启用gzip压缩
  port: 9000, // 端口号
  open: true, // 自动打开浏览器
}
```

+ **Mode配置**： 

```javascript
mode: 'development', // 指定Webpack的模式，可以是development或production
```

+ **Optimization配置**： 

```javascript
optimization: {
  splitChunks: {
    chunks: 'all' // 代码分割
  }
}
```

