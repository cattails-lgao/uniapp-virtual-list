<template>
	<view class="item" :class="'item_' + item.id" :style="{ height: item.height + 'px' }">{{ item.value }}</view>
</template>

<script setup>
import { getCurrentInstance, inject, onBeforeUnmount, onMounted, onUpdated } from 'vue';
import { SIZE_UPDATE_KEY } from './costant'
const props = defineProps({
	item: {
		type: Object,
		default: () => ({})
	}
});

let resizeObserver = null;

const sizeUpdateInject = inject(SIZE_UPDATE_KEY);

onMounted(() => {
	resizeObserver = uni.createIntersectionObserver();
	resizeObserver.relativeTo('.scroll-view').observe('.item_' + props.item.id, (res) => {
		sizeUpdateInject.update(props.item.id, res.boundingClientRect.height);
	});
});

onBeforeUnmount(() => {
	if (resizeObserver) {
		resizeObserver.disconnect()
		resizeObserver = null;
	}
});
</script>

<style scoped lang="scss">
.item {
	border-bottom: 1rpx solid #000;
}
</style>
