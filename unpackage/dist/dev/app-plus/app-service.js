if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const DirectionType$1 = {
    Up: -1,
    Down: 1
  };
  const _Virtual = class {
    constructor({
      uniqueIds = [],
      windowHeight = 0
    } = {}, onRangeUpdate) {
      this.range = {
        start: 0,
        end: _Virtual.viewCount,
        padFront: 0,
        padBehind: 0
      };
      // 整个滚动区域的高度
      this.scrollHeight = 0;
      // 可视窗口高度
      this.windowHeight = 0;
      // 记录当前滚动偏移量
      this.scrollTop = 0;
      // 通知外部range变化的函数
      this.onRangeUpdate = null;
      // 列表数据
      this.uniqueIds = [];
      // 第一次页面上渲染数据的总高度
      this.firstRangeTotalSize = 0;
      //  第一次页面上渲染数据的平均高度
      this.firstRangeAverageSize = 0;
      // 每项item的高度
      this.sizes = /* @__PURE__ */ new Map();
      this.uniqueIds = uniqueIds;
      this.windowHeight = windowHeight;
      this.onRangeUpdate = onRangeUpdate;
      if (this.onRangeUpdate)
        this.onRangeUpdate(this.range);
    }
    /**
     * 更新list
     */
    updateDateList(uniqueIds) {
      this.uniqueIds = uniqueIds;
      this.range.end = this.uniqueIds.length;
      this.onRangeUpdate(this.range);
    }
    // 存储每个item的高度
    saveSize(key, height) {
      this.sizes.set(key, height);
      if (this.sizes.size < Math.min(_Virtual.viewCount, this.uniqueIds.length)) {
        this.firstRangeTotalSize = [...this.sizes.values()].reduce((acc, val) => acc + val, 0);
        this.firstRangeAverageSize = Math.round(this.firstRangeTotalSize / this.sizes.size);
      } else {
        delete this.firstRangeTotalSize;
      }
    }
    /**
     * 主要函数监听滚动
     * @param {Object} e
     */
    onScroll(e) {
      let offset = Math.floor(e.detail.scrollTop);
      this.scrollHeight = e.detail.scrollHeight;
      if (this.getDirection(offset) === DirectionType$1.Up) {
        this.handleUp();
      } else {
        this.handleDown();
      }
      this.scrollTop = offset;
    }
    /**
     * 向上滚
     */
    handleUp() {
      const overs = this.getOverIndex();
      this.checkRange(overs, this.getEndByStart(overs));
    }
    /**
     * 向下滚
     */
    handleDown() {
      const overs = this.getOverIndex();
      this.checkRange(overs, this.getEndByStart(overs));
    }
    checkRange(start, end) {
      let endIndex = start + _Virtual.viewCount * 2;
      if (!this.uniqueIds[endIndex]) {
        endIndex = this.uniqueIds.length;
      }
      this.updateRange(start, end);
    }
    updateRange(start, end) {
      this.range.start = start;
      this.range.end = end;
      this.range.padFront = this.getPadFront();
      this.range.padBehind = this.getPadBehind();
      this.onRangeUpdate(this.range);
    }
    getPadFront() {
      return this.getIndexOffset(this.range.start);
    }
    getPadBehind() {
      const lastIndex = this.getLastIndex();
      const end = this.range.end;
      return (lastIndex - end) * this.getEstimateSize();
    }
    /**
     * 获取滚动方向
     * @param {Object} offset
     */
    getDirection(offset) {
      if (offset > this.scrollTop) {
        return DirectionType$1.Down;
      } else {
        return DirectionType$1.Up;
      }
    }
    /**
     * 获取当前所在位置
     */
    getOverIndex() {
      let low = 0;
      let middle = 0;
      let middleOffset = 0;
      let high = this.uniqueIds.length;
      while (low <= high) {
        middle = low + Math.floor((high - low) / 2);
        middleOffset = this.getIndexOffset(middle);
        if (middleOffset === this.scrollTop) {
          return middle;
        } else if (middleOffset < this.scrollTop) {
          low = middle + 1;
        } else if (middleOffset > this.scrollTop) {
          high = middle - 1;
        }
      }
      return low > 0 ? --low : 0;
    }
    /**
     * 通过index在sizes中0到index的累加值
     * @param {Object} givenIndex
     */
    getIndexOffset(givenIndex) {
      if (!givenIndex) {
        return 0;
      }
      let offset = 0;
      let indexSize = 0;
      for (let index = 0; index < givenIndex; index++) {
        indexSize = this.sizes.get(this.uniqueIds[index].id);
        offset = offset + (typeof indexSize === "number" ? indexSize : this.getEstimateSize());
      }
      return offset;
    }
    /**
     * 获取平均值
     */
    getEstimateSize() {
      return this.firstRangeAverageSize;
    }
    /**
     * 通过起点获取结束点
     * @param {Object} start
     */
    getEndByStart(start) {
      const theoryEnd = start + _Virtual.viewCount - 1;
      const truelyEnd = Math.min(theoryEnd, this.getLastIndex());
      return truelyEnd;
    }
    getLastIndex() {
      return this.uniqueIds.length - 1;
    }
  };
  let Virtual = _Virtual;
  Virtual.viewCount = 20;
  const SIZE_UPDATE_KEY = Symbol["size_update_key"];
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$3 = {
    __name: "item",
    props: {
      item: {
        type: Object,
        default: () => ({})
      }
    },
    setup(__props) {
      const props = __props;
      let resizeObserver = null;
      const sizeUpdateInject = vue.inject(SIZE_UPDATE_KEY);
      vue.onMounted(() => {
        resizeObserver = uni.createIntersectionObserver();
        resizeObserver.relativeTo(".scroll-view").observe(".item_" + props.item.id, (res) => {
          sizeUpdateInject.update(props.item.id, res.boundingClientRect.height);
        });
      });
      vue.onBeforeUnmount(() => {
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(
          "view",
          {
            class: vue.normalizeClass(["item", "item_" + __props.item.id]),
            style: vue.normalizeStyle({ height: __props.item.height + "px" })
          },
          vue.toDisplayString(__props.item.value),
          7
          /* TEXT, CLASS, STYLE */
        );
      };
    }
  };
  const Item = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-8c8d6a28"], ["__file", "D:/code/uniapp/Hello-test/pages/index/item.vue"]]);
  const _sfc_main$2 = {
    __name: "index",
    setup(__props) {
      function createData2(wait = 0) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(
              Array.from(new Array(20), (_, index) => ({
                id: uRandom2(),
                value: index,
                height: Math.floor(30 + Math.random() * 70)
              }))
            );
          }, wait);
        });
      }
      function uRandom2() {
        const S4 = () => ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
        return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
      }
      const dataList = vue.ref([]);
      const range = vue.reactive({
        start: 0,
        end: 0,
        padFront: 0,
        padBehind: 0
      });
      let virtualInstance = null;
      vue.provide(SIZE_UPDATE_KEY, {
        update(key, height) {
          if (virtualInstance)
            virtualInstance.saveSize(key, height);
        }
      });
      const renderData = vue.computed(() => {
        return dataList.value.slice(range.start, range.end);
      });
      const scrollBarStyle = vue.computed(() => {
        return {
          paddingTop: range.padFront + "px",
          paddingBottom: range.padBehind + "px"
        };
      });
      vue.watch(
        () => dataList.value.length,
        (val) => {
          if (virtualInstance)
            virtualInstance.updateDateList(dataList.value);
        }
      );
      onLoad(async () => {
        dataList.value = await createData2();
        const query = uni.createSelectorQuery().in(this);
        query.select(".scroll-view").boundingClientRect((rect) => {
          virtualInstance = new Virtual(
            {
              uniqueIds: dataList.value,
              windowHeight: rect.height
            },
            (data) => {
              range.start = data.start;
              range.end = data.end;
              range.padFront = data.padFront;
              range.padBehind = data.padBehind;
            }
          );
        }).exec();
      });
      function onScroll(e) {
        virtualInstance.onScroll(e);
      }
      async function onScrollTolower() {
        const data = await createData2(1e3);
        dataList.value.push(...data);
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(
          "scroll-view",
          {
            ref: "scrollViewRef",
            class: "scroll-view",
            "scroll-y": "true",
            onScroll,
            onScrolltolower: onScrollTolower
          },
          [
            vue.createElementVNode(
              "view",
              {
                class: "scroller",
                style: vue.normalizeStyle(vue.unref(scrollBarStyle))
              },
              [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(vue.unref(renderData), (item) => {
                    return vue.openBlock(), vue.createBlock(Item, {
                      key: item.id,
                      item
                    }, null, 8, ["item"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ],
              4
              /* STYLE */
            )
          ],
          544
          /* HYDRATE_EVENTS, NEED_PATCH */
        );
      };
    }
  };
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/code/uniapp/Hello-test/pages/index/index.vue"]]);
  const viewCount = 20;
  const itemHeight = 50;
  let scrollTop = 0;
  const DirectionType = {
    Up: -1,
    Down: 1
  };
  function createData(wait = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(
          Array.from(new Array(20), (_, index) => ({
            id: uRandom(),
            value: index
          }))
        );
      }, wait);
    });
  }
  function uRandom() {
    const S4 = () => ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
    return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
  }
  function throttle(fn, wait = 500) {
    let timer = null;
    return (...args) => {
      if (timer)
        return;
      timer = setTimeout(() => {
        fn(...args);
        timer = null;
      }, wait);
    };
  }
  const _sfc_main$1 = {
    data() {
      return {
        dataList: [],
        itemHeight,
        windowHeight: 0,
        scrollHeight: 0,
        startIndex: 0,
        onScroll: null,
        isRequestState: false
      };
    },
    computed: {
      renderData() {
        let startIndex = 0;
        if (this.startIndex <= viewCount) {
          startIndex = 0;
        } else {
          startIndex = this.startIndex - viewCount;
        }
        return this.dataList.slice(startIndex, this.endIndex);
      },
      endIndex() {
        let endIndex = this.startIndex + viewCount * 2;
        if (!this.dataList[endIndex]) {
          endIndex = this.dataList.length;
        }
        formatAppLog("log", "at pages/index/indexOld.vue:79", this.dataList.length);
        return endIndex;
      },
      scrollBarStyle() {
        let startIndex = 0;
        if (this.startIndex <= viewCount) {
          startIndex = 0;
        } else {
          startIndex = this.startIndex - viewCount;
        }
        return {
          paddingTop: startIndex * itemHeight + "px",
          paddingBottom: (this.dataList.length - this.endIndex) * itemHeight + "px"
        };
      }
    },
    async onLoad() {
      this.dataList = await createData();
      const query = uni.createSelectorQuery().in(this);
      query.select(".scroll-view").boundingClientRect((rect) => {
        this.windowHeight = rect.height;
      }).exec();
      this.onScroll = throttle((e) => {
        let offset = e.detail.scrollTop;
        this.scrollHeight = e.detail.scrollHeight;
        if (this.getDirection(offset) === DirectionType.Up) {
          this.handleUp();
        } else {
          this.handleDown();
        }
        scrollTop = offset;
      }, 1e3 / 60);
    },
    methods: {
      getDirection(offset) {
        if (offset > scrollTop) {
          return DirectionType.Down;
        } else {
          return DirectionType.Up;
        }
      },
      handleUp() {
        const over = this.getOverIndex();
        this.startIndex = over;
      },
      async handleDown() {
        const over = this.getOverIndex();
        this.startIndex = over;
      },
      async onScrollTolower() {
        const data = await createData(1e3);
        this.dataList.push(...data);
      },
      getOverIndex() {
        return Math.floor(scrollTop / itemHeight);
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "scroll-view",
      {
        ref: "scrollViewRef",
        class: "scroll-view",
        "scroll-y": "true",
        onScroll: _cache[0] || (_cache[0] = (...args) => $data.onScroll && $data.onScroll(...args)),
        onScrolltolower: _cache[1] || (_cache[1] = (...args) => $options.onScrollTolower && $options.onScrollTolower(...args))
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: "scroller",
            style: vue.normalizeStyle($options.scrollBarStyle)
          },
          [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.renderData, (item) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: item.id,
                    class: "item",
                    style: vue.normalizeStyle({ height: $data.itemHeight + "px" })
                  },
                  vue.toDisplayString(item.value),
                  5
                  /* TEXT, STYLE */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ],
          4
          /* STYLE */
        )
      ],
      544
      /* HYDRATE_EVENTS, NEED_PATCH */
    );
  }
  const PagesIndexIndexOld = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-abb2531f"], ["__file", "D:/code/uniapp/Hello-test/pages/index/indexOld.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/index/indexOld", PagesIndexIndexOld);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/code/uniapp/Hello-test/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
