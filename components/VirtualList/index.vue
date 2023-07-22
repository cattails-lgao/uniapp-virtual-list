<template>
	<!-- #ifndef APP-NVUE -->
	<scroll-view
		class="scroll-view"
		scroll-y="true"
		refresher-enabled
		:refresher-triggered="refresherTriggered"
		@refresherpulling="onRefresherPulling"
		@refresherrefresh="onRefresherRefresh"
		@scroll="onScroll"
		@scrolltolower="onScrollTolower"
	>
		<view class="scroller" :style="scrollBarStyle">
			<block v-for="item in renderData" :key="item.id">
				<Item :item="item">
					<slot :data="item" />
				</Item>
			</block>
			<uni-load-more :status="loadMoreState" />
		</view>
	</scroll-view>
	<!-- #endif -->
	<!-- #ifdef APP-NVUE -->
	<list ref="scrollListRef" class="scroll-view" :loadmoreoffset="50" @scroll="onScroll" @loadmore="onScrollTolower">
		<refresh @refresh="onRefresherRefresh" :display="refresherTriggered ? 'show' : 'hide'">
			<loading-indicator></loading-indicator>
			<text>Refreshing ...</text>
		</refresh>
		<cell :style="{ height: scrollBarStyle.paddingTop }"></cell>
		<cell v-for="item in renderData" :key="item.id">
			<Item :item="item">
				<slot :data="item" />
			</Item>
		</cell>
		<cell :style="{ height: scrollBarStyle.paddingBottom }"></cell>
		<cell>
			<uni-load-more :status="loadMoreState" />
		</cell>
	</list>
	<!-- #endif -->
</template>

<script>
/**
 * 不支持nvue
 */
export default {
	name: 'VirtualList'
};
</script>

<script module="virtual" lang="renderjs">
	export default {
		mounted() {
			// ...
		},
		methods: {
			// ...
		}
	}
</script>

<script setup>
import { computed, provide, nextTick, shallowRef, reactive, ref, watch } from 'vue';
import Virtual from './virtual';
import { SIZE_UPDATE_KEY } from './costant';
import Item from './item.vue';

const props = defineProps({
	dataList: {
		type: Array,
		default: () => []
	},
	loadMoreState: {
		type: String,
		default: 'more'
	}
});

const emits = defineEmits(['refresh', 'toLower']);

const range = reactive({
	start: 0,
	end: 0,
	padFront: 0,
	padBehind: 0
});

let virtualInstance = new Virtual(
	{
		uniqueIds: props.dataList
	},
	(data) => {
		range.start = data.start;
		range.end = data.end;
		range.padFront = data.padFront;
		range.padBehind = data.padBehind;
	}
);

// 注册size监听
provide(SIZE_UPDATE_KEY, {
	update(key, height) {
		// #ifdef H5
		nextTick(() => {
			if (virtualInstance) virtualInstance.saveSize(key, height);
		})
		// #endif
		// #ifndef H5
		if (virtualInstance) virtualInstance.saveSize(key, height);
		// #endif
	}
});

const renderData = computed(() => {
	return props.dataList.slice(range.start, range.end);
});

const scrollBarStyle = computed(() => {
	return {
		paddingTop: range.padFront + 'px',
		paddingBottom: range.padBehind + 'px'
	};
});

watch(
	() => props.dataList.length,
	(val) => {
		if (virtualInstance) virtualInstance.updateDateList(props.dataList);
	}
);

const refresherTriggered = ref(false);

function onRefresherPulling(e) {
	refresherTriggered.value = true;
}
function onRefresherRefresh() {
	emits('refresh', {
		done: () => {
			if (refresherTriggered.value) refresherTriggered.value = false;
		}
	});
}

function onScroll(e) {
	const data = {
		scrollTop: 0,
		scrollHeight: 0
	};
	// #ifdef APP-NVUE
	data.scrollTop = e.contentOffset.y;
	data.scrollHeight = e.contentSize.height;
	// #endif
	// #ifndef APP-NVUE
	data.scrollTop = e.detail.scrollTop;
	data.scrollHeight = e.detail.scrollHeight;
	// #endif
	virtualInstance.onScroll(data);
}

const scrollListRef = shallowRef();
async function onScrollTolower() {
	emits('toLower', {
		done: () => {
			// #ifdef APP-NVUE
			scrollListRef.value.resetLoadmore();
			// #endif
		}
	});
}
</script>

<style scoped lang="scss">
.scroll-view {
	height: calc(100vh - 44px);
}
</style>
