    import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiShield } from 'react-icons/fi';
import shoppingGirl from '../../../assets/shoppinggirl.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/Toast';
import ForgotPasswordModal from '../../common/ForgotPasswordModal/ForgotPasswordModal';

    const shoppingSVG = `
<svg width="350" height="350" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g>
    <ellipse cx="400" cy="700" rx="300" ry="40" fill="#E0E7FF"/>
    <rect x="320" y="400" width="160" height="200" rx="30" fill="#3B82F6"/>
    <rect x="350" y="430" width="100" height="140" rx="20" fill="#60A5FA"/>
    <rect x="370" y="470" width="60" height="60" rx="10" fill="#fff"/>
    <circle cx="400" cy="350" r="60" fill="#1E293B"/>
    <ellipse cx="400" cy="350" rx="30" ry="40" fill="#FBBF24"/>
    <rect x="390" y="390" width="20" height="40" rx="10" fill="#1E293B"/>
    <rect x="320" y="600" width="30" height="60" rx="15" fill="#1E293B"/>
    <rect x="450" y="600" width="30" height="60" rx="15" fill="#1E293B"/>
    <rect x="280" y="500" width="40" height="20" rx="10" fill="#3B82F6"/>
    <rect x="480" y="500" width="40" height="20" rx="10" fill="#3B82F6"/>
    <rect x="500" y="420" width="60" height="30" rx="15" fill="#60A5FA"/>
    <rect x="240" y="420" width="60" height="30" rx="15" fill="#60A5FA"/>
    <rect x="370" y="530" width="60" height="20" rx="10" fill="#3B82F6"/>
    <rect x="390" y="550" width="20" height="30" rx="10" fill="#60A5FA"/>
    <ellipse cx="400" cy="340" rx="8" ry="12" fill="#fff"/>
  </g>
</svg>
`;

    const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { showToast } = useToast();
    
    // Debug forgot password state
    React.useEffect(() => {
        console.log('showForgotPassword state changed:', showForgotPassword);
    }, [showForgotPassword]);
    
    // Get the intended destination based on role
    const getDefaultPath = (role) => {
        if (role === 'admin') return '/admin/dashboard';
        return role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
    };


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        console.log('🔐 [Login] Submitting with form data:', formData);
        
        try {
            // Use AuthContext login function which handles admin, seller, and buyer login
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                // Get the user type from the result
                const userType = result.user_type || 'buyer';
                const sellerStatus = result.seller_status;
                const actualRole = result.actualRole || userType;
                
                showToast('Login successful!', 'success', 1000);
                
                // Handle admin login
                if (actualRole === 'admin') {
                    setTimeout(() => {
                        navigate('/admin/dashboard', { replace: true });
                    }, 1000);
                    return;
                }
                
                // Handle seller status
                if (userType === 'seller') {
                    if (sellerStatus === 'pending') {
                        // Redirect to pending approval page
                        setTimeout(() => {
                            navigate('/seller/pending', { replace: true });
                        }, 800);
                        return;
                    } else if (sellerStatus === 'rejected') {
                        showToast('Your seller application was rejected. Please contact support for more information.', 'error', 5000);
                        setTimeout(() => {
                            navigate('/seller/pending', { replace: true });
                        }, 1000);
                        return;
                    } else if (sellerStatus === 'approved') {
                        // Redirect to seller dashboard
                        setTimeout(() => {
                            navigate('/seller/dashboard', { replace: true });
                        }, 800);
                        return;
                    }
                }
                
                // Add a small delay to ensure toast is visible before redirect
                const redirectPath = location.state?.from?.pathname || getDefaultPath(actualRole);
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 800);
            } else {
                showToast(result.error || 'Login failed. Please try again.', 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex">
        {/* Back Button */}
        <button 
            onClick={() => window.history.back()}
            className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition z-10"
        >
            <FiArrowLeft size={20} />
            <span>Back</span>
        </button>
        
        {/* Left Side - Logo and Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
            <motion.div 
            className="w-full max-w-md flex flex-col items-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            >
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <img 
                  src="/chiflogo.png" 
                  alt="Chifere Cebu Logo" 
                  className="w-24 h-24 mx-auto mb-4"
              />
              <div className="text-3xl font-bold">
                <span style={{ color: '#3B82F6' }}>ChiFere</span>
                <span style={{ color: '#10B981' }}> Cebu</span>
              </div>
            </div>
            {/* Header */}
            <div className="text-center mb-8 w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">WELCOME BACK</h1>
                <p className="text-gray-600">Welcome back! Please enter your details.</p>
                
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
                {/* Email Field */}
                <div>
                <label className="block text-gray-900 font-medium mb-2">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                />
                </div>


                {/* Password Field */}
                <div>
                <label className="block text-gray-900 font-medium mb-2">Password</label>
                <div className="relative">
                    <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••••"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                </div>
                </div>


                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                    <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Remember me</span>
                </label>
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Forgot password button clicked');
                        console.log('showForgotPassword state:', showForgotPassword);
                        alert('Forgot password button clicked!'); // Temporary alert for testing
                        setShowForgotPassword(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus:underline px-3 py-2 rounded hover:bg-blue-50 border border-blue-200 hover:border-blue-300 relative z-10 bg-yellow-100"
                    style={{ pointerEvents: 'auto' }}
                >
                    Forgot password?
                </button>
                </div>

                {/* Sign In Button */}
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    <>
                        <span>Sign in</span>
                        <FiArrowRight size={20} />
                    </>
                )}
                </button>

            </form>

            {/* Sign Up Link */}
            <div className="text-center mt-8 w-full">
                <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Sign up here!
                </Link>
                </p>
            </div>
            </motion.div>
        </div>

        {/* Right Side - Shopping Character Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 relative overflow-hidden items-center justify-center">
            {/* Decorative blurred circle */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-300 opacity-30 rounded-full filter blur-3xl z-0"></div>
            <motion.div 
            className="w-full h-full flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            >
            <div className="relative flex flex-col items-center justify-center w-full h-full group">
                <img 
                  src={shoppingGirl} 
                  alt="Shopping Girl" 
                  className="max-h-[70%] max-w-[70%] object-contain drop-shadow-2xl transition-transform transition-shadow duration-300 ease-in-out group-hover:scale-110 group-hover:drop-shadow-[0_8px_32px_rgba(59,130,246,0.5)] cursor-pointer" 
                />
                <p className="mt-8 text-white text-2xl font-semibold text-center drop-shadow-lg">Shop smart, live better with Chifere!</p>
            </div>
            </motion.div>
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
            isOpen={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
        />
        </div>
    );
    };

    export default Login; 