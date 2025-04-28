MP Monitoring
MP Monitoring is a full-stack web application designed to manage and monitor projects. It features a React frontend and a Node.js/Express backend with a PostgreSQL database.

Features
Frontend
Built with React and React Router.
User-friendly dashboards for MPs and public users.
Project creation, search, and detailed views.
Role-based access for MPs and public visitors.

Backend
Built with Node.js, Express, and PostgreSQL.
RESTful API for managing projects, media, and authentication.
File uploads for media and reports using Cloudinary.
Secure authentication with JWT and Redis for token blacklisting.

Installation
Prerequisites
Node.js (v18.x or higher)
PostgreSQL database
Cloudinary account for media storage

1. Clone the Repository
git clone https://github.com/<your-username>/mp-monitoring.git
cd mp-monitoring

2. Backend Setup
Navigate to the backend folder:
cd backend

Install dependencies:
npm install

Create a .env file in the backend folder:
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REDIS_URL=your_redis_url
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
ADMIN_ROLE=admin

Start the backend server:
npm start

3. Frontend Setup
Navigate to the frontend folder:
cd ../frontend

Install dependencies:
npm install

Start the React development server:
npm start

Usage
Open your browser and navigate to:

Frontend: http://localhost:3000
Backend API: http://localhost:5000/api
Use the admin credentials (set in .env) to log in and manage projects.

Deployment
Deploying to Render
Push your code to GitHub.
Create a Web Service on Render.
Use the following commands:

  Build Command:
    cd frontend && npm install && npm run build && cd ../backend && npm install

  Start Command:
    cd backend && node server.js

Add the required environment variables in Render.
Deploy and access your app at the Render-provided URL.

API Endpoints
Authentication
POST /api/auth/login - User login.
POST /api/auth/logout - User logout.
Projects
GET /api/projects - Fetch all projects.
POST /api/projects - Create a new project.
GET /api/projects/:id - Fetch project details.
PUT /api/projects/:id - Update a project.
DELETE /api/projects/:id - Delete a project.
Technologies Used
Frontend: React, React Router.
Backend: Node.js, Express, PostgreSQL, Cloudinary, Redis.
Deployment: Render.
License
This project is licensed under the ISC License.
