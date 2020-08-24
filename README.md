# 逐帧动画生成器 - ns frame by frame animation

前端杂谈：逐帧动画和在线工具制作

[在线地址](https://nostarsnow.github.io/frame-animation/)

## 需求源自于业务

### 需求来源

1. 动画表现力强
2. 老旧客户端对动图支持差
3. ui导出的gif失真

### 需求分析

1. apng和webp兼容性差，gif色彩不够丰富且文件太大不易无损压缩，svg限制太多，svga对设计软件支持度低......
2. 逐帧动画方式年代久远，是一种最原始的方式，最原始也就最有效，且在网页中生成的png图色彩支持度高，无损压缩方案成熟。
3. 逐帧动画在一定程度上可以防止图片盗链问题。

### 什么是逐帧动画？

逐帧动画（Frame By Frame）是一种常见的动画形式，其原理是在“连续的关键帧”中分解动画动作，也就是在时间轴的每帧上逐帧绘制不同的内容，使其连续播放而成动画。

![翻书动画](https://static.zuhaowan.com/static/zhwfe/static/nostar/frame-animation/img/fanshu.gif)

### 什么是帧

非数据帧，而是帧数，又称为FPS（Frames Per Second）。每一帧都是静止的图象，快速连续地显示帧便形成了运动的假象。高的帧率可以得到更流畅、更逼真的动画。每秒钟帧数 (fps) 愈多，所显示的动作就会愈流畅。

1. 人类眼睛的视觉暂留现象是每秒24帧，所以理论上大于24帧就可以视为流畅。动画、视频等多采用25-30帧。
2. 游戏画面的变化速率很高，所以一般是越高越好。如果开启垂直同步，帧数一般应维持在60帧左右，最低也需要30帧。

### 什么是补间动画？

补间动画，绘制关键帧，中间插入的补间帧则是由计算机运算得出。分为动作补间和形状补间等。但是需要细腻处理的地方还会通过逐帧绘制来确保清晰度和流畅度

## 曾制作过客户端形式的方案

### 查看旧方案

[gif2apng](https://github.com/nostarsnow/gif2apng)

![生成中](https://wx1.sinaimg.cn/mw690/4d227521ly1g8ofe230zij20s80hqt9n.jpg)

![生成完毕](https://wx3.sinaimg.cn/mw690/4d227521ly1g8ofe4fjcmj20s80swgu0.jpg)

### 旧方案的问题

1. 部分功能缺失
2. 客户端更新不宜，修复bug或增加功能
3. 客户端体积较大，需下载使用不便
4. 一个页面多次使用该工具生成的代码会导致不变

### 解决思路

1. 增加新的功能。css step支持
2. 更换为web在线形式
3. 对生成代码进行重构，考虑多次调用的情况
4. 添加对rem的支持

## 制作在线工具

### 与客户端相比，难点思考

1. png图片上传的处理
2. 根据配置生成精灵图和代码供下载
3. gif图片上传的处理
4. 逐帧图的查看和处理

### 开始制作

#### 一.搭建环境

使用`vue`来初始化项目，安装依赖并搭建基本架构。
> 尤其是在`package.json`中，将`scripts`中的`serve`替换为`dev`

#### 二.安装ui库。配置按需加载

使用`element-ui`这个破ui库以`babel-plugin-component`和`@babel/plugin-transform-runtime`处理按需加载。

#### 三.制作页面配置布局

将配置的参数，使用ui库来添加好配置信息

#### 四.处理图片上传

##### png图片上传的处理

1. 出于某些原因，上传采用上传文件夹的形式，chrome中可以支持上传文件夹。目前不计划采用上传多个png图片的方式。
2. 上传后会筛选出文件夹下png图片，将图片顺序按照名称去除非数字的字符后正序排列。`e.target.files`是类数组，无法直接使用`filter/sort`等方法。
```js
uploadPng.addEventListener("change", async function(e) {
  let files = [].filter
    .call(e.target.files, (v) => /\.png/.test(v.name))
    .sort((a, b) => {
      let an = +a.name.replace(/\D/g, "");
      let bn = +b.name.replace(/\D/g, "");
      return an - bn;
    });
});
```
3. 将所有文件格式化为可使用的对象。如下

```js
async formatPng(files) {
  return await Promise.all(
    files.map(async (v) => {
      let img = await this.getFileClientRect(v);
      let data = await this.getFileBase64(v);
      return {
        name: v.name, // 图片名称
        img, // new image对象
        width: img.width, // 图片宽度
        height: img.height, // 图片高度
        data, // 将图片转为base64
      };
    })
  );
}
```

##### gif图片上传的处理

1. 上传gif后，将gif进行截取。此段涉及到二级制处理，获取所有帧的图和每秒帧数。

2. 同上格式化为可使用对象

#### 五.图片处理之后的处理

使用`view.js`来查看所有帧图片。by the way，这个库是我用过的最满意的图片查看库，已用了多年的多个项目。

#### 六.生成图片和代码的处理

1. 通过拼接布局的方式，根据配置的行列来将所有帧图片拼接到canvas中，保存图片即将canvas转为base64之后保存。

2. 因为浏览器内存限制，chrome下canvas宽高度最大值为`16380*16380`，超出则无法保存和转换为base64，因此在超出时添加了错误提醒。

3. 获取生成图片的信息，宽高可以计算得出，存储文件大小有两种方式

```js
// base64字符串获取保存的图片大小。一般在3/4左右
base64.split(",")[1].length * 3 / 4 / 1024).toFixed(2)
// 通过blob方式更为精确
(window.atob(base64.split(",")[1]).length / 1024).toFixed(2)
```

4. 输出代码并添加样式美化。因为皆是html代码，因此使用的是`highlight.js/styles/vs2015.css`的风格

5. 添加图片和代码的复制下载

6. 在iframe中实现预览。不污染本页面

7. 完成！

### 总结

其实还缺少一些功能，png多图上传、帧图自定义的编辑/删除/排序功能、在线图片压缩功能（目前用的tinypng）等等，还需看情况待定添加。

## 需求，美化于业务

需求不是无缘无故产生的，而业务，也不是一尘不变的。 

只有相互映衬配合，才能相得益彰，互相成就。

大鹏一日同风起。扶摇直上九万里！