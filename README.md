# 基于vite+vue2.7, 由于引用方式错误导致-errorHandler失效

> [在线查看](https://stackblitz.com/edit/github-wszpet-qbenux?file=README.md)

#  概览


| 配置项             | 详情                                                  |
| :----------------- | :---------------------------------------------------- |
| 问题描述 | 由于直接引入vue压缩后产物, 导致构建结果中, errorHandler无法拦截全局异常        |
| 影响范围            | vue@2.7所有版本, 直接引入压缩后的vue代码(\*.prod.js/\*.min.js)                                            |
| 问题原因           | Rollup会在构建时将vue提供的errorHandler视为dead code进行移除, 导致`Vue.config.errorHandler`配置项失效 |
| 构建工具           | vite@5.3.4(rollup@4.18.1 & @vitejs/plugin-vue2@2.3.1) |


复现方法: 
- 克隆该项目
- `pnpm install`
- [dev模式正常]执行`pnpm dev`
- F12打开开发者工具, 点击界面中的trigger error按钮, 可发现在dev模式下, 该报错可以正常被errorHandler捕获(弹出alert)
  - ![errorHandler生效](https://mirror-4-web.bookflaneur.cn/http://tva1.sinaimg.cn/large/007Yq4pTly1hrvkfsvpj1j30iw0f6tbn.jpg)
- [prod模式异常]执行`pnpm build && pnpm preview`
- F12打开开发者工具, 点击界面中的trigger error按钮, 可以注意到该报错未被errorHandler捕获(未弹出alert)
  - ![errorHandler失效](https://mirror-4-web.bookflaneur.cn/http://tva1.sinaimg.cn/large/007Yq4pTly1hrvkefi7xpj30il0egju1.jpg)

#  详述

使用以下任意方式引入vue, 都会导致构建产物中`Vue.config.errorHandler`失效. dev模式由于未开启DCE, 故无影响

```js
// 正常
import Vue from "vue";

// 异常
// 通过以下方式引用的vue, dev模式下errorHandler行为正常, 但执行构建后, errorHandler会失效
// import Vue from "vue/dist/vue.min.js";
// import Vue from "vue/dist/vue.common.prod.js";
// import Vue from "vue/dist/vue.common.js";
// import Vue from "vue/dist/vue.esm.browser.min.js";
// import Vue from "vue/dist/vue.runtime.common.js";
// import Vue from "vue/dist/vue.runtime.common.prod.js";
// import Vue from "vue/dist/vue.runtime.min.js";
// import Vue from "vue/dist/vue.runtime.mjs";

Vue.config.errorHandler = (err, instance, info) => {
  console.log("✅errorHandler catch success", err);
};

```

## vue引入方式概览

| 是否有效 | 文件名                     | 原因                       |
| :------- | :------------------------- | :------------------------- |
| ✅        | vue.common.dev.js          |                            |
| 🚫        | vue.common.js              | 构建模式下实际导入prod文件 |
| 🚫        | vue.common.prod.js         |                            |
| ✅        | vue.esm.browser.js         |                            |
| 🚫        | vue.esm.browser.min.js     |                            |
| ✅        | vue.esm.js                 |                            |
| ✅        | vue.js                     |                            |
| 🚫        | vue.min.js                 |                            |
| ✅        | vue.runtime.common.dev.js  |                            |
| 🚫        | vue.runtime.common.js      | 构建模式下实际导入prod文件 |
| 🚫        | vue.runtime.common.prod.js |                            |
| ✅        | vue.runtime.esm.js         |                            |
| ✅        | vue.runtime.js             |                            |
| 🚫        | vue.runtime.min.js         |                            |
| 🚫        | vue.runtime.mjs            |                            |

# 原因

由于config.errorHandler是运行时赋值, 所以初始值为null, 但代码压缩后信息丢失, 导致Rollup认为`globalHandleError`函数中的 config.errorHandler 恒为null, 构建时if语句块被整体移除, 引发问题

```ts
// vue源码

// 全局配置项
var config = {
    // ...
    // 此处应该是运行时赋值
    /**
     * Error handler for watcher errors
     */
    errorHandler: null,
    // ...
};
// ...
function globalHandleError(err, vm, info) {
    // 代码压缩后, config.errorHandler直接被判定为null, if语句被视为dead code整体删除
    if (config.errorHandler) {
        try {
            return config.errorHandler.call(null, err, vm, info);
        }
        catch (e) {
            // if the user intentionally throws the original error in the handler,
            // do not log it twice
            if (e !== err) {
                logError(e, null, 'config.errorHandler');
            }
        }
    }
    logError(err, vm, info);
}
```


#   彩蛋: 启用 SourceMap 会导致排查难度增加 

由于SourceMap的工作是将构建产物映射回源文件, 会掩盖源文件中, if语句块被删除的实时, 因此在浏览器调试时会看到`if(true)`然后执行了`else`语句的现象, 增大故障排查难度

##  示例

编辑`vue.min.js`, 为errorHandler调用添加调试日志
```js
function bn(t, e, n) {
  console.log("B.errorHandler值为 => ", B.errorHandler.toString());
  const rawBoolean = true;
  const errorHandlerToBool = !!B.errorHandler;

  console.log("rawBoolean is ", JSON.stringify(rawBoolean));
  if (rawBoolean) {
    console.log("rawBoolean 为true");
  } else {
    console.log("rawBoolean 为false");
  }
  console.log(
    "errorHandlerToBool is ",
    JSON.stringify(errorHandlerToBool)
  );
  if (errorHandlerToBool) {
    console.log("errorHandlerToBool 为true");
  } else {
    console.log("errorHandlerToBool 为false");
  }

  if (B.errorHandler) {
    console.log("B.errorHandler存在, 调用成功");
    try {
      return B.errorHandler.call(null, t, e, n);
    } catch (e) {
      e !== t && $n(e);
    }
  } else {
    console.log("B.errorHandler不存在, 未进行调用");
  }
  $n(t);
}
```

然后在浏览器中运行, 在有SourceMap的情况下, 会很难理解代码运行逻辑

比如if(true)但走到了else路径
- ![if(true)但走到了else路径](https://mirror-4-web.bookflaneur.cn/http://tva1.sinaimg.cn/large/007Yq4pTly1hrvkush3mdj30tn0pegwj.jpg)
单看日志也看不出问题
- ![log结果和代码逻辑不一致](https://mirror-4-web.bookflaneur.cn/http://tva1.sinaimg.cn/large/007Yq4pTly1hrvl22170cj30lb0r1gwb.jpg)

但如果移除SourceMap, 直接看源码, 即可发现是构建结果不正确, 实际构建结果中, 直接移除了if判断部分
- ![实际构建结果中, 直接移除了if判断部分](https://mirror-4-web.bookflaneur.cn/http://tva1.sinaimg.cn/large/007Yq4pTly1hrvl5ot108j30oj0ox124.jpg)
