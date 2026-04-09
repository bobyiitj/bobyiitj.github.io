# Pulse Habit Tracker

A visually polished habit tracking web app with a GitHub-style 30-day heatmap, streak tracking, daily analytics, and `localStorage` persistence.

## Preview

Pulse Habit Tracker helps users build consistency by letting them:

- Add and manage habits
- Mark daily completions
- Track current and longest streaks
- View a 30-day GitHub-inspired heatmap
- Monitor progress with simple analytics

The project is built with plain HTML, CSS, and Vanilla JavaScript, so it runs directly in the browser without any backend or framework.

## Features

- Add new habits with:
  - Habit name
  - Optional category
  - Custom color accent
- Validation to prevent empty habit names
- Mark or unmark today's completion
- Completion history stored by date
- 30-day heatmap with intensity levels based on total daily completions
- Hover tooltip showing date and completion count
- Current streak and longest streak for each habit
- Progress analytics including:
  - Total habits
  - Total completions
  - Completion rate
  - Best performing habit
  - Weekly summary cards
  - Mini visual bars
- Edit and delete habits with instant UI updates
- Delete confirmation prompt
- Search and filter habits
- Responsive dark glassmorphism UI
- Starter sample habits on first load only
- Data persistence using `localStorage`

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- `localStorage`

## Project Structure

```text
Pulse-Habit-Tracker/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How It Works

### Habit Data Structure

Each habit is stored in `localStorage` using a simple object structure:

```js
{
  id: "unique-id",
  name: "Read 20 minutes",
  createdAt: "2026-04-09T10:30:00.000Z",
  category: "Mindset",
  color: "#38bdf8",
  history: {
    "2026-04-09": true,
    "2026-04-08": true
  }
}
```

### Persistence

- All habits are saved in `localStorage`
- The app restores saved habits on page reload
- Starter habits appear only when `localStorage` is empty

## Getting Started

No installation is required.

1. Clone or download this repository
2. Open the project folder
3. Double-click `index.html`

Or open `index.html` in any modern browser.

## Usage

1. Add a habit using the form
2. Choose an optional category and accent color
3. Mark habits complete each day
4. Watch streaks and analytics update instantly
5. Use search or filter controls to find habits quickly
6. Review the 30-day heatmap to spot consistency patterns

## UI Highlights

- Modern dark theme
- Glassmorphism-inspired panels
- Responsive layout for desktop and mobile
- Smooth hover and click interactions
- Heatmap as the main visual focus

## Possible Improvements

- Export and import habit data
- Custom date history editing
- Habit notes or goals
- Theme switching
- Charts for monthly trends

## Resume Description

Built a habit tracking app featuring a GitHub-style contribution heatmap, streak tracking, and daily analytics using HTML, CSS, JavaScript, and localStorage.

## License

This project is open for personal use and learning. You can add your preferred license before publishing to GitHub.
