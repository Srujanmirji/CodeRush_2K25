import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import TimerPage from './pages/TimerPage';
import RegistrationDesk from './pages/RegistrationDesk';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/desk" element={<RegistrationDesk />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
