# LifeAdmin — Your life, in order

A beginner-friendly full-stack personal deadline and document tracker built with HTML, CSS, JavaScript, Node.js, and Express.

## Features

- Create, view, edit, complete, and delete tasks.
- Store tasks persistently in a local JSON file.
- Track due dates, reminder dates, priorities, categories, and statuses.
- Link tasks to prerequisite tasks (a simple deadline chain).
- Search tasks and filter by status, priority, and category.
- Sort by due date, recently added, priority, or name.
- Overview cards for open, due today, completed, and overdue tasks.
- Completion progress bar.
- Reminder panel for reminders due today or earlier.
- Responsive layout for desktop, tablet, and mobile.
- Input validation and helpful empty/error states.

## Requirements

- Node.js 18+ recommended
- npm

## Run locally

1. Unzip the project.
2. Open a terminal inside the `lifeadmin` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

The app creates `data/tasks.json` on the first run and seeds it with example tasks. All task changes are saved to this file. To reset the sample data, stop the server, delete `data/tasks.json`, and start the server again.

## API routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | Server health check |

## Notes

- This version uses a JSON file instead of MongoDB to keep the project approachable while learning Node.js. A natural next step is to replace the JSON store with MongoDB.
- Reminders appear inside the app when it is open; this version does not send browser push notifications, emails, or SMS.
- The app is designed as a personal workspace and does not include user accounts or authentication.
- Do not store sensitive personal documents or private information in this demo. The current version stores task notes locally on the server without account-level access controls.
