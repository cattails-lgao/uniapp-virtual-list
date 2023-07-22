const DirectionType = {
	Up: -1,
	Down: 1
};

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

export default class Virtual {

	static viewCount = 20;

	range = {
		start: 0,
		end: Virtual.viewCount,
		padFront: 0,
		padBehind: 0
	}

	// 整个滚动区域的高度
	scrollHeight = 0;
	// 记录当前滚动偏移量
	scrollTop = 0;
	// 滚动方向
	direction = 0;
	// 通知外部range变化的函数
	onRangeUpdate = null;
	// 列表数据
	uniqueIds = [];
	// 第一次页面上渲染数据的总高度
	firstRangeTotalSize = 0;
	//  第一次页面上渲染数据的平均高度
	firstRangeAverageSize = 0;
	// 每项item的高度
	sizes = new Map();

	constructor({
		uniqueIds = [],
		windowHeight = 0
	} = {}, onRangeUpdate) {
		this.uniqueIds = uniqueIds;
		this.onRangeUpdate = onRangeUpdate;
		if (this.onRangeUpdate) this.onRangeUpdate(this.range);
	}
	
	isBehind () {
	  return this.direction === DirectionType.Down
	}
	
	isFront () {
	  return this.direction === DirectionType.Up
	}

	/**
	 * 更新list
	 */
	updateDateList(uniqueIds) {
		this.uniqueIds = uniqueIds;
		
		this.handleDataSourcesChange();
	}
	
	handleDataSourcesChange () {
	  let start = this.range.start
	
	  if (this.isFront()) {
	    start = start - Math.floor(Virtual.viewCount / 3);
	  } else if (this.isBehind()) {
	    start = start + Math.floor(Virtual.viewCount / 3);
	  }
	
	  start = Math.max(start, 0)
	
	  this.updateRange(this.range.start, this.getEndByStart(start))
	}

	// 存储每个item的高度
	saveSize(key, height) {
		this.sizes.set(key, height);
		if (this.sizes.size < Math.min(Virtual.viewCount, this.uniqueIds.length)) {
			this.firstRangeTotalSize = [...this.sizes.values()].reduce((acc, val) => acc + val, 0)
			this.firstRangeAverageSize = Math.round(this.firstRangeTotalSize / this.sizes.size)
		} else {
			delete this.firstRangeTotalSize
		}
	}

	/**
	 * 主要函数监听滚动
	 * @param {Object} e
	 */
	onScroll(data) {
		// 获取偏移量
		let offset = Math.floor(data.scrollTop);
		// 获取整个滚动区域的高度
		this.scrollHeight = data.scrollHeight;
		this.direction = this.getDirection(offset);

		if (this.direction === DirectionType.Up) {
			// #ifdef APP-NVUE
			this.handleDown();
			// #endif
			// #ifndef APP-NVUE
			this.handleUp();
			// #endif
		} else {
			// #ifndef APP-NVUE
			this.handleDown();
			// #endif
			// #ifdef APP-NVUE
			this.handleUp();
			// #endif
		}

		this.scrollTop = offset;
	}

	/**
	 * 向上滚
	 */
	handleUp() {
		const overs = this.getOverIndex();
		// #ifdef APP-NVUE
		if (overs > this.range.start) {
			return;
		}
		const start = Math.max(overs - Math.floor(Virtual.viewCount / 3), 0)
		this.checkRange(start, this.getEndByStart(start))
		// #endif
		// #ifndef APP-NVUE
		this.checkRange(overs, this.getEndByStart(overs))
		// #endif
	}

	/**
	 * 向下滚
	 */
	handleDown() {
		const overs = this.getOverIndex();
		// #ifdef APP-NVUE
		if (overs < this.range.start + Math.floor(Virtual.viewCount / 3)) {
			return;
		}
		// #endif
		this.checkRange(overs, this.getEndByStart(overs))
	}

	checkRange(start, end) {
		// #ifdef APP-NVUE
		const total = this.uniqueIds.length;

		if (total <= Virtual.viewCount) {
			start = 0;
			end = this.getLastIndex();
		} else if (end - start < Virtual.viewCount - 1) {
			start = end - Virtual.viewCount + 1;
		}
		
		if (this.range.start !== start) {
			this.updateRange(start, end);
		}
		// #endif
		
		// #ifndef APP-NVUE
		let startIndex = 0;
		
		if (start <= Virtual.viewCount) {
			startIndex = 0;
		} else {
			startIndex = start -  Math.floor(Virtual.viewCount / 3);
		}
		
		let endIndex = start +  Math.floor(Virtual.viewCount / 3) * 2;
		if(!this.uniqueIds[endIndex]) {
			endIndex = this.uniqueIds.length;
		}
		
		this.updateRange(startIndex, endIndex);
		// #endif
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
			return DirectionType.Down;
		} else {
			return DirectionType.Up;
		}
	}

	/**
	 * 获取当前所在位置
	 */
	getOverIndex() {
		/**
		 * 使用二分查找
		 * 存储每个item的高度
		 */
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
			offset = offset + (typeof indexSize === 'number' ? indexSize : this.getEstimateSize());
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
		const theoryEnd = start + Virtual.viewCount - 1;
		const truelyEnd = Math.min(theoryEnd, this.getLastIndex());
		return truelyEnd;
	}

	getLastIndex() {
		return this.uniqueIds.length - 1;
	}
}