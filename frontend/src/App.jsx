import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginDashboard from './pages/Login';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher/" element={<TeacherDashboard />} />
        <Route path="/student/" element={<StudentDashboard />} />
        <Route path="/admin/" element={<AdminDashboard />} />
        <Route path="/" element={<LoginDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;