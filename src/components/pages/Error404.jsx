import React from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Error404 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiHome className="w-5 h-5" />
              Go Home
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              Go Back
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Error404; 