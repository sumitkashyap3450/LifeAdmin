LifeAdmin — Your Life, In Order 📋

A beginner-friendly personal task and deadline management application built using HTML, CSS, JavaScript, Node.js, and Express.js.

LifeAdmin helps users organize their daily responsibilities, manage important deadlines, track progress, and stay on top of upcoming tasks through a simple and responsive interface.

✨ Features

* Task Management: Create, view, edit, complete, and delete tasks.
* Deadline Tracking: Set due dates and reminder dates.
* Priority Management: Organize tasks by priority — High, Medium, and Low.
* Category Management: Categorize tasks for better organization.
* Task Dependencies: Link tasks with prerequisite tasks.
* Search & Filters: Search tasks and filter by status, priority, and category.
* Sorting: Sort tasks by due date, priority, name, or recently added.
* Dashboard Overview: View open, completed, overdue, and today’s tasks.
* Progress Tracking: Monitor task completion through a progress bar.
* Reminder Panel: View reminders that are due today or overdue.
* Responsive Design: Works across desktop, tablet, and mobile devices.
* Data Persistence: Save task information in a local JSON file.

🛠️ Technologies Used

Technology	Purpose
HTML5	Application structure
CSS3	Styling and responsive design
JavaScript	Frontend functionality
Node.js	Backend runtime
Express.js	Backend framework
JSON	Local data storage

📁 Project Structure

LifeAdmin/
│
├── data/
│   └── tasks.json
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── server.js
├── package.json
├── package-lock.json
└── README.md

⚙️ Installation & Setup

Follow these steps to run LifeAdmin locally.

1. Clone the repository

git clone https://github.com/sumitkashyap3450/LifeAdmin.git

2. Navigate to the project directory

cd LifeAdmin

3. Install dependencies

npm install

4. Start the application

npm start

5. Open in browser

Visit:

http://localhost:3000

🔌 API Endpoints

Method	Endpoint	Description
GET	/api/tasks	Retrieve all tasks
POST	/api/tasks	Create a new task
PUT	/api/tasks/:id	Update an existing task
DELETE	/api/tasks/:id	Delete a task
GET	/api/health	Check server health

💾 Data Storage

LifeAdmin currently uses a local JSON file for storing task information.

* Task data is stored in data/tasks.json.
* The application automatically creates sample tasks on its first run.
* All task changes are saved to the JSON file.

🚀 Future Improvements

* User authentication and authorization.
* MongoDB database integration.
* Browser push notifications.
* Email reminders.
* Advanced analytics and productivity reports.
* Cloud deployment.

⚠️ Limitations

* This version does not include user authentication.
* Reminders are displayed inside the application.
* Browser push notifications, emails, and SMS are not supported.
* Task information is stored locally on the server.

Avoid storing sensitive personal information in this demo application.

👩‍💻 Author

GitHub: sumitkashyap3450

⸻

⭐ If you find this project useful, consider giving it a star!

LifeAdmin — Stay Organized. Stay Productive.
