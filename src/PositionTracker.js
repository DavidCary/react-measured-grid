// @flow

import {isFiniteNumber, isBetween, isFiniteNumberBetween} from './utils';

type BranchStats = {|
  measuredSize: number,
  unmeasuredCount: number,

|};

type Children = _Node | number | null;

class _Node {
  measuredSize: number = 0;
  unmeasuredCount: number = 0;
  lastAccumulatedIndex = 0;
  sumMeasuredSize: Array<number | null>;
  sumUnmeasuredCount: Array<number | null>;
  children: Array<Children>;

  constructor(unmeasuredCount: number, maxChildren: number) {
    this.unmeasuredCount = unmeasuredCount;
    this.sumMeasuredSize = Array(maxChildren).fill(0);
    this.sumUnmeasuredCount = Array(maxChildren).fill(0);
    this.children = Array(maxChildren).fill(null);
  }

  getTotalSize(unmeasuredSize: number): number {
    const totalSize = this.measuredSize +
          this.unmeasuredCount * unmeasuredSize;
    return totalSize;
  }

  updateBranchSums(sizeDelta: SizeDelta, branchIndex: number) {
    if (branchIndex < 0 || branchIndex >= this.children.length ||
          this.lastAccumulatedIndex < branchIndex ||
          (sizeDelta.measuredSize === 0 && sizeDelta.unmeasuredCount === 0)) {
      return;
    }
    this.sumMeasuredSize[branchIndex] += sizeDelta.measuredSize;
    this.sumUnmeasuredCount[branchIndex] += sizeDelta.unmeasuredCount;
    this.lastAccumulatedIndex = branchIndex;
  }      

}

const _private = {_Node}
export {_private};

type SizeDelta = {
  measuredSize: number,
  oldSize: number | null,
  size: number | null,
  unmeasuredCount: number,
};

export type ItemStats = {
  end: number,
  isMeasured: boolean,
  size: number,
  start: number,
};

// Default values
const DEFAULT_LOW_SIZE = 12;
const DEFAULT_UNMEASURED_SIZE = 18;
const DEFAULT_MAX_BRANCHES = 32;
const DEFAULT_MAX_LEAF_ITEMS = 32;

//Limits
const MIN_LOW_SIZE = 5;
const MIN_UNMEASURED_SIZE = 5;
const MAX_MAX_BRANCHES = 1024;
const MIN_MAX_BRANCHES = 2;
const MAX_MAX_LEAF_ITEMS = 1024;
const MIN_MAX_LEAF_ITEMS = 2;
const MAX_ITEM_COUNT = 134217727;  // = (2 ** 27) - 1; about 134 million;
const MAX_SIZE = 16777215; // = (2 ** 24) - 1; about 16 million;

class PositionTracker {
  _rootNode: _Node;
  _itemCount: number;
  _maxIndex: number;
  _lowSize: number | (index: number)=>number;
  _unmeasuredSize: number;
  _maxBranches: number
  _maxLeafItems: number;
  _branchCapacities: Array<number>;
  _rootLevel: number;

  constructor(
    itemCount: number =0,
    unmeasuredSize: number | void,
    lowSize: number | ((index: number)=>number) | void,
    maxBranches: number | void,
    maxLeafItems: number | void
  ) {
    //super();
    if (isFiniteNumberBetween(itemCount, 0, MAX_ITEM_COUNT)) {
      this._itemCount = Math.trunc(itemCount);
    } else {
      this._itemCount = 0;
    }
    this._maxIndex = this._itemCount ? this._itemCount - 1 : 0;
    this.setUnmeasuredSize(unmeasuredSize);
    this.setLowSize(lowSize);
    if (isFiniteNumberBetween(
          maxBranches, MIN_MAX_BRANCHES, MAX_MAX_BRANCHES)) {
      this._maxBranches = Math.trunc(maxBranches);
    } else {
      this._maxBranches = DEFAULT_MAX_BRANCHES;
    }
    if (isFiniteNumberBetween(maxLeafItems, MIN_MAX_LEAF_ITEMS,
          MAX_MAX_LEAF_ITEMS)) {
      this._maxLeafItems = Math.trunc(maxLeafItems);
    } else {
      this._maxLeafItems = DEFAULT_MAX_LEAF_ITEMS;
    }
    this.clearAllItems();
  }

  clearAllItems() {
    this._rootNode = new _Node(this._itemCount, this._maxBranches);
    let capacitiesResult = 
      this._calculateBranchCapacities(
        this._itemCount,
        this._maxBranches,
        this._maxLeafItems
      );
    this._branchCapacities = capacitiesResult[0];
    this._rootLevel = capacitiesResult[1];
  }

  clearItemSize(index: number): number | null {
    let sizeDelta: SizeDelta;
    if (isFiniteNumberBetween(index, 0, this._itemCount - 1)
          && Math.trunc(index) === index) {
      sizeDelta = this._setItemSize(this._rootNode, index, this._rootLevel,
            null, this._itemCount);
    } else {
      sizeDelta = {
            oldSize: 0, size: null, measuredSize: 0, unmeasuredCount: 0};
    }
    return sizeDelta.oldSize;
  }

  getContainingIndex(offset: number): number {
    let index = 0;
    if (isFiniteNumber(offset) && this._itemCount > 0) {
      const totalSize = this.getTotalSize();
      if (isBetween(offset, 0, totalSize)) {
        index = this._getContainingIndex(this._rootNode, offset,
            this._itemCount - 1, this._rootLevel);
      } else if (offset > totalSize) {
        index = this._maxIndex;
      } 
    }
    index = Math.max(0, Math.min(this._maxIndex, index));
    return index;
  }

  getItemCount(): number {
    return this._itemCount;
  }

  getItemLowSize(index: number): number {
    let size = this.getItemMeasuredSize(index);
    if (size === null) {
      if (typeof this._lowSize === 'number') {
        size = this._lowSize;        
      } else {
        size = this._lowSize(index);
      }
    }
    return size;
  }

  getItemMeasuredSize(index: number): number | null {
    let measuredSize: number | null = 0;
    if (isFiniteNumberBetween(index, 0, this._itemCount - 1)
          && Math.trunc(index) === index) {
      measuredSize = this._getItemMeasuredSize(this._rootNode, index,
            this._rootLevel);
    }
    return measuredSize;
  }

  getItemSize(index: number): number {
    let size = this.getItemMeasuredSize(index);
    if (size === null) {
      size = this.getUnmeasuredSize();
    }
    return size;
  }

  getItemStats(index: number): ItemStats {
    let itemStats: ItemStats;
    if (isFiniteNumber(index)) {
      index = Math.trunc(index);
      if (isBetween(index, 0, this._itemCount - 1)) {
        itemStats = this._getItemStats(this._rootNode, index,
            this._rootLevel);
        itemStats.end = itemStats.start + itemStats.size;
      } else if (index < 0) {
        itemStats = {start: 0, size: 0, end: 0, isMeasured: true}
      } else {
        const totalSize = this.getTotalSize();
        itemStats = {start: totalSize, size: 0, end: totalSize,
              isMeasured: true}
      }
    } else {
      itemStats = {start: 0, size: 0, end: 0, isMeasured: true}
    }
    return itemStats;
  }

  getLowSize(): number | (index: number)=>number {
    return this._lowSize;
  }

  getMaxBranches(): number {
    return this._maxBranches;
  }

  getMaxLeafItems(): number {
    return this._maxLeafItems;
  }

  getTotalSize(): number {
    const result = this._rootNode.getTotalSize(this.getUnmeasuredSize());
    return result;
  }

  getUnmeasuredSize(): number {
    let result = this._unmeasuredSize;
    return result;
  }

  setItemCount(itemCount: number) {
    itemCount = Math.trunc(itemCount);
    if (!isFiniteNumberBetween(itemCount, 0, MAX_ITEM_COUNT) ||
          itemCount === this._itemCount) {
      return;
    }
    if (itemCount === 0) {
      this._itemCount = 0;
      this._maxIndex = 0;
      this.clearAllItems();
      return;
    }
    const [newBranchCapacities, newRootLevel] = this._calculateBranchCapacities(
          itemCount, this._maxBranches, this._maxLeafItems);
    if (itemCount < this._itemCount) {
      this._reduceNodes(this._rootNode, itemCount - 1, this._itemCount - 1,
            this._rootLevel);
      this._releaseUnusedLevels(itemCount, newRootLevel);
    } else {
      this._expandNodes(this._rootNode, itemCount - 1, this._itemCount - 1,
            this._rootLevel);
      this._addNewLevels(itemCount, newRootLevel, newBranchCapacities);
    }
    this._itemCount = itemCount;
    this._maxIndex = this._itemCount - 1;
    this._branchCapacities = newBranchCapacities;
    this._rootLevel = newRootLevel;
  }

  setItemSize(index: number, size: number | null): number | null {
    let sizeDelta: SizeDelta;
    if (isFiniteNumberBetween(index, 0, this._itemCount - 1)
          && Math.trunc(index) === index &&
          (isFiniteNumberBetween(size, 0, MAX_SIZE) || size === null)) {
      sizeDelta = this._setItemSize(this._rootNode, index, this._rootLevel,
            size, this._itemCount);
    } else {
      sizeDelta = {oldSize: 0, size, measuredSize: 0, unmeasuredCount: 0};
    }
    return sizeDelta.oldSize;
  }

  setLowSize(lowSize: number | void | (index: number)=>number): void {
    if (isFiniteNumberBetween(lowSize, MIN_LOW_SIZE, this._unmeasuredSize) ||
          typeof lowSize === 'function') {
      this._lowSize = lowSize;
    } else {
      this._lowSize = DEFAULT_LOW_SIZE;
    }
  }

  setUnmeasuredSize(unmeasuredSize: number | void): void {
    if (isFiniteNumberBetween(unmeasuredSize, MIN_UNMEASURED_SIZE,
          MAX_SIZE)) {
      this._unmeasuredSize = unmeasuredSize;
    } else {
      this._unmeasuredSize = DEFAULT_UNMEASURED_SIZE;
    }
  }
  
  // Start of private methods

  _addNewLevels(newItemCount: number, newRootLevel: number, branchCapacities: Array<number>) {
    let lowerNode = this._rootNode;
    for (let lix = this._rootLevel; lix < newRootLevel; lix++) {
      const nbrMeasuredInLower = branchCapacities[lix + 1] - lowerNode.unmeasuredCount;
      const newUnmeasuredCount = Math.min(
            newItemCount, branchCapacities[lix + 2]) - nbrMeasuredInLower;
      this._rootNode = new _Node(newUnmeasuredCount, this._maxBranches);
      this._rootNode.measuredSize = lowerNode.measuredSize;
      this._rootNode.children[0] = lowerNode;
      lowerNode = this._rootNode;
    }
  }

  _calculateBranchCapacities(
    itemCount: number,
    maxBranches: number,
    maxLeafItems: number
  ): [Array<number>, number] {
    const branchCapacities = [];
    branchCapacities[0] = 1;
    branchCapacities[1] = maxLeafItems;
    branchCapacities[2] = maxLeafItems * maxBranches;
    let level = 2;
    let capacity = branchCapacities[2]
    while (capacity < itemCount) {
      capacity *= maxBranches;
      branchCapacities[++level] = capacity;
    }
    return [branchCapacities, level - 1];
  }

  _expandNodes(
    node: _Node, newIndex: number, oldIndex: number, level: number
  ): SizeDelta {
    const nodeCapacity = this._branchCapacities[level+1];
    if (newIndex >= nodeCapacity) {
      newIndex = nodeCapacity - 1;
    }
    const branchCapacity = this._branchCapacities[level];
    const oldBranchIndex = Math.trunc(oldIndex / branchCapacity);
    const oldNextIndex = oldIndex - oldBranchIndex * branchCapacity;
    let newBranchIndex = Math.trunc(newIndex / branchCapacity);
    let newNextIndex = newIndex - newBranchIndex * branchCapacity;
    const sizeDelta = {measuredSize: 0, unmeasuredCount: 0, size: null, oldSize: null};
    const branchesPerNode = level === 0 ?
          this._maxLeafItems : this._maxBranches;
    if (newBranchIndex >= branchesPerNode) {
      newBranchIndex = branchesPerNode - 1;
      newNextIndex = branchCapacity - 1;
    }
    const unmeasuredCountDelta = (newNextIndex - oldNextIndex) +
          (newBranchIndex - oldBranchIndex) * branchCapacity;
    const newExtendedNextIndex = unmeasuredCountDelta + oldNextIndex;
          
    sizeDelta.unmeasuredCount += unmeasuredCountDelta;
    node.unmeasuredCount += sizeDelta.unmeasuredCount;
    if (level > 0) {
      const nextNode = node.children[oldBranchIndex];
      if (nextNode instanceof _Node) {
        const subtreeDelta = this._expandNodes(
              nextNode, newExtendedNextIndex, oldNextIndex, level - 1);
      }
    }
    return sizeDelta;
  }
  
  _getBranchSize(branchStats: BranchStats): number {
    const size = branchStats.measuredSize +
          branchStats.unmeasuredCount * this._unmeasuredSize;
    return size;
  }

  _getBranchStats(branch: _Node | number | null,
        branchCapacity: number, nextIndex: number): BranchStats {
    let stats = {measuredSize: 0, unmeasuredCount: 0};
    if (branch === null) {
      stats.unmeasuredCount = Math.min(nextIndex, branchCapacity);
    } else if (typeof branch === 'number') {
      stats.measuredSize = branch;
    } else {
      stats.measuredSize = branch.measuredSize;
      stats.unmeasuredCount = branch.unmeasuredCount;
    }
    return stats;
  }

  _getContainingIndex(
    node: _Node, 
    offset: number,
    maxRemainderIndex: number,
    level: number
  ): number {
    let containingBranchIndex: number = 0;
    let containingBranchStart: number = 0;
    const branchCapacity = this._branchCapacities[level];
    let highIndex = node.lastAccumulatedIndex;
    let highStart = (node.sumMeasuredSize[highIndex] || 0) +
          (node.sumUnmeasuredCount[highIndex] || 0) * this._unmeasuredSize;
    let lowIndex = 0;
    let lowStart = 0;
    if (offset < highStart) {
      while (lowIndex + 1 < highIndex) {
        let middleIndex = Math.trunc((lowIndex + highIndex) / 2);
        let middleStart = (node.sumMeasuredSize[middleIndex] || 0) +
              (node.sumUnmeasuredCount[middleIndex] || 0) * this._unmeasuredSize;
        if (offset < middleStart) {
          highIndex = middleIndex;
          highStart = middleStart;
        } else {
          lowIndex = middleIndex;
          lowStart = middleStart;
        }
      }
      containingBranchIndex = lowIndex;
      containingBranchStart = lowStart;
    } else {
      let branchIndex = highIndex;
      let branchStart = highStart;
      let sumMeasuredSize = node.sumMeasuredSize[branchIndex];
      let sumUnmeasuredCount = node.sumUnmeasuredCount[branchIndex];
      let nextMaxRemainderIndex = maxRemainderIndex - branchIndex * branchCapacity;
      while (offset >= branchStart && nextMaxRemainderIndex >= 0) {
        let branchStats = this._getBranchStats(node.children[branchIndex],
              branchCapacity, nextMaxRemainderIndex);
        let branchSize = this._getBranchSize(branchStats);
        let branchEnd = branchStart + branchSize;
        if (branchIndex > node.lastAccumulatedIndex) {
          node.sumMeasuredSize[branchIndex] = sumMeasuredSize;
          node.sumUnmeasuredCount[branchIndex] = sumUnmeasuredCount;
          node.lastAccumulatedIndex = branchIndex;
        }
        sumMeasuredSize += branchStats.measuredSize;
        sumUnmeasuredCount += branchStats.unmeasuredCount;
        if (offset < branchEnd || nextMaxRemainderIndex < branchCapacity ||
              branchIndex + 1 === node.children.length) {
          break;
        }
        branchIndex++;
        branchStart = branchEnd;
        nextMaxRemainderIndex -= branchCapacity;
      }
      containingBranchIndex = branchIndex;
      containingBranchStart = branchStart;
    }
    let resultIndex = containingBranchIndex * branchCapacity;
    let branchTreeIndex: number;
    if (level === 0) {
      branchTreeIndex = 0;
    } else {
      let nextNode = node.children[containingBranchIndex];
      if (nextNode instanceof _Node) {
        let nextMaxRemainderIndex = maxRemainderIndex - resultIndex;
        branchTreeIndex = this._getContainingIndex(nextNode,
              offset - containingBranchStart, nextMaxRemainderIndex, level - 1);
      } else {
        branchTreeIndex = Math.trunc(
              (offset - containingBranchStart) / this._unmeasuredSize);
      }
    }
    resultIndex += branchTreeIndex;
    return resultIndex;
  }

  _getItemMeasuredSize(
    node: _Node, 
    index: number, 
    level: number
  ): number | null {
    let measuredSize: number | null;
    if (level === 0) {
      const notANode = node.children[index];
      measuredSize = notANode instanceof _Node ? null : notANode;
    } else {
      const branchCapacity = this._branchCapacities[level];
      const branchIndex = Math.trunc(index / branchCapacity);
      const priorCapacity = branchIndex * branchCapacity;
      const nextIndex = index - priorCapacity;
      let nextNode = node.children[branchIndex];
      if (typeof nextNode === 'number' || nextNode === null) {
        measuredSize = null;
      } else {
        measuredSize = this._getItemMeasuredSize(
              nextNode, nextIndex, level - 1);
      }
    }
    return measuredSize;
  }
            
  _getItemStats(
    node: _Node, 
    index: number, 
    level: number
  ): ItemStats {
    let itemStats: ItemStats;
    const unmeasuredSize = this._unmeasuredSize;
    const lastIndex = node.lastAccumulatedIndex;
    if (level === 0) {
      if (index > lastIndex) {
        let sumMeasuredSize: number = (node.sumMeasuredSize[lastIndex] || 0);
        let sumUnmeasuredCount: number = (node.sumUnmeasuredCount[lastIndex] || 0);
        for (let bix = lastIndex; bix <= index; bix++) {
          if (bix > node.lastAccumulatedIndex) {
            node.sumMeasuredSize[bix] = sumMeasuredSize;
            node.sumUnmeasuredCount[bix] = sumUnmeasuredCount;
            node.lastAccumulatedIndex = bix;
          }
          const measuredSize = node.children[bix];
          if (measuredSize === null) {
            sumUnmeasuredCount++;
          } else if (typeof measuredSize === 'number') {
            sumMeasuredSize += measuredSize;
          }
        }
      }
      const start: number = (node.sumMeasuredSize[index] || 0) +
            (node.sumUnmeasuredCount[index] || 0) * unmeasuredSize;
      const rawSize = node.children[index];
      const isMeasured = isFiniteNumber(rawSize);
      const size = isMeasured && typeof rawSize === 'number' ?
            rawSize : unmeasuredSize;
      itemStats = {start, size, end: 0, isMeasured};
    } else {
      const branchCapacity = this._branchCapacities[level];
      const branchIndex = Math.trunc(index / branchCapacity);
      const priorCapacity = branchIndex * branchCapacity;
      const nextIndex = index - priorCapacity;
      if (branchIndex > lastIndex) {
        let sumMeasuredSize: number = (node.sumMeasuredSize[lastIndex] || 0);
        let sumUnmeasuredCount: number = (node.sumUnmeasuredCount[lastIndex] || 0);
        let nextIndex2 = index - lastIndex * branchCapacity;
        for (let bix = lastIndex + 1; bix <= branchIndex; bix++) {
          const nextNode = node.children[bix - 1];
          const branchStats = this._getBranchStats(nextNode, branchCapacity,
                nextIndex2);
          sumMeasuredSize += branchStats.measuredSize;
          sumUnmeasuredCount += branchStats.unmeasuredCount;
          node.sumMeasuredSize[bix] = sumMeasuredSize;
          node.sumUnmeasuredCount[bix] = sumUnmeasuredCount;
          nextIndex2 -= branchCapacity;
        }
        node.lastAccumulatedIndex = branchIndex;
      }
      const nextNode = node.children[branchIndex];
      const branchStart: number = (node.sumMeasuredSize[branchIndex] || 0) +
            (node.sumUnmeasuredCount[branchIndex] || 0) * unmeasuredSize;
      if (typeof nextNode === 'number' || nextNode === null) {
        const start = unmeasuredSize * nextIndex;
        itemStats = {start, size: unmeasuredSize,
              end: 0, isMeasured: false};
      } else {
        itemStats = this._getItemStats(nextNode, nextIndex, level - 1);
      }
      itemStats.start += branchStart;
    }
    return itemStats;
  }
            
  _reduceNodes(
    node: _Node, newIndex: number, oldIndex: number, level: number
  ): SizeDelta {
    const branchCapacity = this._branchCapacities[level];
    const newBranchIndex = Math.trunc(newIndex / branchCapacity);
    const newNextIndex = newIndex - newBranchIndex * branchCapacity;
    const oldBranchIndex = Math.trunc(oldIndex / branchCapacity);
    const oldNextIndex = oldIndex - oldBranchIndex * branchCapacity;
    const sizeDelta = {measuredSize: 0, unmeasuredCount: 0, size: null, oldSize: null};
    if (level === 0) {
      for (let bix = newBranchIndex + 1; bix <= oldBranchIndex; bix++) {
        const measuredSize = node.children[bix];
        if (typeof measuredSize === 'number') {
          sizeDelta.measuredSize -= measuredSize;
          node.children[bix] = null;
        } else {
          sizeDelta.unmeasuredCount--;
        }
      }
    } else {
      for (let bix = newBranchIndex + 1; bix <= oldBranchIndex; bix++) {
        const branchNode = node.children[bix];
        if (branchNode instanceof _Node) {
          sizeDelta.measuredSize -= branchNode.measuredSize;
          sizeDelta.unmeasuredCount -= branchNode.unmeasuredCount;
          node.children[bix] = null;
        } else {
          const unmeasuredCount = bix === oldBranchIndex ?
                oldNextIndex + 1 : branchCapacity;
          sizeDelta.unmeasuredCount -= unmeasuredCount;
        }
      }
      const nodeOldNextIndex = newBranchIndex === oldBranchIndex ?
            oldNextIndex : branchCapacity - 1;
      const nextNode = node.children[newBranchIndex];
      if (nextNode instanceof _Node) {
        const subtreeDelta = this._reduceNodes(
              nextNode, newNextIndex, nodeOldNextIndex, level - 1);
        //node.sumMeasuredSize[newBranchIndex] += subtreeDelta.measuredSize;
        //node.sumUnmeasuredCount[newBranchIndex] += subtreeDelta.unmeasuredCount;
        sizeDelta.measuredSize += subtreeDelta.measuredSize;
        sizeDelta.unmeasuredCount += subtreeDelta.unmeasuredCount;
      } else {
        const unmeasuredCountDelta = nodeOldNextIndex - newNextIndex;
        sizeDelta.unmeasuredCount -= unmeasuredCountDelta;
      }
    }
    node.measuredSize += sizeDelta.measuredSize;
    node.unmeasuredCount += sizeDelta.unmeasuredCount;
    if (newBranchIndex < node.lastAccumulatedIndex) {
      node.lastAccumulatedIndex = newBranchIndex;
    }
    return sizeDelta;
  }
  
  _releaseUnusedLevels(newItemCount: number, newRootLevel: number) {
    for (let lix = this._rootLevel; lix > newRootLevel; lix--) {
      if (!(this._rootNode instanceof _Node)) {
        this._rootNode = this._rootNode.children[0];
      } else {
        this._rootNode = new _Node(newItemCount, this._maxBranches);
        break;
      }
    }
  }

  _setItemSize(
    node: _Node, 
    index: number, 
    level: number, 
    size: number | null,
    capacityCap: number
  ): SizeDelta {
    let sizeDelta: SizeDelta;
    if (level === 0) {
      const child = node.children[index];
      const oldSize = child instanceof _Node ? null : child;
      node.children[index] = size;
      sizeDelta = {
            size, oldSize, measuredSize: 0, unmeasuredCount: 0};
      if (isFiniteNumber(oldSize) && typeof oldSize === 'number') {
        sizeDelta.measuredSize -= oldSize;
      } else {
        sizeDelta.unmeasuredCount--;
        sizeDelta.oldSize = null;
      }
      if (isFiniteNumber(size) && typeof size === 'number') {
        sizeDelta.measuredSize += size;
      } else {
        sizeDelta.unmeasuredCount++;
      }
      if (oldSize !== size && node.lastAccumulatedIndex >= index) {
        node.lastAccumulatedIndex = index - Number(index > 0);
      }
    } else {
      const branchCapacity = this._branchCapacities[level];
      const branchIndex = Math.trunc(index / branchCapacity);
      const priorCapacity = branchIndex * branchCapacity;
      const nextIndex = index - priorCapacity;
      const nextCapacityCap = capacityCap - priorCapacity;
      let nextNode = node.children[branchIndex];
      if (!(nextNode instanceof _Node) && size === null) {
        sizeDelta = {size, oldSize: null, measuredSize: 0, unmeasuredCount: 0};
      } else {
        if (!(nextNode instanceof _Node)) {
          if (level === 1) {
            nextNode = new _Node(Math.min(
              this._branchCapacities[level],
              nextCapacityCap
            ), this._maxLeafItems);
          } else {
            nextNode = new _Node(Math.min(
              this._branchCapacities[level],
              nextCapacityCap
            ), this._maxBranches);
          }
          node.children[branchIndex] = nextNode;
        }
        sizeDelta = this._setItemSize(nextNode, nextIndex, level - 1,
              size, nextCapacityCap);
      }
      if ((sizeDelta.measuredSize !== 0 || sizeDelta.unmeasuredCount !== 0) &&
            node.lastAccumulatedIndex >= branchIndex) {
        node.lastAccumulatedIndex = branchIndex - Number(branchIndex > 0);
      }
    }
    node.measuredSize += sizeDelta.measuredSize;
    node.unmeasuredCount += sizeDelta.unmeasuredCount;
    return sizeDelta;
  }

}

export default PositionTracker;

