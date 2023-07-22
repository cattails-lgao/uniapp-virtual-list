<template>
	<view :class="'item_' + item.id" ref="item"><slot /></view>
</template>

<script>
export default {
	name: 'Item'
};
</script>

<script setup>
import { getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, onUpdated } from 'vue';
import { SIZE_UPDATE_KEY } from './costant';
const props = defineProps({
	item: {
		type: Object,
		default: () => ({})
	}
});

const sizeUpdateInject = inject(SIZE_UPDATE_KEY);

// #ifndef APP-NVUE
let resizeObserver = null;
// #endif

// #ifdef APP-NVUE
const dom = uni.requireNativePlugin('dom');
// #endif

onMounted(() => {
	// #ifndef APP-NVUE
	resizeObserver = uni.createIntersectionObserver();
	resizeObserver.relativeTo('.scroll-view').observe('.item_' + props.item.id, (res) => {
		sizeUpdateInject.update(props.item.id, res.boundingClientRect.height);
	});
	// #endif
	
	// #ifdef APP-NVUE
	const _this = getCurrentInstance();
	dom.getComponentRect(_this.refs.item, (rect) => {
		console.log(rect.size);
	})
	// #endif
});

onBeforeUnmount(() => {
	// #ifndef APP-NVUE
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
	// #endif
});
</script>

<style scoped lang="scss"></style>
