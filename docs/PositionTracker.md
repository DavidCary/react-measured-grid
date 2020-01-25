| [react-measured-grid API](./api.md) | [MeasuredGrid](./MeasuredGrid.md) | [ScrollPosition](./ScrollPosition.md) | [PositionTracker](./PositionTracker.md) | [demo](./demo1/build) | [repo](https://github.com/DavidCary/react-measured-grid) |

# PositionTracker API

The `PositionTracker` class records measured sizes of items,
and provides various estimates of sizes of items.
With modest efficiency it also provides estimates of the total scrolling offset
of an item within the entire grid.

The sizes that are tracked can be either the heights of rows or the widths of columns.
An item is identified by its zero-based index.


## Methods

The following are methods that are available for use:

**`PositionTracker(itemCount, unmeasuredSize, lowSize, maxBranches, maxLeafItems)`**

  - The constructor, used with new.
  - `itemCount` is the number of items being tracked
      (the number of rows or columns in the grid).
      The default value is 0.
  - `unMeasuredSize` is the number of pixels used
      to estimate the size of unmeasured items
      when calculating the total scroll offset of an item
      or when calculating the total size of the grid.
      The default value is 18.
  - `lowSize` is the number of pixels used to estimate
      how much space an unmeasured item will take up when
      determining how many rows should be put in the DOM
      to fill the view window.
      It can also be a function that maps an item index
      to a number that is such an estimate.
      The default value is 12.
  - The last two parameters are internal performance tuning parameters.
    `PositionTracker` builds a tree structure over its recorded size measurements,
    in order to more efficiently calculate total scrolling offsets for an item.
    The default values are usually satisfactory for most use cases.
    - `maxBranches` is the maximum number of branches from a node in all but the
         bottom level of the tree.
         The default value is 32.
    - `maxLeafItems` is the maximum number of items recorded in a node
         that is at the bottom level of the tree.
         The default value is 32.
         
The rest of the methods are instance methods.

**`clearAllItems()`**         

  - Marks all items as being unmeasured; any recorded measurements are forgotten.
  
**`clearItemSize(index)`**

  - Marks the item as being not measured.
  - Returns the old measurement size in pixels or null if the item was not measured.
  
**`getContainingIndex(offset)`**
  
  - Returns the index of the item that contains the given offset,
      or the nearest such item if the offset is not in-range.
  - `offset` is a total scrolling offset.

**`getItemCount()`**

  - Returns the number of items being tracked, the number of rows or columns in the grid.
  
**`getItemLowSize(index)`**

  - Returns the lowSize estimate for an item.
  
**`getItemMeasuredSize(index)`**

  - Returns the item's measured size, or null if the item is not currently measured.
  
**`getItemSize(index)`**

  - Returns the item's measured size,
      or an estimate of its size if the item is unmeasured.
  
**`getItemStats(index)`**

  - Returns an object with the following properties that describe the indexed item:
    - 'start': The estimated total scrolling offset, as a number of pixels, to the item's start.
    - 'size': The measured or estimated size of the item, as a number of pixels.
    - 'end': The estimated total scrolling offset, as a number of pixels, to the item's end.
    - 'isMeasured': A boolean indicating whether the size is a measured size.
  
**`getLowSize()`**

  - Returns the lowSize value that applies to all items,
      either a number or a function.
  
**`getMaxBranches()`**

  - Returns the maxBranches value used by the constructor.
  
**`getMaxLeafItems()`**

  - Returns the maxLeafItems value used by the constructor.
  
**`getTotalSize()`**

  - Returns total scrolling offset to the end of the last item;
      the total size of the grid.
      
**`getUnmeasuredSize()`**

  - Returns the unmeasuredSize value used by the constructor.
  

**`setItemCount(itemCount)`**

  - Sets the number of items being tracked,
      typically reflecting a change in the number of items in the grid.
  - Does not return a value.
  
**`setItemSize(index, size)`**

  - Sets the measured size of an item.
  - Returns the old measured size, or null if the item was not measured.
  
**`setLowSize(lowSize)`**

  - Sets the lowSize value that is applicable to all items.
  - `lowSize` can be a number or a function that maps an index to a lowSize estimate.
      The default value is 30.
  - Does not return a value.
  
**`setUnmeasuredSize(index, size)`**

  - Sets the value used to estimate the size of unmeasured items
      when calculating the total scroll offset of an item
      or when calculating the total size of the grid.
      The default value is 30.
  - Does not return a value.

