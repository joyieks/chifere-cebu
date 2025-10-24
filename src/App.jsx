import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { CartProvider } from './contexts/CartContext';
import { MessageProvider } from './contexts/MessageContext';
import { NotificationProvider } from './contexts/NotificationContext';
// import { MessagingProvider } from './contexts/MessagingContextFix'; // Temporarily disabled to fix timeout
import { ToastProvider } from './components/Toast';
import NotificationManager from './components/common/NotificationManager';
import ProtectedRoute from './components/ProtectedRoute';
import Error404 from './components/pages/Error404';
import { ProductGridSkeleton } from './components/Skeleton';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./components/pages/Landing/landingpage.jsx'));
const Login = lazy(() => import('./components/pages/Authentication/Login.jsx'));
const Signup = lazy(() => import('./components/pages/Authentication/signup.jsx'));
const OTPVerification = lazy(() => import('./components/pages/Authentication/OTPVerification.jsx'));
const PendingReview = lazy(() => import('./components/pages/Authentication/PendingReview.jsx'));
const BuyerDashboard = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_Dashboard/Buyer_Dashboard.jsx'));
const UserPageLayout = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/UserPageLayout/UserPageLayout.jsx'));
const MyAccount = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/MyAccount/MyAccount.jsx'));
const MyPurchase = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/MyPurchase/MyPurchase.jsx'));
const OrderDetails = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/MyPurchase/OrderDetails.jsx'));
const Settings = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/Settings/Settings.jsx'));
const Wishlists = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_Wishlist/Wishlists.jsx'));
const Cart = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_Cart/Cart.jsx'));
const TrackOrder = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/MyPurchase/TrackOrder.jsx'));
const Item = lazy(() => import('./components/pages/Shared/Item/Item.jsx'));
const SearchResult = lazy(() => import('./components/pages/Shared/SearchItem/SearchResult.jsx'));
const Checkout = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Buyer_UserPage/MyPurchase/Checkout.jsx'));
const StorePage = lazy(() => import('./components/pages/Buyer/BuyerStore/StorePage.jsx'));
const BuyerMessages = lazy(() => import('./components/pages/Buyer/Buyer_Menu/Messages/Messages.jsx'));
const BarterNegotiation = lazy(() => import('./components/pages/Shared/Barter/BarterNegotiation.jsx'));
const RatingReviews = lazy(() => import('./components/pages/Shared/Reviews/RatingReviews.jsx'));
const HelpCenter = lazy(() => import('./components/pages/Shared/Help/HelpCenter.jsx'));
const AdvancedSearch = lazy(() => import('./components/pages/Shared/Search/AdvancedSearch.jsx'));
const AdminDashboard = lazy(() => import('./components/pages/Admin/AdminDashboard.jsx'));

// Seller Components
const PendingApproval = lazy(() => import('./components/pages/Seller/PendingApproval.jsx'));
const SellerDashboard = lazy(() => import('./components/pages/Seller/Seller_Menu/Seller_Dashboard/SellerDashboard.jsx'));
const SellerProducts = lazy(() => import('./components/pages/Seller/Seller_Menu/Products/Products.jsx'));
const SellerOrders = lazy(() => import('./components/pages/Seller/Seller_Menu/Orders/Orders.jsx'));
const SellerAnalytics = lazy(() => import('./components/pages/Seller/Seller_Menu/Analytics/Analytics.jsx'));
const SellerMessages = lazy(() => import('./components/pages/Seller/Seller_Menu/Messages/Messages.jsx'));
const SellerProfile = lazy(() => import('./components/pages/Seller/Seller_Menu/Profile/Profile.jsx'));
const SellerSettings = lazy(() => import('./components/pages/Seller/Seller_Menu/Settings/Settings.jsx'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function AppRoutes() {
  const location = useLocation();
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requireRole="admin" redirectTo="/login">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Signup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verify-otp" 
          element={
            <ProtectedRoute requireAuth={false}>
              <OTPVerification />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pending-review" 
          element={
            <ProtectedRoute requireAuth={false}>
              <PendingReview />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Buyer Routes */}
        <Route 
          path="/buyer/dashboard" 
          element={
            <ProtectedRoute requireRole="buyer" redirectTo="/seller/dashboard">
              <BuyerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/account" 
          element={
            <ProtectedRoute>
              <UserPageLayout><MyAccount /></UserPageLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/purchase" 
          element={
            <ProtectedRoute>
              <UserPageLayout><MyPurchase /></UserPageLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/purchase/order/:orderId" 
          element={
            <ProtectedRoute>
              <UserPageLayout><OrderDetails /></UserPageLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/purchase/track-order/:orderId" 
          element={
            <ProtectedRoute>
              <UserPageLayout><TrackOrder /></UserPageLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/settings" 
          element={
            <ProtectedRoute>
              <UserPageLayout><Settings /></UserPageLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/messages" 
          element={
            <ProtectedRoute>
              <BuyerMessages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/messages/:conversationId" 
          element={
            <ProtectedRoute>
              <BuyerMessages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/wishlist" 
          element={
            <ProtectedRoute>
              <Wishlists key={location.pathname} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/cart" 
          element={
            <ProtectedRoute>
              <Cart key={location.pathname} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/barter/:itemId" 
          element={
            <ProtectedRoute>
              <BarterNegotiation />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reviews/:itemId" 
          element={
            <ProtectedRoute>
              <RatingReviews />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/advanced-search" 
          element={
            <ProtectedRoute>
              <AdvancedSearch />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/store" 
          element={
            <ProtectedRoute>
              <StorePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/store/:storeId" 
          element={
            <ProtectedRoute>
              <StorePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Seller Routes */}
        <Route 
          path="/seller/pending" 
          element={
            <ProtectedRoute>
              <PendingApproval />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/dashboard" 
          element={
            <ProtectedRoute requireRole="seller" redirectTo="/buyer/dashboard">
              <SellerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/products" 
          element={<SellerProducts />}
        />
        <Route 
          path="/seller/orders" 
          element={
            <ProtectedRoute requireRole="seller" redirectTo="/buyer/dashboard">
              <SellerOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/analytics" 
          element={
            <ProtectedRoute requireRole="seller" redirectTo="/buyer/dashboard">
              <SellerAnalytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/messages" 
          element={
            <ProtectedRoute requireRole="seller" redirectTo="/buyer/messages">
              <SellerMessages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/profile" 
          element={
            <ProtectedRoute requireRole="seller" redirectTo="/buyer/dashboard">
              <SellerProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/settings" 
          element={
            <ProtectedRoute requireRole="seller" redirectTo="/buyer/dashboard">
              <SellerSettings />
            </ProtectedRoute>
          } 
        />
        
        {/* Semi-protected routes (can be accessed without login but with limited functionality) */}
        <Route path="/item/:itemId" element={<Item />} />
        <Route path="/buyer/search" element={<SearchResult />} />
        
        {/* Checkout route - requires authentication */}
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 Error Page */}
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <MessageProvider>
              <NotificationProvider>
                <ErrorBoundary>
                  {/* <MessagingProvider> */}
                    <ToastProvider>
                      <Router>
                        <AppRoutes />
                        <NotificationManager />
                      </Router>
                    </ToastProvider>
                  {/* </MessagingProvider> */}
                </ErrorBoundary>
              </NotificationProvider>
            </MessageProvider>
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
