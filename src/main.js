// 正确的引用方式
import Vue from "vue";
// 错误的引用方式
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

const app = new Vue({
  render: (h) => {
    return h(
      "button",
      {
        on: {
          click() {
            throw new Error("can errorHandler catch it?");
          },
        },
      },
      ["click me to trigger error"]
    );

    h(App);
  },
}).$mount("#app");
