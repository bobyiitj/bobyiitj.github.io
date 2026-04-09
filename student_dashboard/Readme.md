# Student Productivity Dashboard

A polished, responsive single-page web app for students to manage tasks, deadlines, attendance, and study time in one place.

This project matches the resume line:

> Built a student productivity dashboard with task management, deadline tracking, and study analytics using vanilla JS and Chart.js.

## Overview

The Student Productivity Dashboard is a dark mode-first productivity app designed to feel like a real product rather than a basic academic mini-project. It combines daily planning, countdown-based deadline visibility, a Pomodoro timer, attendance monitoring, and analytics into one clean dashboard experience.

The app is built with:

- HTML
- CSS
- Vanilla JavaScript
- localStorage
- Chart.js

## Features

### Dashboard Layout

- Responsive layout for desktop, tablet, and mobile
- Sidebar navigation with dedicated sections
- Premium card-based UI with smooth transitions and subtle shadows
- Live current date and time in the header

### Overview

- Quick stats for total tasks, completed tasks, deadlines, attendance, and weekly study hours
- “Today’s Focus” motivational section
- Progress rings and upcoming deadline snapshot

### Task Management

- Organized task board with:
  - To Do
  - In Progress
  - Completed
- Add, edit, delete, and move tasks between stages
- Filter by subject, priority, and status
- Task fields include:
  - title
  - subject
  - priority
  - due date
  - status
  - notes

### Deadline Tracking

- Separate deadline section for important academic milestones
- Live countdowns in days and hours
- Urgent and overdue visual highlighting
- Automatic sorting by nearest due date

### Pomodoro Timer

- Focus, short break, and long break modes
- Start, pause, and reset controls
- Custom durations from settings
- Tracks completed focus sessions
- Logs weekly study minutes using localStorage

### Attendance Tracker

- Add subjects with total and attended classes
- Auto-calculated attendance percentage
- Warning states for subjects below threshold
- Present and absent quick actions
- Subject-wise attendance chart using Chart.js

### Analytics

- Weekly study time chart
- Task completion doughnut chart
- Attendance performance chart
- Derived insights such as:
  - most productive day
  - pending workload
  - low attendance subjects

### Settings and Persistence

- Dark/light theme toggle with saved preference
- Saved user data through localStorage
- Clear all data option with confirmation
- Starter demo data on first load so the dashboard feels complete immediately

## Project Structure

```text
student_dashboard/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run

1. Download or clone the project.
2. Open `index.html` in your browser.
3. Start managing tasks, deadlines, attendance, and study sessions.

No build tools or frameworks are required.

## Data Storage

The app uses `localStorage` to persist:

- tasks
- deadlines
- attendance records
- study log
- Pomodoro stats
- theme preference
- user settings

All saved data reloads automatically when the page is refreshed.

## Design Notes

- Dark mode-first interface
- Rounded cards and layered spacing
- Smooth hover interactions and subtle animation
- Student-friendly premium aesthetic
- Empty states and toast feedback for better UX

## Tech Highlights

- Fully framework-free implementation
- Modular vanilla JavaScript rendering and state handling
- Chart.js integration for visual analytics
- Local-first persistence using browser storage
- Responsive CSS layout with custom theme variables

## Possible Future Improvements

- Drag-and-drop task cards
- Export/import dashboard data
- Notifications for approaching deadlines
- Subject-wise study session tracking
- Calendar integration

## Author Note

This project is suitable for:

- portfolio showcases
- frontend practice
- JavaScript DOM and state management demos
- resume projects focused on practical UI engineering
