import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center space-x-2 mb-8 group">
          <img src="/logo.png" alt="Charitap" className="w-10 h-10" />
          <span className="font-extrabold text-2xl text-yellow-400 tracking-tight">Charitap</span>
        </Link>

        {/* 404 heading */}
        <div className="mb-6">
          <span className="block text-8xl font-black text-black leading-none mb-2">404</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Looks like this page took a detour. The URL you're looking for doesn't exist — but every click still counts!
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 my-8">
          <div className="h-px w-16 bg-yellow-300" />
          <span className="text-yellow-400 text-xl">💛</span>
          <div className="h-px w-16 bg-yellow-300" />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-yellow-400 hover:text-black transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Go Back Home
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-black font-semibold rounded-full border-2 border-black hover:border-yellow-400 hover:text-yellow-600 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}