import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
