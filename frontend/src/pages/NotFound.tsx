import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">
          Sorry, the page you are looking for does not exist.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-600 transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;

