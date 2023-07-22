<template>
	<view class="site-comp bg-color-white mx-32r pb-20r">
		<image class="site-icon" src="/static/logo.png" mode=""></image>
		<view class="site-top flex flex-a-c flex-j-b pl-28r pr-20r mb-24r">
			<text class="font-28r color-666">{{ data.statusName }}</text>
			<text class="font-28r color-666">{{ data.startTime }}至{{ data.endTime }}</text>
		</view>
		<view class="site-info px-28r flex flex-d-c mb-40r">
			<text class="font-36r color-base font-b mb-6r">{{ data.name }}</text>
			<text class="font-28r color-4a4a4a">{{ data.address }}</text>
		</view>
		<view class="site-tag px-28r flex flex-a-c mb-40r">
			<view class="project-area-tag font-24r px-12r flex flex-a-c flex-j-c mr-16r">{{ data.districtName }}</view>
			<view v-if="data.green === '1'" class="project-green-tag font-24r px-12r flex flex-a-c flex-j-c mr-16r">
				绿标工地
			</view>
			<view class="project-type-tag font-24r px-12r flex flex-a-c flex-j-c mr-16r">{{ data.typeName }}</view>
		</view>
		<view class="site-board mx-20r flex flex-a-c flex-j-b pt-24r pb-18r px-20r">
			<view class="flex flex-d-c">
				<text class="font-32r color-primary">{{ data.statistics.kuponos }}</text>
				<text class="font-24r color-999">总数</text>
			</view>
			<view class="flex flex-d-c">
				<text class="font-32r color-primary">{{ data.statistics.external }}</text>
				<text class="font-24r color-999">外转</text>
			</view>
			<view class="flex flex-d-c">
				<text class="font-32r color-primary">{{ data.statistics.internal }}</text>
				<text class="font-24r color-999">内转</text>
			</view>
			<view class="flex flex-d-c">
				<text class="font-32r color-primary">{{ data.statistics.invalid }}</text>
				<text class="font-24r color-999">异常</text>
			</view>
			<view class="flex flex-d-c">
				<text class="font-32r color-primary">{{ data.statistics.emission }}</text>
				<text class="font-24r color-999">排放量(方)</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
defineProps({
	data: {
		type: Object,
		default: () => ({})
	}
});
</script>

<style scoped lang="scss">
.site-comp {
	border-radius: 8rpx;
	overflow: hidden;
	
	.site-icon {
		width: 100rpx;
		height: 100rpx;
	}

	.site-top {
		height: 34px;
	}

	.site-state-executing {
		color: #007b40;
		background: linear-gradient(119deg, rgba(86, 187, 151, 0.37) 0%, rgba(86, 187, 151, 0) 100%);
	}

	.site-state-finish {
		color: #3767da;
		background: linear-gradient(119deg, rgba(72, 156, 255, 0.37) 0%, rgba(86, 139, 187, 0) 100%);
	}

	.site-state-expired {
		color: #eb6100;
		background: linear-gradient(119deg, rgba(235, 97, 0, 0.34) 0%, rgba(235, 97, 0, 0) 100%);
	}

	.site-state-stop {
		color: var(--text-color-666);
		background: linear-gradient(119deg, rgba(166, 176, 188, 0.37) 0%, rgba(182, 192, 204, 0) 100%);
	}

	.project-area-tag,
	.project-green-tag,
	.project-type-tag {
		height: 40rpx;
		border-radius: 4rpx;
	}

	.project-area-tag {
		color: #5d6eb6;
		background-color: #eff1fe;
	}
	.project-green-tag {
		color: #22a878;
		background-color: #d3fff0;
	}
	.project-type-tag {
		color: #1b5656;
		background-color: #e5eeeb;
	}

	.site-board {
		background: #f6f7fa;
		border-radius: 8rpx;
		box-sizing: border-box;
	}
}
</style>