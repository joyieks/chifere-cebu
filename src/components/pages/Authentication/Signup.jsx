import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import shoppingGirl from '../../../assets/shoppinggirl.png';
import { FiUser, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/Toast';
import { useNavigate } from 'react-router-dom';
import fileUploadService from '../../../services/fileUploadService';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null); // 'buyer' or 'seller'
  
  // Debug current state at component start
  console.log('🔍 [Signup] Component render - step:', step, 'userType:', userType);
  const [formData, setFormData] = useState({
    // Buyer fields
    firstName: '',
    lastName: '',
    middleName: '',
    contact: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Seller fields
    storeName: '',
    storeAddress: '',
    businessInfo: '',
    sellerContact: '',
    sellerPassword: '',
    sellerConfirmPassword: '',
    // ID Verification fields
    idType: '',
    idFrontFile: null,
    idBackFile: null,
    // OTP Verification
    code: '',
    // Terms
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState(''); // For verification error
  const { signup, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // Debug step changes
  useEffect(() => {
    console.log('🔍 [Signup] Step changed to:', step, 'userType:', userType);
  }, [step, userType]);

  // Password strength checker
  function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (strength <= 2) return 'Weak';
    if (strength === 3 || strength === 4) return 'Medium';
    if (strength === 5) return 'Strong';
    return '';
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
    // Password match validation
    if (name === 'password' || name === 'confirmPassword') {
      if (userType === 'buyer') {
        if ((name === 'password' && value !== formData.confirmPassword) || (name === 'confirmPassword' && value !== formData.password)) {
          setPasswordError('Passwords do not match');
        } else {
          setPasswordError('');
        }
      } else if (userType === 'seller') {
        if ((name === 'password' && value !== formData.confirmPassword) || (name === 'confirmPassword' && value !== formData.password)) {
          setPasswordError('Passwords do not match');
        } else {
          setPasswordError('');
        }
      }
    }
    // Password strength
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }
    // Email format validation
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError('Invalid email format');
      } else {
        setEmailError('');
      }
    }
  };

  // Step 1: Choose user type
  if (step === 1) {
    return (
      <div className="min-h-screen w-screen flex bg-gradient-to-br from-blue-200 via-blue-300 to-yellow-100">
        <button 
          onClick={() => window.history.back()}
          className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition z-10"
        >
          <FiArrowLeft size={20} />
          <span>Back</span>
        </button>
        {/* Left Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
          <motion.div 
            className="w-full max-w-md flex flex-col items-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/chiflogo.png" alt="Chifere Logo" className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign Up</h1>
            <p className="text-gray-600 mb-8">Choose your account type to get started:</p>
            <div className="flex flex-col gap-6 w-full">
              <button
                className="w-full py-4 rounded-lg border-2 border-blue-600 text-blue-600 font-bold text-xl hover:bg-blue-50 transition flex items-center justify-center gap-3"
                onClick={() => { setUserType('buyer'); setStep(2); }}
              >
                <FiUser size={28} className="text-blue-600" />
                Sign up as Buyer
              </button>
              <button
                className="w-full py-4 rounded-lg border-2 border-yellow-400 text-yellow-700 font-bold text-xl hover:bg-yellow-50 transition flex items-center justify-center gap-3"
                onClick={() => { setUserType('seller'); setStep(2); }}
              >
                <FiShoppingCart size={28} className="text-yellow-600" />
                Sign up as Seller
              </button>
            </div>
          </motion.div>
        </div>
        {/* Right Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 relative overflow-hidden items-center justify-center">
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
              <p className="mt-8 text-white text-2xl font-semibold text-center drop-shadow-lg">Join Chifere and start your journey!</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 2: Registration form
  if (step === 2) {
    return (
      <div className="min-h-screen w-screen flex bg-gradient-to-br from-blue-200 via-blue-300 to-yellow-100">
        <button 
          onClick={() => { setStep(1); setUserType(null); }}
          className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition z-10"
        >
          <FiArrowLeft size={20} />
          <span>Back</span>
        </button>
        {/* Left Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
          <motion.div 
            className="w-full max-w-md flex flex-col items-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/chiflogo.png" alt="Chifere Logo" className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{userType === 'buyer' ? 'Buyer Registration' : 'Seller Registration'}</h1>
            <form
              className="space-y-6 w-full"
              onSubmit={async (e) => {
                e.preventDefault();
                console.log('📝 [Signup] Form submitted');
                setLoading(true);

                try {
                  // For sellers, upload ID documents first
                  let idUrls = {};
                  if (userType === 'seller' && formData.idFrontFile && formData.idBackFile) {
                    showToast('Uploading ID documents...', 'info');
                    
                    const uploadResult = await fileUploadService.uploadIDDocuments({
                      front: formData.idFrontFile,
                      back: formData.idBackFile
                    }, 'temp_user_id'); // We'll update this with real user ID after registration
                    
                    if (uploadResult.success) {
                      idUrls = uploadResult.data;
                      showToast('ID documents uploaded successfully!', 'success');
                    } else {
                      showToast('Failed to upload ID documents. Please try again.', 'error');
                      return;
                    }
                  }

                  // Create user with ID URLs and display_name
                  const userDataWithIds = {
                    ...formData,
                    display_name: `${formData.firstName} ${formData.lastName}`.trim(), // Combine first and last name
                    idFrontUrl: idUrls.idFrontUrl,
                    idBackUrl: idUrls.idBackUrl
                  };

                  const result = await signup(formData.email, formData.password, userDataWithIds, userType);
                  if (result.success) {
                    console.log('✅ [Signup] Registration successful');
                    
                    if (userType === 'buyer') {
                      // For buyers, go directly to success step (no OTP)
                      console.log('✅ [Signup] Buyer registration successful, going to success step');
                      setLoading(false);
                      setStep(4);
                      showToast('Registration successful! You can now login to your account.', 'success');
                    } else {
                      // For sellers, go directly to success step (pending admin approval)
                      console.log('✅ [Signup] Seller registration successful, going to success step');
                      setLoading(false);
                      setStep(4);
                      showToast('Registration successful! Your account is pending admin approval.', 'success');
                    }
                  } else {
                    showToast(result.error || 'Registration failed. Please try again.', 'error');
                    setLoading(false);
                  }
                } catch (error) {
                  showToast('An error occurred. Please try again.', 'error');
                  setLoading(false);
                }
              }}
            >
              {userType === 'buyer' ? (
                <div key="buyer-form">
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-gray-900 font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-gray-900 font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Middle Name <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Middle Name (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Contact Number</label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your contact number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || 'your email'}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Create a password"
                      required
                    />
                    {formData.password && (
                      <div className="mt-1 text-sm">
                        <span className={
                          passwordStrength === 'Weak' ? 'text-red-500' :
                          passwordStrength === 'Medium' ? 'text-yellow-500' :
                          passwordStrength === 'Strong' ? 'text-green-600' : ''
                        }>
                          Password strength: {passwordStrength}
                        </span>
                      </div>
                    )}
                  </div>
                 <div>
                   <label className="block text-gray-900 font-medium mb-2">Confirm Password</label>
                   <input
                     type="password"
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Confirm your password"
                     required
                   />
                   {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                 </div>
                 <div className="flex items-center mt-2">
                   <input
                     type="checkbox"
                     name="terms"
                     checked={formData.terms}
                     onChange={e => setFormData({ ...formData, terms: e.target.checked })}
                     className="mr-2"
                     required
                   />
                   <span className="text-gray-700 text-sm">I agree to the <a href="#" className="text-blue-600 underline">Terms and Agreement</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a></span>
                 </div>
                </div>
              ) : (
                <div key="seller-form">
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || 'your email'}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Create a password"
                      required
                    />
                    {formData.password && (
                      <div className="mt-1 text-sm">
                        <span className={
                          passwordStrength === 'Weak' ? 'text-red-500' :
                          passwordStrength === 'Medium' ? 'text-yellow-500' :
                          passwordStrength === 'Strong' ? 'text-green-600' : ''
                        }>
                          Password strength: {passwordStrength}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Confirm your password"
                      required
                    />
                    {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Store Name</label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter your store name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Store Address</label>
                    <input
                      type="text"
                      name="storeAddress"
                      value={formData.storeAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter your store address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Business Info</label>
                    <input
                      type="text"
                      name="businessInfo"
                      value={formData.businessInfo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter business information"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Contact Number</label>
                    <input
                      type="text"
                      name="sellerContact"
                      value={formData.sellerContact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter your contact number"
                      required
                    />
                  </div>
                  
                  {/* ID Type Selection */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">What ID do you have? <span className="text-red-500">*</span></label>
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    >
                      <option value="">Select your ID type</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="passport">Passport</option>
                      <option value="national_id">National ID</option>
                      <option value="postal_id">Postal ID</option>
                      <option value="voters_id">Voter's ID</option>
                      <option value="sss_id">SSS ID</option>
                      <option value="gsis_id">GSIS ID</option>
                      <option value="philhealth_id">PhilHealth ID</option>
                      <option value="tin_id">TIN ID</option>
                      <option value="senior_citizen_id">Senior Citizen ID</option>
                      <option value="ofw_id">OFW ID</option>
                      <option value="other">Other Valid ID</option>
                    </select>
                  </div>

                  {/* ID Front Upload */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Upload Valid ID (Front) <span className="text-red-500">*</span></label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                      <input
                        type="file"
                        name="idFrontFile"
                        onChange={handleInputChange}
                        accept="image/*,.pdf"
                        className="hidden"
                        id="idFrontFile"
                        required
                      />
                      <label htmlFor="idFrontFile" className="cursor-pointer">
                        {formData.idFrontFile ? (
                          <div className="text-green-600">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">File selected: {formData.idFrontFile.name}</p>
                            <p className="text-xs text-gray-500">Click to change</p>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm font-medium">Click to upload ID front</p>
                            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* ID Back Upload */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Upload Valid ID (Back) <span className="text-red-500">*</span></label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                      <input
                        type="file"
                        name="idBackFile"
                        onChange={handleInputChange}
                        accept="image/*,.pdf"
                        className="hidden"
                        id="idBackFile"
                        required
                      />
                      <label htmlFor="idBackFile" className="cursor-pointer">
                        {formData.idBackFile ? (
                          <div className="text-green-600">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">File selected: {formData.idBackFile.name}</p>
                            <p className="text-xs text-gray-500">Click to change</p>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm font-medium">Click to upload ID back</p>
                            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      name="terms"
                      checked={formData.terms}
                      onChange={e => setFormData({ ...formData, terms: e.target.checked })}
                      className="mr-2"
                      required
                    />
                    <span className="text-gray-700 text-sm">I agree to the <a href="#" className="text-blue-600 underline">Terms and Agreement</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a></span>
                  </div>
                </div>
              )}
                <button
                  type="submit"
                  disabled={
                    !formData.terms || 
                    passwordError || 
                    emailError || 
                    passwordStrength === 'Weak' || 
                    loading ||
                    (userType === 'seller' && (!formData.idType || !formData.idFrontFile || !formData.idBackFile))
                  }
                  className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${userType === 'buyer' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  ) : (
                    'Register'
                  )}
                </button>
            </form>
          </motion.div>
        </div>
        {/* Right Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 relative overflow-hidden items-center justify-center">
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
              <p className="mt-8 text-white text-2xl font-semibold text-center drop-shadow-lg">{userType === 'buyer' ? 'Shop with confidence!' : 'Grow your business with Chifere!'}</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }


  // Step 4: Success message (different for buyers vs sellers)
  console.log('🔍 [Signup] Checking success step - step:', step, 'userType:', userType);
  if (step === 4) {
    console.log('🔍 [Signup] Rendering success step');
    return (
      <div className="min-h-screen w-screen flex bg-gradient-to-br from-blue-200 via-blue-300 to-yellow-100">
        {/* Left Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
          <motion.div 
            className="w-full max-w-md flex flex-col items-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/chiflogo.png" alt="Chifere Logo" className="w-24 h-24 mx-auto mb-6" />
            
            {userType === 'buyer' ? (
              // Buyer Success
              <div key="buyer-success">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h1>
                <p className="text-gray-600 mb-8 text-center">
                  Your buyer account has been successfully created. You can now login to start shopping!
                </p>
                <button
                  className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
              </div>
            ) : (
              // Seller Pending Review
              <div key="seller-success">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Pending Review</h1>
                <p className="text-gray-600 mb-6 text-center">
                  Your seller application has been submitted successfully! Our team will review your documents and get back to you within 24-48 hours.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 w-full">
                  <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• We'll verify your ID documents</li>
                    <li>• Review your business information</li>
                    <li>• Send you an email with the decision</li>
                    <li>• If approved, you can start selling immediately</li>
                  </ul>
                </div>
                <button
                  className="w-full py-3 rounded-lg font-semibold bg-yellow-400 text-yellow-900 hover:bg-yellow-300 transition"
                  onClick={() => navigate('/login')}
                >
                  Continue to Login
                </button>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  You can check your application status by logging in
                </p>
              </div>
            )}
          </motion.div>
        </div>
        {/* Right Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 relative overflow-hidden items-center justify-center">
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
              <p className="mt-8 text-white text-2xl font-semibold text-center drop-shadow-lg">
                {userType === 'buyer' ? 'Start Shopping!' : 'We\'ll Review Your Application Soon!'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Fallback: If we somehow get here, go back to step 1
  console.log('🔍 [Signup] Fallback: going back to step 1, current step:', step);
  return (
    <div className="min-h-screen w-screen flex bg-gradient-to-br from-blue-200 via-blue-300 to-yellow-100">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md flex flex-col items-center">
          <img src="/chiflogo.png" alt="Chifere Logo" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">Please try again from the beginning.</p>
          <button
            onClick={() => setStep(1)}
            className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition mt-6"
          >
            Back to Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
