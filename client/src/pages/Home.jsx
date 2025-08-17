import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Image Processing
            <span className="text-blue-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Compress, convert, and enhance your images with our powerful online tools.
            Fast, secure, and completely free to use.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/compressor"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              🗜️ Start Compressing
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold"
            >
              📝 Sign Up Free
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">

          {/* Compress Feature */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🗜️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Compress Images</h3>
            <p className="text-gray-600 mb-6">
              Reduce file size while maintaining quality. Perfect for web optimization and faster loading.
            </p>
            <Link
              to="/compressor"
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Compressor
            </Link>
            <div className="mt-4">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">FREE</span>
            </div>
          </div>

          {/* Convert Feature */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔄</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Convert Formats</h3>
            <p className="text-gray-600 mb-6">
              Convert between JPEG, PNG, WebP, and AVIF formats with ease and precision.
            </p>
            <Link
              to="/converter"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Converter
            </Link>
            <div className="mt-4">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">FREE</span>
            </div>
          </div>

          {/* Background Removal Feature */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✂️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Remove Background</h3>
            <p className="text-gray-600 mb-6">
              AI-powered background removal for professional-looking transparent images.
            </p>
            <Link
              to="/bg-remover"
              className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Try BG Remover
            </Link>
            <div className="mt-4">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">FREE</span>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Our Platform?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Lightning Fast</h4>
              <p className="text-gray-600 text-sm">Process images within seconds with our optimized cloud infrastructure.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Perfect Quality</h4>
              <p className="text-gray-600 text-sm">Maintain the highest quality while optimizing your images.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Privacy Guaranteed</h4>
              <p className="text-gray-600 text-sm">Your images are processed securely and automatically deleted after 6 hours.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Works Anywhere</h4>
              <p className="text-gray-600 text-sm">Browser-based tool that works on any device or platform.</p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Upload Your Image</h4>
              <p className="text-gray-600">Select or drag and drop your image. Supports JPEG, PNG, WebP formats up to 10MB.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Choose Your Tool</h4>
              <p className="text-gray-600">Select compression, format conversion, or background removal based on your needs.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Download Result</h4>
              <p className="text-gray-600">Get your processed image instantly with the perfect quality and format.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust our platform for their image processing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/compressor"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
            >
              Start Processing Images
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors text-lg font-semibold"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
  