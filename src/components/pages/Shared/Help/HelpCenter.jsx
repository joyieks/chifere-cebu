/**
 * Help Center Component
 * 
 * Implements the help and support system as specified in the ChiFere manuscript.
 * Provides comprehensive support for both buyers and sellers with issue reporting,
 * FAQ section, and customer service integration.
 * 
 * Features:
 * - Issue reporting system
 * - FAQ with search functionality
 * - Contact support forms
 * - Live chat integration
 * - Troubleshooting guides
 * - Community guidelines
 * 
 * @version 1.0.0 - Initial implementation per manuscript Figure 16
 */

import React, { useState, useEffect } from 'react';
import { theme } from '../../../../styles/designSystem';
import { 
  FiHelpCircle,
  FiMessageSquare,
  FiMail,
  FiPhone,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiShield,
  FiTruck,
  FiCreditCard,
  FiUser,
  FiSettings,
  FiFlag,
  FiSend,
  FiBook,
  FiHeadphones,
  FiClock
} from 'react-icons/fi';

const HelpCenter = ({ userRole = 'buyer', onContactSupport }) => {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [reportForm, setReportForm] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
    attachments: []
  });
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  // FAQ Data
  const faqData = [
    {
      id: 'faq1',
      category: 'getting-started',
      question: 'How do I create an account on ChiFere?',
      answer: 'To create an account, click on "Sign Up" in the top navigation. You can choose to register as a Buyer or Seller. Fill in your basic information, verify your email, and you\'re ready to start trading!'
    },
    {
      id: 'faq2',
      category: 'buying',
      question: 'How does the barter system work?',
      answer: 'ChiFere\'s barter system allows you to exchange items without money. Simply find a barter item, click "Make Offer", select items from your inventory to trade, and send your proposal. The seller can accept, reject, or make a counter-offer.'
    },
    {
      id: 'faq3',
      category: 'selling',
      question: 'How do I list an item for sale or barter?',
      answer: 'As a seller, go to your dashboard and click "Add Product". Upload clear photos, write a detailed description, set your price (or mark as barter-only), and publish your listing. Make sure to be honest about the item\'s condition.'
    },
    {
      id: 'faq4',
      category: 'payment',
      question: 'What payment methods are supported?',
      answer: 'ChiFere supports various payment methods including Credit/Debit cards via PayMongo, GCash, Maya (PayMaya), and Cash on Delivery. Choose the method that works best for you during checkout.'
    },
    {
      id: 'faq5',
      category: 'shipping',
      question: 'How does shipping work in Cebu?',
      answer: 'ChiFere partners with local couriers for fast delivery within Cebu. Shipping costs are calculated based on distance and item size. Many sellers offer free shipping for orders over ₱1,500.'
    },
    {
      id: 'faq6',
      category: 'safety',
      question: 'How do I report a problem with a seller or buyer?',
      answer: 'If you encounter any issues, use our Report System. Go to Help Center > Report Issue, select the appropriate category, and provide detailed information. Our team will investigate and take appropriate action.'
    },
    {
      id: 'faq7',
      category: 'account',
      question: 'How do I verify my account?',
      answer: 'Account verification helps build trust in the ChiFere community. Upload a valid government ID and proof of address. Verified accounts get priority support and increased trust from other users.'
    },
    {
      id: 'faq8',
      category: 'sustainability',
      question: 'What makes ChiFere environmentally friendly?',
      answer: 'ChiFere promotes sustainability by extending the lifecycle of preloved items, reducing waste, and encouraging local trading to minimize transportation impact. Every transaction helps build a more sustainable Cebu.'
    }
  ];

  // Issue Categories
  const issueCategories = [
    { id: 'transaction', label: 'Transaction Issues', icon: FiCreditCard },
    { id: 'seller', label: 'Seller Problems', icon: FiFlag },
    { id: 'buyer', label: 'Buyer Problems', icon: FiUser },
    { id: 'shipping', label: 'Shipping & Delivery', icon: FiTruck },
    { id: 'payment', label: 'Payment Issues', icon: FiCreditCard },
    { id: 'account', label: 'Account Issues', icon: FiSettings },
    { id: 'technical', label: 'Technical Problems', icon: FiAlertTriangle },
    { id: 'safety', label: 'Safety Concerns', icon: FiShield }
  ];

  // Contact Categories
  const contactCategories = [
    { id: 'general', label: 'General Inquiry' },
    { id: 'technical', label: 'Technical Support' },
    { id: 'billing', label: 'Billing & Payment' },
    { id: 'partnership', label: 'Business Partnership' },
    { id: 'feedback', label: 'Feedback & Suggestions' }
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const submitReport = () => {
    if (!reportForm.category || !reportForm.subject || !reportForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    // TODO: Submit to Firebase/backend
    console.log('Report submitted:', reportForm);
    
    // Reset form
    setReportForm({
      category: '',
      subject: '',
      description: '',
      priority: 'medium',
      attachments: []
    });
    
    alert('Report submitted successfully. Our team will review it within 24 hours.');
  };

  const submitContactForm = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    // TODO: Submit to Firebase/backend
    console.log('Contact form submitted:', contactForm);
    
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general'
    });
    
    alert('Message sent successfully. We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          <FiHelpCircle className="w-10 h-10 inline mr-3 text-blue-600" />
          ChiFere Help Center
        </h1>
        <p className="text-xl text-gray-600">
          Get help, find answers, and connect with our support team
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div 
          className="p-6 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: theme.colors.primary[50],
            border: `2px solid ${theme.colors.primary[200]}`
          }}
          onClick={() => setActiveTab('faq')}
        >
          <FiBook className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Browse FAQ</h3>
          <p className="text-gray-600">Find quick answers to common questions</p>
        </div>

        <div 
          className="p-6 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: theme.colors.success[50],
            border: `2px solid ${theme.colors.success[200]}`
          }}
          onClick={() => setActiveTab('contact')}
        >
          <FiHeadphones className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Support</h3>
          <p className="text-gray-600">Get personalized help from our team</p>
        </div>

        <div 
          className="p-6 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: theme.colors.error[50],
            border: `2px solid ${theme.colors.error[200]}`
          }}
          onClick={() => setActiveTab('report')}
        >
          <FiFlag className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Report Issue</h3>
          <p className="text-gray-600">Report problems or safety concerns</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-xl p-2">
          {[
            { id: 'faq', label: 'FAQ', icon: FiBook },
            { id: 'contact', label: 'Contact', icon: FiMail },
            { id: 'report', label: 'Report', icon: FiFlag },
            { id: 'guides', label: 'Guides', icon: FiHelpCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: theme.colors.gray[300] }}
            >
              <option value="all">All Categories</option>
              <option value="getting-started">Getting Started</option>
              <option value="buying">Buying</option>
              <option value="selling">Selling</option>
              <option value="payment">Payment</option>
              <option value="shipping">Shipping</option>
              <option value="safety">Safety</option>
              <option value="account">Account</option>
              <option value="sustainability">Sustainability</option>
            </select>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map(faq => (
              <div key={faq.id} className="border rounded-xl overflow-hidden" style={{ borderColor: theme.colors.gray[200] }}>
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full p-6 text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-gray-800 pr-4">{faq.question}</h3>
                  {expandedFAQ === faq.id ? (
                    <FiChevronUp className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-6 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <FiHelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search terms or browse all categories</p>
            </div>
          )}
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 border" style={{ borderColor: theme.colors.gray[200] }}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Contact Our Support Team</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FiMail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">Email Support</h4>
                <p className="text-sm text-gray-600">support@chifere.com</p>
                <p className="text-xs text-gray-500 mt-1">24-48 hour response</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FiMessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">Live Chat</h4>
                <p className="text-sm text-gray-600">Available 9AM-6PM</p>
                <p className="text-xs text-gray-500 mt-1">Instant response</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <FiPhone className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">Phone Support</h4>
                <p className="text-sm text-gray-600">(032) 123-4567</p>
                <p className="text-xs text-gray-500 mt-1">Mon-Fri 9AM-5PM</p>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: theme.colors.gray[300] }}
                />
                
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: theme.colors.gray[300] }}
                />
              </div>
              
              <select
                value={contactForm.category}
                onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                {contactCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Subject *"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              />
              
              <textarea
                placeholder="Describe your issue or question in detail *"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={6}
                className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              />
              
              <button
                type="button"
                onClick={submitContactForm}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center"
              >
                <FiSend className="w-5 h-5 mr-2" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 border" style={{ borderColor: theme.colors.gray[200] }}>
            <div className="flex items-center space-x-3 mb-6">
              <FiAlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Report an Issue</h3>
                <p className="text-gray-600">Help us maintain a safe and trustworthy marketplace</p>
              </div>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Category *</label>
                <div className="grid grid-cols-2 gap-3">
                  {issueCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setReportForm({ ...reportForm, category: category.id })}
                      className={`p-3 border rounded-lg text-left transition-all duration-200 flex items-center space-x-2 ${
                        reportForm.category === category.id
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <category.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                <select
                  value={reportForm.priority}
                  onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{ borderColor: theme.colors.gray[300] }}
                >
                  <option value="low">Low - General concern</option>
                  <option value="medium">Medium - Moderate issue</option>
                  <option value="high">High - Urgent problem</option>
                  <option value="critical">Critical - Safety concern</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Subject/Title *"
                value={reportForm.subject}
                onChange={(e) => setReportForm({ ...reportForm, subject: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: theme.colors.gray[300] }}
              />

              <textarea
                placeholder="Detailed description of the issue *"
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                rows={6}
                className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: theme.colors.gray[300] }}
              />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Important Note</h4>
                    <p className="text-sm text-yellow-700">
                      False reports may result in account restrictions. Please provide accurate and honest information.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={submitReport}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center"
              >
                <FiFlag className="w-5 h-5 mr-2" />
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guides Tab */}
      {activeTab === 'guides' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Getting Started Guide',
              description: 'Learn the basics of buying and selling on ChiFere',
              icon: FiUser,
              color: 'blue'
            },
            {
              title: 'Barter System Guide',
              description: 'Master the art of item exchange without money',
              icon: FiShield,
              color: 'green'
            },
            {
              title: 'Safety Guidelines',
              description: 'Stay safe while trading with other users',
              icon: FiTruck,
              color: 'red'
            },
            {
              title: 'Shipping & Delivery',
              description: 'Understand how orders are processed and delivered',
              icon: FiCreditCard,
              color: 'orange'
            },
            {
              title: 'Payment Methods',
              description: 'Learn about supported payment options',
              icon: FiSettings,
              color: 'purple'
            },
            {
              title: 'Account Settings',
              description: 'Manage your profile and preferences',
              icon: FiClock,
              color: 'indigo'
            }
          ].map((guide, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border cursor-pointer hover:shadow-lg transition-all duration-200"
              style={{
                backgroundColor: theme.colors[guide.color][50],
                borderColor: theme.colors[guide.color][200]
              }}
            >
              <guide.icon 
                className={`w-12 h-12 mb-4 text-${guide.color}-600`}
              />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{guide.title}</h3>
              <p className="text-gray-600 text-sm">{guide.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpCenter;