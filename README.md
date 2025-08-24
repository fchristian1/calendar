# Calendar Component

The `Calendar` component is a comprehensive React component that provides an interactive calendar view. It is composed of several subcomponents and functions that work together to deliver a dynamic and customizable calendar interface. Below is an overview of its structure and functionality:

## Main Components

### 1. `Calendar`

- The main component that manages the entire calendar and navigation.
- Uses `useState` hooks to manage the state for the year, active menus, and colors.
- Provides navigation between the calendar view and settings.
- Allows creating screenshots for the entire year or individual months.

### 2. `CalendarGrid`

- Displays the monthly view, including week and day grids.
- Supports the display of holidays, vacation days, and workdays.
- Utilizes the `html2canvas` library to create screenshots of the calendar.
- Dynamically generated grids are based on weekdays and months.

### 3. `CalendarHeader`

- Displays a legend for calendar colors, such as holidays, vacations, and special workdays.

### 4. `CalendarSettings`

- Allows customization of calendar colors and other settings.
- Uses a color picker component (`ColorSelector`) for interactive color selection.

### 5. `ColorSelector`

- A modal component that enables color selection.
- Supports drag-and-drop for positioning.

## Functions

- **`getISOWeekNumber`**: Calculates the ISO week number for a given date.
- **`getMonthGridStartMonday`**: Determines the starting point of a month grid that begins on a Monday.
- **`takeshot`**: Creates screenshots of the calendar or individual months.

## State and Data

- **`state`**: Contains information about active menus and data such as workdays.
- **`colors`**: Defines the colors for various calendar categories (e.g., holidays, vacations).
- **`shot`**: Controls the screenshot functionality.

## Features

- Supports dynamic adjustments based on user input.
- Provides a clear separation between presentation (`CalendarGrid`) and logic (`Calendar`).
- Uses TailwindCSS classes for styling.

## Summary

The `Calendar` component is modular and provides a flexible foundation for displaying and interacting with calendar data. It is ideal for applications requiring a visual representation of schedules or events.
