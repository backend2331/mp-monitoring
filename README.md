# MP Monitoring

MP Monitoring is a full-stack web application designed to manage and monitor projects. It includes a **React frontend** and a **Node.js/Express backend** with a PostgreSQL database.

---

## Features
- **Frontend**:
  - Built with React.
  - User-friendly interface for managing and viewing projects.
  - Routes for dashboards, project creation, and project details.

- **Backend**:
  - Built with Node.js and Express.
  - RESTful API for managing projects and authentication.
  - Serves the React app and handles file uploads.

- **Database**:
  - PostgreSQL for storing project and user data.

---

## Folder Structure
mp-monitoring/ ├── backend/ │ ├── server.js # Backend entry point │ ├── routes/ # API routes │ │ ├── auth.js │ │ ├── projects.js │ ├── uploads/ # Uploaded files │ ├── package.json # Backend dependencies │ ├── .env # Environment variables (not pushed to GitHub) │ └── other backend files ├── frontend/ │ ├── build/ # React production build (generated after npm run build) │ ├── src/ # React source code │ ├── package.json # Frontend dependencies │ └── .env # Frontend environment variables (optional) ├── .gitignore # Ignored files and folders ├── README.md # Project documentation └── package.json # Root-level scripts and dependencies


---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/mp-monitoring.git
cd mp-monitoring

2. Set Up the Backend
Navigate to the backend folder:
cd backend

Install dependencies:
npm install

Create a .env file in the backend folder and add the following:
DATABASE_URL=your_postgresql_connection_string

3. Set Up the Frontend
Navigate to the frontend folder:
cd ../frontend

Install dependencies:
npm install

Build the React app:
npm run build

Running the Application Locally
Navigate to the root directory:
cd ..

Start the application:
npm start

This will:

Start the backend server.
Serve the React app.
Open your browser and visit:
http://localhost:5000

Deployment
Deploying to Render
Push your code to GitHub.

Create a Web Service on Render:

Build Command:
cd frontend && npm install && npm run build && cd ../backend && npm install

Start Command:
cd backend && node server.js

Add the DATABASE_URL environment variable in Render.
Deploy the service and access your app at the Render-provided URL.

Environment Variables
The following environment variables are required:

Backend (backend/.env)
DATABASE_URL=your_postgresql_connection_string

API Endpoints
Authentication
POST /api/auth/login: User login.
POST /api/auth/register: User registration.
Projects
GET /api/projects: Get all projects.
POST /api/projects: Create a new project.
GET /api/projects/:id: Get project details.
Technologies Used
Frontend: React, React Router.
Backend: Node.js, Express, Multer.
Database: PostgreSQL.
Deployment: Render.
License
This project is licensed under the ISC License.


---

### **How to Use This**
1. Save this content in a file named `README.md` in the root of your project.
2. Replace `<your-username>` and `your_postgresql_connection_string` with your actual values.
3. Push the updated `README.md` to GitHub.

Let me know if you need further assistance!---

### **How to Use This**
1. Save this content in a file named `README.md` in the root of your project.
2. Replace `<your-username>` and `your_postgresql_connection_string` with your actual values.
3. Push the updated `README.md` to GitHub.

Let me know if you need further assistance!