import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Mail, ArrowRight } from 'lucide-react';

const PendingReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, message } = location.state || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-orange-100 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Account Pending Review
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-2">
            {message || 'Your seller account is currently under review by our admin team.'}
          </p>
          
          {email && (
            <p className="text-sm text-gray-500 mb-6">
              We'll send updates to: <span className="font-semibold text-orange-600">{email}</span>
            </p>
          )}

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              What's Next?
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✅ Your email has been verified</li>
              <li>⏳ Admin will review your documents</li>
              <li>📧 You'll receive an email once approved</li>
              <li>🚀 Then you can start selling on ChiFere!</li>
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-6">
            Questions? Contact us at support@chifere.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingReview;
