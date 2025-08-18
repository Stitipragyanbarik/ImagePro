import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

function Profile() {








  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">👤 Account Settings</h1>
              <Link
                to="/recent-activity"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                📱 Recent Activity
              </Link>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Profile Settings</h2>

            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Management</h3>
                <p className="text-gray-600">Your account settings and preferences are managed here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
  