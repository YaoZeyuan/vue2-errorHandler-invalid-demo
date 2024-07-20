# Vue 2 + Vite

基于Rollup构建时, 若引入的vue文件路径不正确, 会导致构建出的文件errorHandler配置失效

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