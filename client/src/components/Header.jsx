import { Link } from "react-router-dom";
import React, { useState } from "react";

function Header({ isLoggedIn, handleLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 100,
    background: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };
  return (
    <div>
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b border-gray-200" style={headerStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Left Section: Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  ImagePro
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                Home
              </Link>
              <Link
                to="/compressor"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                Compressor
              </Link>
              <Link
                to="/converter"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                Converter
              </Link>
              <Link
                to="/bg-remover"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                BG Remover
              </Link>
              <Link
                to="/recent-activity"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center space-x-1"
              >
                <span>📱</span>
                <span className="hidden lg:inline">Recent Activity</span>
                <span className="lg:hidden">Activity</span>
              </Link>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Recent Activity */}
              <Link
                to="/recent-activity"
                className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition duration-200"
                onClick={closeMobileMenu}
              >
                📱
              </Link>

              {/* Hamburger Menu */}
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {/* Navigation Links */}
              <Link
                to="/"
                className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                onClick={closeMobileMenu}
              >
                🏠 Home
              </Link>
              <Link
                to="/compressor"
                className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                onClick={closeMobileMenu}
              >
                🗜️ Compressor
              </Link>
              <Link
                to="/converter"
                className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                onClick={closeMobileMenu}
              >
                🔄 Converter
              </Link>
              <Link
                to="/bg-remover"
                className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                onClick={closeMobileMenu}
              >
                ✂️ BG Remover
              </Link>
              <Link
                to="/recent-activity"
                className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                onClick={closeMobileMenu}
              >
                📱 Recent Activity
              </Link>

              {/* Auth Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {isLoggedIn ? (
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                      onClick={closeMobileMenu}
                    >
                      👤 Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                    >
                      🚪 Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      to="/login"
                      className="block text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition duration-200"
                      onClick={closeMobileMenu}
                    >
                      🔑 Login
                    </Link>
                    <Link
                      to="/register"
                      className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-base font-medium transition duration-200"
                      onClick={closeMobileMenu}
                    >
                      ✨ Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>


  </div>
  );
}

export default Header;
