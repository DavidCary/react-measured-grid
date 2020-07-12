| [react-measured-grid API](./index.md) | [MeasuredGrid](./MeasuredGrid.md) | [ScrollPosition](./ScrollPosition.md) | [PositionTracker](./PositionTracker.md) | [demos](./demos.md) | [repo](https://github.com/DavidCary/react-measured-grid) |

# Demos

The three demos highlight the key advantages of using this package:

  - smoother backwards scrolling
  - while keeping the benefits of a virtualized grid:
  
    - faster initial display times and
    - lower memory usage.

The three demos and their approaches are:

  - [Demo 1](./demo1/build) implements the grid
      as a [MeasuredGrid](./MeasuredGrid.md) from this package.
  - [Demo 1B](./demo1B/build) implements the grid
      as a Grid from the
      [react-virtualized](https://github.com/bvaughn/react-virtualized)
      package.
  - [Demo 1C](./demo1C) implements the grid as plain, static,
      non-virtualized HTML.

In comparison to Demo 1:

  - Demo 1B typically shows less smooth backward scrolling over
      rows that have not been previously displayed.
  - Demo 1C when displaying the maximum supported 137,000 rows
      can take a while (e.g. 20 seconds or longer)
      to build and display all of the rows
      and consumes multiple gigabytes of memory.

All three demos display the same data: a collection of quotes,
one pair per row.

