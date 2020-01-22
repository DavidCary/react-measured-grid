\| [react-measured-grid API](./api.md) |
[MeasuredGrid](./MeasuredGrid.md) |
[PositionTracker](./PositionTracker.md) |

# ScrollPosition API

The `ScrollPosition` class is used to describe a scrolling position in terms of:

  - a zero-based index
  - an alignment
  - an additional offset measured in pixels
  
Instances of the class are used with `MeasuredGrid` for horizontal scrolling or vertical scrolling.
For horizontal scrolling, the index is a column index.
For vertical scrolling, the index is a row index.

The alignment describes how the row or column are aligned with the view window.  Possible values are:
  - 'start': Aligns the start of the indexed item with the start of the view window.
  - 'center': Aligns the center of the indexed item with the center of the view window,
      (unless the indexed item more than fills the view window,
      in which case the the index item is aligned as with the 'start' alignment).
  - 'end': Aligns the end of the indexed item with the end of the view window.
  
The additional offset is a number of pixels of additional scrolling.
Positive values position the grid in the view window away from the grid's start and closer to its end.
Negative values position the grid in the view window closer to the grid's start and away from its end.

## Conversions

Conversion between a total scroll offset in pixels and a `ScrollPosition`
is mediated in part by a `PositionTracker` and its estimates.
Notably there is not a 1-to-1 correspondence between the two ways of representing a scrolling position.

Conversions generally favor in-range positions and `ScrollPosition`'s with an in-item offset.

An in-range position is one that specifies a position that is within the range of the size of the grid.
An in-range `scrollPosition` also uses an in-range index,
an index that is between 0 and one less than the number of items.
As special case, when there are zero items,
a 0 index is still considered as being in-range.

An in-item additional offset is one that allows the indexed item
to contain the view window's point of alignment.
When a position is at the border point between two items,
which of the two indexes to use for an in-item offset depends on the alignment:
the prior index if the alignment is 'end', the latter index if the alignment is 'start'. 

## Methods

The following are methods that are available for use:

**`ScrollPosition(index, alignment, offset)`**

  - The constructor, used with new.
  - The default values are respectively: 0, 'start', and 0.
  
The rest of the methods are instance methods.

**`copy()`**

  - Creates a new instance of `ScrollPosition`, but with the same values.

**`changeAlignment(alignment, positionTracker, viewSize)`**

  - Returns a new instance with the new alignment,
      but possibly changing the index and offset
      in order to represent the same total offset,
      absent certain exceptional situations.
  - `vewSize` is the size in pixels of the view window
      along the relevant axis.
      
**`getAlignment()`**

  - Returns the instance's alignment.
  
**`getAlignedOffset()`**

  - Returns the instance's additional offset in pixels.
 
**`getIndex()`**

  - Returns the instance's index.
     
**`getTotalOffset(positionTracker, viewSize)`**

  - Returns the instance's total scroll offset to its alignment point.
     
**`getTotalOffset(positionTracker, viewSize)`**

  - Returns the instance's total scroll offset to its alignment point.
  - `vewSize` is the size in pixels of the view window
      along the relevant axis.
     
**`getViewStartOffset(positionTracker, viewSize)`**

  - Returns what the offset of the start of the view window would be
      if the grid were positioned as specified by the instance.
  - `vewSize` is the size in pixels of the view window
      along the relevant axis.

**`incrementOffset(offsetDelta)`**

  - Returns a new instance with the additional offset changed by the amount of `offsetDelta`
      and without any other adjustments to the index or alignment.
      
**`update(index, alignment, offset)`**

  - Updates the instance with the supplied values.
  - Does not return a value.
      
**`updateFrom(scrollPosition)`**

  - Updates the instance with the supplied `scrollPosition`.
  - Does not return a value.
      
**`withContainingIndex(positionTracker, viewSize)`**

  - Returns a new instance that is in-range and in-item and
      represents the same scrolling position,
      unless the calling instance specified a position that was not in-range.
  - `vewSize` is the size in pixels of the view window
      along the relevant axis.
         

