import React, { useState } from 'react';

const paymayaImg = '/maya2.png';
const gcashImg = '/gcash.png';

const initialWallets = [
  { id: 1, type: 'PayMaya', number: '09123456789', img: paymayaImg },
  { id: 2, type: 'GCash', number: '09987654321', img: gcashImg },
];

const BankAndCards = () => {
  const [wallets, setWallets] = useState(initialWallets);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState('PayMaya');
  const [newNumber, setNewNumber] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      setWallets(wallets.filter(w => w.id !== id));
      setDeletingId(null);
    }, 300);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setWallets([
      ...wallets,
      {
        id: Date.now(),
        type: newType,
        number: newNumber,
        img: newType === 'PayMaya' ? paymayaImg : gcashImg,
      },
    ]);
    setShowAdd(false);
    setNewNumber('');
    setNewType('PayMaya');
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto backdrop-blur-sm border border-white/20">
        {/* Header with gradient text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            E-Wallets
          </h1>
          <p className="text-gray-500">Manage your digital payment methods</p>
        </div>

        {/* Add wallet button with hover animation */}
        <div className="mb-8 flex justify-between items-center">
          <span className="font-semibold text-gray-700 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Linked Wallets ({wallets.length})
          </span>
          <button 
            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out flex items-center space-x-2"
            onClick={() => setShowAdd(true)}
          >
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Wallet</span>
          </button>
        </div>

        {/* Wallet cards with animations */}
        <div className="space-y-4">
          {wallets.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">No wallets linked yet</p>
              <p className="text-sm text-gray-400">Add your first e-wallet to get started</p>
            </div>
          )}
          
          {wallets.map((w, index) => (
            <div 
              key={w.id} 
              className={`group relative bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out border border-gray-100 ${
                deletingId === w.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center">
                <div className="relative">
                  <img src={w.img} alt={w.type} className="w-16 h-16 object-contain mr-8 group-hover:scale-110 transition-transform duration-200" />
                  <div className="absolute -top-2 -right-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="font-bold text-xl text-gray-800 mb-1">{w.type}</div>
                  <div className="text-gray-600 font-mono text-lg tracking-wider">{w.number}</div>
                  <div className="text-xs text-green-600 font-semibold mt-1">● Connected</div>
                </div>
                
                <button 
                  className="ml-4 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 font-semibold border border-red-200 hover:border-red-300 group-hover:scale-105"
                  onClick={() => handleDelete(w.id)}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Add Wallet Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 transform animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Add New Wallet</h2>
                <p className="text-gray-500">Connect your e-wallet for easy payments</p>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Type</label>
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="PayMaya">PayMaya</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <input 
                    type="text" 
                    value={newNumber} 
                    onChange={e => setNewNumber(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white" 
                    placeholder="09XX XXX XXXX"
                    required 
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button 
                    type="button" 
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold transform hover:scale-105"
                  >
                    Add Wallet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
};

export default BankAndCards;