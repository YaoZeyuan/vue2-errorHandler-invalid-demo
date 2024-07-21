# Vue 2 + Vite

#  概览

问题描述: 构建产物中, errorHandler无法拦截全局异常
问题原因: Rollup会在构建时将vue提供的errorHandler视为dead code进行移除, 导致`Vue.config.errorHandler`配置项失效

#  复现环境

| 配置项             | 详情                                                  |
| :----------------- | :---------------------------------------------------- |
| 出现异常的引用方式 | 直接引入压缩后的vue代码(\*.prod.js/\*.min.js)         |
| vue版本            | vue@2.7.16                                            |
| 构建工具           | vite@5.3.4(rollup@4.18.1 & @vitejs/plugin-vue2@2.3.1) |

#  复现方法

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

由于config.errorHandler是运行时赋值, 所以初始值为null, 但代码压缩后信息丢失, 导致Rollup认为`globalHandleError`函数中的 config.errorHandler 恒为null, if语句块被整体删除, 引发问题

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

