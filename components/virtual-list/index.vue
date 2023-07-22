<template>
	<scroll-view
		:style="{ height: systemData.windowHeight + 'px' }"
		:dataList="dataList"
		:startIndex="startIndex"
		:endIndex="endIndex"
		:change:dataList="test.onDataList"
		:change:startIndex="test.onStartIndex"
		:change:endIndex="test.onEndIndex"
		:data-windowHeight="systemData.windowHeight"
		scroll-y="true"
		@scroll="test.onScroll"
	>
		<!-- 渲染区域 -->
		<div class="virtual-list" :style="{ paddingTop: padFront + 'px', paddingBottom: padBehind + 'px' }">
			<block v-for="(item, index) in renderData" :key="item.id">
				<view class="item" :style="{ height: 200 + 'rpx' }" :data-id="item.id">
					{{ item.value }}
					<image style="height: 100rpx; width: 100rpx" src="/static/logo.png" mode=""></image>
				</view>
			</block>
		</div>
		
	</scroll-view>
</template>

<script>
// 十万条数据
const count = 1000;
const systemData = uni.getSystemInfoSync();
export default {
	name: 'VirtualList',
	data() {
		return {
			systemData,
			dataList: [],
			startIndex: 0,
			endIndex: 30,
			padFront: 0,
			padBehind: 0
		};
	},
	computed: {
		renderData() {
			return this.dataList.slice(this.startIndex, this.endIndex);
		}
	},
	created() {
		for (let i = 0; i < count; i++) {
			this.dataList.push({ id: i, value: i });
		}
	},
	methods: {
		updateRange(data) {
			data = JSON.parse(data);
			console.log(data);
			this.startIndex = data.startIndex;
			this.endIndex = data.endIndex;
			this.padFront = data.padFront;
			this.padBehind = data.padBehind;
		}
	}
};
</script>
<script lang="renderjs" module="test">
const DirctionType = {
	Up: 0,
	Down: 1
};
let direction = DirctionType.Down;
let scrollTopOld = 0;
const sizes = new Map();
let rangeTotalSize = 0;
let rangeAverageSize = 0;
// 一个屏幕能渲染多少 可用屏幕高度除以item高度
const visibleCount = 30;

let rDataList = [];
let rStartIndex = 0;
let rEndIndex = 0;
let windowHeight = 0;

export default {
	mounted() {
		const items = document.querySelectorAll('.item');
		items.forEach(item => {
			sizes.set(item.getAttribute('data-id'), item.offsetHeight);
			rangeTotalSize = [...sizes.values()].reduce((acc, val) => acc + val, 0);
			rangeAverageSize = Math.round(rangeTotalSize / sizes.size);
		})
	},
	methods: {
		onDataList(val, old, ownerInstance, instance) {
			rDataList = val;
			windowHeight = instance.getDataset().windowheight;
		},
		onStartIndex(val, old, ownerInstance, instance) {
			rStartIndex = val;
		},
		onEndIndex(val, old, ownerInstance, instance) {
			rEndIndex = val;
		},
		onScroll(e, ownerInstance) {
			// 滚动条距离顶部大小
			const scrollTop = e.detail.scrollTop;
			// 整个容器的滚动高度
			const scrollHeight = e.detail.scrollHeight;
			// 距离顶部小于0 || 距离顶部大小 + 可视区域大小 > 容器的滚动高度 + 1 || 没有滚动高度
			if (scrollTop < 0 || scrollTop + windowHeight > scrollHeight + 1 || !scrollHeight) {
				return;
			}

			// 确认滚动方向
			direction = scrollTop < scrollTopOld ? DirctionType.Up : DirctionType.Down;
			scrollTopOld = scrollTop;

			if (direction === DirctionType.Up) {
				this.handleUp(ownerInstance);
			} else if (direction === DirctionType.Down) {
				this.handleDown(ownerInstance);
			}
		},
		handleUp(ownerInstance) {
			const overs = this.getScrollOver();
			if (overs > rStartIndex) {
				return;
			}

			const start = Math.max(overs - visibleCount / 3, 0);
			this.checkRange(start, this.getEndByStart(start), ownerInstance);
		},
		handleDown(ownerInstance) {
			const overs = this.getScrollOver();
			if (overs < rStartIndex + visibleCount / 3) {
				return;
			}

			this.checkRange(overs, this.getEndByStart(overs), ownerInstance);
		},
		// 获取位置
		getScrollOver() {
			let low = 0;
			let middle = 0;
			let middleOffset = 0;
			let high = rDataList.length;
			while (low <= high) {
				middle = low + Math.floor((high - low) / 2);
				middleOffset = this.getIndexOffset(middle);
				if (middleOffset === scrollTopOld) {
					return middle;
				} else if (middleOffset < scrollTopOld) {
					low = middle + 1;
				} else if (middleOffset > scrollTopOld) {
					high = middle - 1;
				}
			}

			return low > 0 ? --low : 0;
		},
		getIndexOffset(givenIndex) {
			if (!givenIndex) {
				return 0;
			}

			let offset = 0;
			let indexSize = 0;
			for (let index = 0; index < givenIndex; index++) {
				console.log(givenIndex)
				indexSize = sizes.get(rDataList[index].id);
				offset = offset + (typeof indexSize === 'number' ? indexSize : rangeAverageSize);
			}
			return offset;
		},
		getLastIndex() {
			return rDataList.length - 1;
		},
		checkRange(start, end, ownerInstance) {
			const keeps = visibleCount;
			const total = rDataList.length;

			if (total <= keeps) {
				start = 0;
				end = this.getLastIndex();
			} else if (end - start < keeps - 1) {
				start = end - keeps + 1;
			}

			if (rStartIndex !== start) {
				this.updateRange(start, end, ownerInstance);
			}
		},
		getEndByStart(start) {
			const theoryEnd = start + visibleCount - 1;
			const truelyEnd = Math.min(theoryEnd, this.getLastIndex());
			return truelyEnd;
		},
		updateRange(start, end, ownerInstance) {
			const data = JSON.stringify({
				startIndex: start,
				endIndex: end,
				padFront: this.getPadFront(),
				padBehind: this.getPadBehind(),
			})
			ownerInstance.callMethod('updateRange', data)
		},
		getPadFront() {
			return this.getIndexOffset(rStartIndex);
		},
		getPadBehind() {
			const end =  rEndIndex;
			const lastIndex = this.getLastIndex();

			return (lastIndex - end) * this.getEstimateSize();
		},
		getEstimateSize() {
			return rangeAverageSize;
		}
	}
}
</script>

<style lang="scss" scoped>
.item {
	background-color: lightblue;
	margin-bottom: 20rpx;
	margin-left: 36rpx;
	margin-right: 36rpx;
	border-bottom: 1rpx solid #000;
}
</style>
