import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, API_ENDPOINTS } from './config/api';
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Notification from "./components/Notification";
import Compressor from "./pages/Compressor";
import Converter from "./pages/Converter";
import BgRemover from "./pages/Bg-Remover";
import RecentActivity from "./pages/RecentActivity";
import Footer from "./components/Footer";
import { migrateLocalDataToCloud, setupLocalStorageCleanup } from "./utils/dataMigration";
import "./styles/main.css";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }

    const cleanupStop = setupLocalStorageCleanup();
    return cleanupStop;
  }, []);

  const handleLogin = async (email, password) => {
  try {
    const response = await axios.post(getApiUrl(API_ENDPOINTS.LOGIN), { email, password });
    const token = response.data.token;
    localStorage.setItem('authToken', token);
    setIsLoggedIn(true);

    setTimeout(async () => {
      try {
        const migrationResult = await migrateLocalDataToCloud();
        if (migrationResult && migrationResult.migratedCount > 0) {
          setNotification({
            message: `Successfully migrated ${migrationResult.migratedCount} upload${migrationResult.migratedCount > 1 ? 's' : ''} to your account!`,
            type: 'success'
          });
        }
      } catch (error) {
        console.error('Migration failed:', error);
      }
    }, 1000);

  } catch (error) {
    console.error("Login failed:", error);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setNotification({ message: "Logged out successfully", type: "info" });
  };

  return (
    <Router>
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
      <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login handleLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/compressor" element={<Compressor />} />
          <Route path="/converter" element={<Converter />} />
          <Route path="/bg-remover" element={<BgRemover />} />
          <Route path="/recent-activity" element={<RecentActivity />} />
          <Route path="/profile" element={isLoggedIn ? <Profile /> : <Login />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
