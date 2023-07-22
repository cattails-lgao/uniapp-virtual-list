<template>
	<scroll-view ref="scrollViewRef" class="scroll-view" scroll-y="true" @scroll="onScroll" @scrolltolower="onScrollTolower">
		<view class="scroller" :style="scrollBarStyle">
			<block v-for="item in renderData" :key="item.id">
				<view class="item" :style="{ height: itemHeight + 'px' }">{{ item.value }}</view>
			</block>
		</view>
	</scroll-view>
</template>

<script>
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
	//用于生成uuid
	const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

function throttle(fn, wait = 500) {
	let timer = null;
	return (...args) => {
		if (timer) return;
		timer = setTimeout(() => {
			fn(...args);
			timer = null;
		}, wait);
	};
}
export default {
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
			if(!this.dataList[endIndex]) {
				endIndex = this.dataList.length;
			}
			console.log(this.dataList.length)
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
				paddingTop: startIndex * itemHeight + 'px',
				paddingBottom: (this.dataList.length - this.endIndex) * itemHeight + 'px'
			};
		}
	},
	async onLoad() {
		this.dataList = await createData();
		const query = uni.createSelectorQuery().in(this);

		query
			.select('.scroll-view')
			.boundingClientRect((rect) => {
				this.windowHeight = rect.height;
			})
			.exec();
			
			this.onScroll = throttle((e) => {
				let offset = e.detail.scrollTop;
				this.scrollHeight = e.detail.scrollHeight;
			
				if (this.getDirection(offset) === DirectionType.Up) {
					this.handleUp();
				} else {
					this.handleDown();
				}
			
				scrollTop = offset;
			}, 1000/60);
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
			// if (this.startIndex + viewCount > this.dataList.length - 1 && !this.isRequestState) {
			// console.log(this.scrollHeight - Math.ceil(scrollTop) - this.windowHeight)
			// if (this.scrollHeight - Math.ceil(scrollTop) - this.windowHeight < 100 && !this.isRequestState) {
			// 	console.log('loadmore');
			// 	this.isRequestState = true;
			// 	const data = await createData(1000);
			// 	this.dataList.push(...data);
			// 	this.$nextTick(() => {
			// 		this.isRequestState = false;
			// 	});
			// 	return;
			// }

			this.startIndex = over;
		},
		async onScrollTolower() {
			const data = await createData(1000);
			this.dataList.push(...data);
		},
		getOverIndex() {
			return Math.floor(scrollTop / itemHeight);
		}
	}
};
</script>

<style scoped lang="scss">
.scroll-view {
	height: 100vh;
	
	.item {
			border-bottom: 1rpx solid #000;
	}
}
</style>
