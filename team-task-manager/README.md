# Team Task Manager

A full-stack MERN-style team task management app with JWT authentication, role-based access control, project management, task tracking, and a dashboard for monitoring work status.

## Features

- JWT-based signup and login
- Password hashing with `bcryptjs`
- Role-based access for `admin` and `member`
- Project creation, update, delete, and member management
- Task creation, assignment, status tracking, and due dates
- Dashboard with task filters and overdue highlighting
- Automated backend API tests using Jest + Supertest

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcryptjs

### Testing

- Jest
- Supertest
- mongodb-memory-server

## Project Structure

```text
team-task-manager/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   ├── app.js
│   ├── server.js
│   ├── jest.config.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Roles and Permissions

### Admin

- Create projects
- Update projects
- Delete projects
- Add and remove project members
- Create and manage tasks

### Member

- View assigned or accessible projects
- View tasks
- Create and update tasks if allowed by the current UI/API flow
- Cannot create, update, or delete projects

## Environment Variables

Create a `backend/.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

Optional frontend env in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Installation

### 1. Clone the project

```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Run the App

### Start backend

From `/backend`:

```bash
npm run dev
```

or

```bash
npm start
```

Backend runs on:

```text
http://localhost:5000
```

### Start frontend

From `/frontend`:

```bash
npm run dev
```

Frontend usually runs on:

```text
http://localhost:5173
```

## Backend API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/users` — admin only

### Projects

- `POST /api/projects` — admin only
- `GET /api/projects` — authenticated users
- `PUT /api/projects/:id` — admin only
- `DELETE /api/projects/:id` — admin only
- `PUT /api/projects/:id/members/add` — admin only
- `PUT /api/projects/:id/members/remove` — admin only

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Authentication

Protected routes require a JWT token in the request header:

```http
Authorization: Bearer <token>
```

## Testing

Backend API tests are available in `/backend/tests`.

Run tests from `/backend`:

```bash
npm test
```

Current test coverage includes:

- auth register/login
- protected project routes
- admin vs member access checks
- task create/list APIs
- filtering tasks by status and project

## Frontend Scripts

From `/frontend`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Backend Scripts

From `/backend`:

```bash
npm run dev
npm start
npm test
```

## Common Issues

### CORS error or registration/login request blocked

- Make sure backend is running on `http://localhost:5000`
- Make sure `CLIENT_URL` matches the frontend origin
- Make sure the browser is calling the correct API base URL

### Project dropdown is empty

- Check `GET /api/projects` in browser network tab
- Confirm JWT token exists in `localStorage`
- Confirm the user has access to at least one project

### Member cannot create project

That is expected. Only admins are allowed to create projects.

## Future Improvements

- Add project descriptions in the UI
- Add task priority support in the UI
- Add pagination and search
- Add toast notifications
- Add Docker setup
- Add deployment instructions

## Author

Built as a Team Task Manager project using React, Express, MongoDB, and Node.js.

