\| [react-measured-grid API](./api.md) |
[PositionTracker](./PositionTracker.md) |
[ScrollPosition](./ScrollPosition.md) |

# MeasuredGrid API

`MeasuredGrid` is a React component.
It creates the view window,
populates the virtual grid,
and is the central point
for handling scrolling
and other events and updates.

## Props

| Name | Required | Description |
| :--- | :------: | :---------- |
| columnClassName | N |  Provides a string of class names for a cell based on its column index. The value can be a string, a function that maps a column index to a string, or an array of strings. If an array is provided, and its length is non-zero but less than the number of columns in the grid, the last value of the array will be applied to the subsequent columns also. |
| columnCountInitial | N |  The number of columns initially in the grid. If the `columnTracker` prop is also given, its number of columns takes precedence. If neither is provided, a default value of 1 is used. |
| columnPositionInitial | N |  A `ScrollPosition` instance that specifies the initial horizontal positioning of the grid within the view window. The default value positions the view at the start of the rows. |
| columnStyle | N |  Provides an object with properties consisting of React styles to augment the base style of a cell, depending on the index of the column.  The value can be a single object which is applied to all columns, a function that maps a column index to an object of React styles, or an array of React style objects. If an array is provided, and its length is non-zero but less than the number of columns in the grid, the last value of the array will be applied to the subsequent columns also. |
| columnTracker | N | A `PositionTracker` instance. If provided, its number of rows takes precedence over the `columnCountInitial` prop if it is also provided. |
| columnWidth | N | Provides for each column a column width specifier that can be a number (of pixels), a CSS width value (e.g. "10ex"), or the null value. The prop value can be such a width specifier that applies to all columns, a function that maps a column index to such a width specifier, or an array of such width specifiers. If an array is provided, and its length is non-zero but less than the number of columns in the grid, the last value of the array will be applied to the subsequent columns also. Any non-null value for a column will be applied to the inline style of each cell in the column. If a column is given a null value or if the prop is not given, selector-based CSS should specify a width for the column. |
| dataArray | N |  An array of row arrays that provide values for each of the cells in the grid. Cell values from the array are converted to string values using the String() function, except that undefined values are converted to an empty string. With the 'dataArray' prop, a grid can be shown without giving `MeasuredGrid` any children. |
| itemKey | N |  A function that maps a row index and column index to a cell key value. The key value helps React keep track of whether a row or cell needs to be re-rendered in the DOM, regardless of whether its relative position in the rendered DOM has changed. The default key is a string consisting of the row index and column index, separated by a comma and enclosed in parentheses, without any spaces, e.g. '(5:3)'. For a row key, the string 'row' is passed as the column index value. For the default row key, an example result is '(5:row)'. |
| overscanRowCount | N | A number of additional rows to add to the DOM, both before and after those that `MeasuredGrid` estimates are necessary to fill the view window.  The default value is 1. Larger values increase the amount of work needed in a single render cycle, but can help avoid some subsequent full render cycles for small increments of scrolling, as is common in browser animations of scrolling. Larger values can also help reduce the risk of MeasuredGrid underestimating how many rows it takes to fill the view window, and thus avoid having to perform an additional render cycle before updating the screen display. |
| rowCountInitial | N | The number of rows initially in the grid. If the `dataArray` prop is also given, its length takes precedence. If the `rowTracker` prop is also given, its number of rows takes even higher precedence. If none of those are provided as props, a default value of 0 is used. |
| rowPositionInitial | N | A `ScrollPosition` instance that specifies the initial vertical positioning of the grid within the view window. The default value positions the top of the grid at the top of the view window. |
| rowTracker | N | A `PositionTracker` instance. If provided, its number of rows takes precedence over the `rowCountInitial` prop and the length of the `dataArray` prop. |
| viewId | N | A string that becomes the value of the id attribute for the DIV element that serves as the view window. |
| viewClassName | N | A string of additional class names for the DIV element that serves as the view window, applied in addition to the default class name 'grid-view' |
| viewHeightInitial | N | A number of pixels or a string with a CSS height value that specifies the initial height of the view window. |
| viewStyle | N | A react style object that provides additional inline style for the DIV element that serves as the view window. |
| viewWidthInitial | N |  A number of pixels or a string with a CSS width value that specifies the initial width of the view window. |

## Element Class Names

Within the DOM, a MeasuredGrid uses DIV elements in various roles.  Those DIV elements are given the following class names based on their role, in addition to any class names specified in the props:

  - view window: 'grid-view'
  - grid base, the usually lightly populated grid; rarely needs additional styling: 'grid-base'
  - rendered rows, contains the rows that are populated in the DOM; rarely needs additional styling: 'grid-rendered'
  - row: contains the cells for a row: 'grid-row'
    -- A row is also given a class name of 'grid-row-even' or 'grid-row-odd' 
       depending on whether the row's zero-based index is even or odd.
  - cell: contains content at the intersection of a row and a column: 'grid-cell'

When using props to add styling to any of these elements, it is important to not disrupt or interfere
with the element's existing styling.

Also, rows and cells should not be given any margins,
since the current logic of `MeasuredGrid` assumes
that adjacent rows and adjacent cells within a row
are displayed without a gap between them.
Similarly, styling on cell contents should not have margins that extend beyond the cell.
If a visual separation is desired, that can be accomplished by styling cells with padding
or by filling cells with a DIV element that is separately styled.

## Children

An instance of `MeasuredGrid` can be created without any children if the `dataArray` prop is provided.
In that case, `MeasuredGrid` will create cells from the `dataArray` value.

Otherwise, a common approach is to give `MeasuredGrid` a single child that is a function
that returns a cell's contents and takes three arguments:

  - rowIndex: the zero-based row index of the cell
  - columnIndex: the zero-based column index of the cell
  - isScrolling: a boolean indicating whether `MeasuredGrid` is handling scrolling events in quick succession,
      typically because of a browser animation of scrolling.
  
The function can reference any resource to build the cell contents,
including the array that was passed as the `dataArray` prop.
Preferrably the data from those resources should be accessible with minimal latency.

## Get Actions

The `getActions` callback prop is called from the  `MeasuredGrid` life-cycle methods
componentDidMount and componentWillUnmount.

When called from the componentDidMount, it is called with two arguments:
  - The `MeasuredGrid` instance.
  - An object with properties corresponding to the two functions described it the next section.
    If called, these functions should be called as simple functions, not as methods.
    The reference to the instance of `MeasuredGrid` is built-in.
    - 'getScrollPositions': a function that calls the instance's method with that name and returns its value.
    - 'positionAt': a function that calls the instance's method of that name and like the method, does not return a value.
    
When called from componentWillUnmount, the callback is called with two arguments:
  - The `MeasuredGrid` instance.
  - An object with a single own property: 'unmount' with a value of null.
    
## Methods

The following `MeasuredGrid` instance methods are available for use:

  - getScrollPositions()
    - retrieves information about the current position of the grid within the view window
    - takes no arguments
    - returns an object with the following properties:
      - 'column': a ScrollPosition instance for the current horizontal scroll position
      - 'isScrolling': a boolean indicating whether a scrolling operation,
          typically browser driven animation, appears to be in progress
      - 'row': a ScrollPosition instance for the current vertical scroll position
  - PositionAt(rowPosition, columnPosition)
    - positions the grid within the view window
    - takes the following arguments, both optional:
      - rowPosition: a ScrollPosition instance indicating how to vertically reposition the grid
      - columnPosition: a ScrollPosition instance that indicates how to horizontally reposition the grid
    - does not return a value
      
  

