| [react-measured-grid API](./api.md) | [MeasuredGrid](./MeasuredGrid.md) | [ScrollPosition](./ScrollPosition.md) | [PositionTracker](./PositionTracker.md) | [demo](./demo1/build) | [repo](https://github.com/DavidCary/react-measured-grid) |

# react-measured-grid API

`react-measured-grid` displays a virtualized grid
with dynamically measured rows and columns in a scrollable viewing window.

The package provides three commonly used classes:

  - [`MeasuredGrid`](./MeasuredGrid.md)
  - [`ScrollPosition`](./ScrollPosition.md)
  - [`PositionTracker`](./PositionTracker.md)

`MeasuredGrid` is a React component and is the lead class of the package.

`ScrollPosition` is a helper class that specifies a positioning of the
grid within the view window.

`PositionTracker` is a helper class than tracks
measured sizes and various estimates of sizes of rows,
and with modest efficiency provides estimates of the
offset of a row within the entire grid.

