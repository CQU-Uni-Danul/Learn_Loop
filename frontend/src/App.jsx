import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginDashboard from './pages/Login';
import NotificationsPage from './pages/NotificationsPage';




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher/" element={<TeacherDashboard />} />
        <Route path="/student/" element={<StudentDashboard />} />
        <Route path="/admin/" element={<AdminDashboard />} />
        <Route path="/" element={<LoginDashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </Router>
  );
}

export default App;