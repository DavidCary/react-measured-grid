// @flow
// Copyright (c) 2020, David Cary, MIT License

import PositionTracker from './PositionTracker.js';

export type ScrollAlignment = 'start' | 'center' | 'end';

class ScrollPosition {
  _index: number;
  _alignment: ScrollAlignment;
  _offset: number;

  constructor(
    index: number =0,
    alignment: ScrollAlignment ='start',
    offset: number=0
  ) {
    if (index < 0) {
      index = 0;
    }
    this._index = index;
    if (['start', 'center', 'end'].indexOf(alignment) === -1) {
      alignment = 'start';
    }
    this._alignment = alignment;
    this._offset = offset;
  }

  copy(): ScrollPosition {
    const result = new ScrollPosition(this._index, this._alignment,
          this._offset);
    return result;
  }

  /**
   * Keeps the same item index,
   * but changes alignment, then adjusts offset
   * in order to produce an equivalent total offset
   */
  changeAlignment(
    alignment: ScrollAlignment,
    positionTracker: PositionTracker,
    viewSize: number
  ): ScrollPosition {
    const totalOffset = this.getTotalOffset(
          positionTracker, viewSize);
    const newPosition = new ScrollPosition(
          this._index, alignment, this._offset);
    const newTotalOffset = newPosition.getTotalOffset(
          positionTracker, viewSize);
    const originalAlignment = this.getAlignment();
    let viewDelta = 0;
    if (alignment === 'end' && originalAlignment === 'start') {
      viewDelta = viewSize;
    } else if ((alignment === 'center' && originalAlignment === 'start') ||
          (alignment === 'end' && originalAlignment === 'center')) {
      viewDelta = viewSize / 2;
    } else if ((alignment === 'start' && originalAlignment === 'center') ||
          (alignment === 'center' && originalAlignment === 'end')) {
      viewDelta = - viewSize / 2;
    } else if (alignment === 'start' && originalAlignment === 'end') {
      viewDelta = - viewSize;
    }
    const offsetDelta = totalOffset + viewDelta - newTotalOffset;
    newPosition._offset += offsetDelta;
    return newPosition;
  }

  getAlignment(): ScrollAlignment {
    return this._alignment;
  }

  getAlignedOffset(): number {
    return this._offset;
  }

  getIndex(): number {
    return this._index;
  }

  /**
   * returns the corresponding offset in the context of the arguments
   */
  getTotalOffset(positionTracker: PositionTracker,
        viewSize: number): number {
    const itemStats = positionTracker.getItemStats(this._index);
    let offsetDelta = 0;
    if (this._alignment === 'center') {
      offsetDelta = Math.min(itemStats.size, viewSize) / 2;
    } else if (this._alignment === 'end') {
      offsetDelta = itemStats.size;
    }
    const totalSize = positionTracker.getTotalSize();
    const rawTotalOffset = itemStats.start + offsetDelta + this._offset;
    const totalOffset = Math.max(0, Math.min(rawTotalOffset, totalSize));
    return totalOffset;
  }

  getViewStartOffset(
    positionTracker: PositionTracker,
    viewSize: number
  ): number {
    let offsetDelta = 0;
    const totalOffset = this.getTotalOffset(positionTracker, viewSize);
    if (this._alignment === 'center') {
      offsetDelta = Math.min(0, - viewSize / 2);
    } else if (this._alignment === 'end') {
      offsetDelta = - viewSize;
    }
    const totalSize = positionTracker.getTotalSize();
    let viewStartOffset = Math.max(0, Math.min(
          totalOffset + offsetDelta, totalSize));
    return viewStartOffset;
  }

  incrementOffset(offsetDelta: number): ScrollPosition {
    if (isNaN(offsetDelta) || !isFinite(offsetDelta)) {
      offsetDelta = 0;
    }
    const result = new ScrollPosition(this._index, this._alignment,
          this._offset + offsetDelta);
    return result;
  }

  update(
    index: number =0,
    alignment: ScrollAlignment ='start',
    offset: number=0
  ): void {
    this._index = index;
    this._alignment = alignment;
    this._offset = offset;
  }

  updateFrom(
    scrollPosition: ScrollPosition,
  ): void {
    this._index = scrollPosition.getIndex();
    this._alignment = scrollPosition.getAlignment();
    this._offset = scrollPosition.getAlignedOffset();
  }

  /**
   * Produces a new ScrollPosition that has the same alignment, but
   * changes the item index and alignment offset so that the total
   * offset is the same and is within the item of the new index.
   *
   * If the original total offset was outside the extent of the
   * positionTracker, the new ScrollPosition points to the start of the
   * first item or the end of the last item, which ever is nearest.
   *
   * If the total offset is on the boundary of two items one of the items
   * is chosen so that with a preserved alignment of 'start' or 'end',
   * the offset is zero.  If the alignment is 'middle', the sign of the offset
   * is preserved.
   */
  withContainingIndex(
    positionTracker: PositionTracker,
    viewSize: number
  ): ScrollPosition {
    let newPosition: ScrollPosition;
    let totalOffset = this.getTotalOffset(
          positionTracker, viewSize);
    if (totalOffset < 0) {
      totalOffset = 0;
    }
    const totalSize = positionTracker.getTotalSize();
    if (totalOffset > totalSize) {
      totalOffset = totalSize;
    }
    if (totalOffset === 0) {
      newPosition = new ScrollPosition(0, 'start', 0);
    } else if (totalOffset === totalSize) {
      newPosition = new ScrollPosition(
            positionTracker.getItemCount() - 1, 'end', 0);
    } else {
      const containingIndex = positionTracker.getContainingIndex(totalOffset);
      newPosition = new ScrollPosition(
            containingIndex, 'start', 0);
      const newTotalOffset = newPosition.getTotalOffset(
            positionTracker, viewSize);
      newPosition._alignment = this._alignment;
      let offsetDelta = totalOffset - newTotalOffset;
      if (offsetDelta === 0) {
        if (this._alignment === 'end' &&
            containingIndex > 0) {
          newPosition._index--;
          newPosition._alignment = 'end';
        } else if (this._alignment === 'center') {
          newPosition._alignment = 'center';
          if (this._offset > 0 && containingIndex > 0) { 
            newPosition._index--;
          }
        }
      }
      const revisedTotalOffset = newPosition.getTotalOffset(
          positionTracker, viewSize);
      offsetDelta = totalOffset - revisedTotalOffset;
      newPosition._offset = offsetDelta;
    }
    return newPosition;
  }

}

export default ScrollPosition;
