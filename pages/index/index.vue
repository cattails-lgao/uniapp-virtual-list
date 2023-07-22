<template>
	<!-- #ifndef APP-NVUE -->
	<scroll-view
		ref="scrollViewRef"
		class="scroll-view"
		scroll-y="true"
		@scroll="onScroll"
		@scrolltolower="onScrollTolower"
	>
		<view class="scroller" :style="scrollBarStyle">
			<block v-for="item in renderData" :key="item.id">
				<Item :item="item"></Item>
			</block>
		</view>
	</scroll-view>
	<!-- #endif -->
	<!-- #ifdef APP-NVUE -->
	<!-- #endif -->
</template>

<script module="virtual" lang="renderjs">
	export default {
		mounted() {
			
		}
	}
</script>

<script setup>
import { computed, provide, reactive, ref, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import Virtual from './virtual';
import { SIZE_UPDATE_KEY } from './costant';
import Item from './item.vue';

function createData(wait = 0) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(
				Array.from(new Array(20), (_, index) => ({
					id: uRandom(),
					value: index,
					height: Math.floor(30 + Math.random() * 70)
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

const dataList = ref([]);
const range = reactive({
	start: 0,
	end: 0,
	padFront: 0,
	padBehind: 0
});
let virtualInstance = null;

// 注册size监听
provide(SIZE_UPDATE_KEY, {
	update(key, height) {
		if(virtualInstance) virtualInstance.saveSize(key, height);
	}
})

const renderData = computed(() => {
	return dataList.value.slice(range.start, range.end);
});

const scrollBarStyle = computed(() => {
	return {
		paddingTop: range.padFront + 'px',
		paddingBottom: range.padBehind + 'px'
	};
});

watch(
	() => dataList.value.length,
	(val) => {
		if (virtualInstance) virtualInstance.updateDateList(dataList.value);
	}
);

onLoad(async () => {
	dataList.value = await createData();
	const query = uni.createSelectorQuery().in(this);

	// 获取视窗高度
	query
		.select('.scroll-view')
		.boundingClientRect((rect) => {
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
		})
		.exec();
});

function onScroll(e) {
	virtualInstance.onScroll(e);
}
async function onScrollTolower() {
	const data = await createData(1000);
	dataList.value.push(...data);
}
</script>

<style scoped lang="scss">
.scroll-view {
	height: calc(100vh - 44px);
}
</style>
