# LearnLoop – School Management & Learning Portal

LearnLoop is a full-stack school management and learning platform designed to connect **students, teachers, and administrators** through a single digital portal.

The platform provides role-based dashboards, timetable management, learning material sharing, notifications, secure authentication, and mobile accessibility.

## 🚀 Project Overview

LearnLoop was developed as a full-stack web application with a focus on usability, security, and role-based access.

The system allows:

- **Students** to view their timetable, access learning materials, and receive notifications.
- **Teachers** to manage learning resources and timetable information.
- **Administrators** to manage users, academic information, and system operations.

The project was also integrated with **Capacitor** so the web application could run as an Android application.

---

## ✨ Key Features

### 🔐 Authentication & Role-Based Access
- Secure login using JWT authentication
- Role-based dashboards for:
  - Students
  - Teachers
  - Administrators
- Protected API routes
- Session-based token management

### 👨‍🎓 Student Portal
- Personal student dashboard
- View weekly timetable
- Access learning materials uploaded by teachers
- Receive notifications
- Unread notification badge
- Mark notifications as read

### 👨‍🏫 Teacher Portal
- Dedicated teacher dashboard
- Upload learning materials
- Add:
  - Title
  - Grade
  - Section
  - Subject
  - Description
  - File attachments
- View uploaded materials
- Delete learning materials
- Manage timetable entries based on permissions

### 🛠 Admin Portal
- Dedicated administration dashboard
- Role-based system management
- Access to student, teacher, and academic information

### 📅 Timetable Management
- Student-specific timetable display
- Timetable API integration
- Ordered weekday schedule
- Teacher access controls for timetable management

### 📚 Learning Materials
- Upload and retrieve course materials
- Student-specific resource access
- Teacher-owned material management
- File-based educational content support

### 🔔 Notifications
- Student notification system
- Unread notification count
- Mark-as-read functionality

### 📱 Android Support
- Integrated using Capacitor
- Tested using Android Emulator
- Local frontend and backend connectivity configured for mobile testing

---

## 🧰 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript
- Axios / Fetch API

### Backend
- Python
- FastAPI
- SQLAlchemy
- Uvicorn

### Database
- MySQL
- MySQL Workbench

### Authentication
- JWT (JSON Web Tokens)
- Bearer token authentication

### Mobile
- Capacitor
- Android Studio

---

## 🏗 Architecture

```text
React + Vite Frontend
        |
        | REST API
        v
FastAPI Backend
        |
        | SQLAlchemy ORM
        v
      MySQL
```

For Android testing:

```text
Capacitor Android App
        |
        v
React Frontend
        |
        v
FastAPI API
        |
        v
MySQL Database
```

---

## 📁 Main Frontend Pages

```text
src/
├── Login.jsx
├── AdminDashboard.jsx
├── StudentDashboard.jsx
├── TeacherDashboard.jsx
└── api.js
```

### Main Routes

```text
/                   Login
/admin              Admin Dashboard
/student            Student Dashboard
/teacher            Teacher Dashboard
```

---

## 🔗 Example API Endpoints

### Authentication

```http
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/get_student?user_id={id}
```

### Students

```http
GET /api/students/by-user/{id}
GET /api/students/notifications/unread
POST /api/students/notifications/mark-read-not
```

### Timetable

```http
GET  /api/timetable/{student_id}
POST /api/timetable/
```

### Learning Materials

```http
POST   /api/materials
GET    /api/materials/mine
GET    /api/materials/for-me
DELETE /api/materials/{id}
```

---

## 🗄 Database

The project uses a MySQL database containing tables such as:

- `users`
- `students`
- `teachers`
- `timetables`
- `materials`

SQLAlchemy is used to connect the FastAPI backend with the MySQL database.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd learnloop
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Start the frontend

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

---

## 🐍 Backend Setup

Create and activate a Python virtual environment.

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy pymysql python-jose passlib python-multipart
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0
```

The API normally runs at:

```text
http://localhost:8000
```

---

## 🔧 Environment Configuration

Example frontend environment variable:

```env
VITE_API_BASE=http://localhost:8000
```

For Android Emulator testing, the backend can be accessed using:

```text
http://10.0.2.2:8000
```

---

## 🔒 Security & Access Control

The project implements:

- JWT-based authentication
- Bearer token authorization
- Role-based access control
- Protected backend routes
- Student-specific resource access
- Teacher-specific permissions
- CORS configuration

---

## 🧠 Challenges Solved

During development, several real-world full-stack issues were resolved, including:

- CORS configuration between React and FastAPI
- JWT authentication and role validation
- SQL query optimisation
- Student and teacher permission handling
- API endpoint debugging
- Database relationship issues
- Timetable access restrictions
- Android Emulator API connectivity
- Responsive dashboard development

---

## 💡 Skills Demonstrated

This project demonstrates practical experience in:

- Full-stack web development
- React application development
- REST API development
- FastAPI backend development
- MySQL database design
- SQLAlchemy ORM
- Authentication and authorization
- API integration
- Responsive UI development
- Debugging and testing
- Android web-app integration
- Role-based software architecture

---

## 🎯 Future Improvements

Possible future improvements include:

- Real-time notifications
- Assignment submission system
- Attendance management
- Parent portal
- Live messaging
- Advanced analytics dashboard
- Cloud deployment
- AI-powered student assistant
- Push notifications for Android

---

## 👨‍💻 Developer

**Jaymeen Vaghela**

Full-Stack Developer | React | Python | FastAPI | MySQL | AI/ML

---

## 📄 License

This project was developed for educational and portfolio purposes.
