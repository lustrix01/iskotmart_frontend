import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import CustomerLayout from "./layouts/CustomerLayout";
import ProfileLayout from "./layouts/ProfileLayout";
import MerchantLayout from "./layouts/MerchantLayout";
import AdminLayout from "./layouts/AdminLayout";
import IskoModLayout from "./layouts/IskoModLayout";

// Customer Pages
import CustomerHome from "./pages/customer/CustomerHome";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Profile from "./pages/customer/Profile";
import Addresses from "./pages/customer/Addresses";
import ChangePassword from "./pages/customer/ChangePassword";
import Orders from "./pages/customer/Orders";
import Wishlist from "./pages/customer/Wishlist";
import Messages from "./pages/customer/Messages";
import Preferences from "./pages/customer/Preferences";
import ShopProducts from "./pages/customer/ShopProducts";
import BookServices from "./pages/customer/BookServices";
import MerchantProfile from "./pages/customer/MerchantProfile";

// Merchant Pages
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import ShopSettings from "./pages/merchant/ShopSettings";
import MerchantProducts from "./pages/merchant/MerchantProducts";
import MerchantOrders from "./pages/merchant/MerchantOrders";
import MerchantMessages from "./pages/merchant/MerchantMessages";
import MerchantSubscriptions from "./pages/merchant/MerchantSubscriptions";
import MerchantDiscounts from "./pages/merchant/MerchantDiscounts";
import MerchantAnalytics from "./pages/merchant/MerchantAnalytics";
import MerchantEarnings from "./pages/merchant/MerchantEarnings";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import MerchantVerification from "./pages/admin/MerchantVerification";
import AccountManagement from "./pages/admin/AccountManagement";
import OperationalCosts from "./pages/admin/OperationalCosts";
import Moderators from "./pages/admin/Moderators";
import ReportLogs from "./pages/admin/ReportLogs";
import AccountLogs from "./pages/admin/AccountLogs";
import ListingManagement from "./pages/admin/ListingManagement";
import ReviewModeration from "./pages/admin/ReviewModeration";

// Moderator Pages
import ModDashboard from "./pages/moderator/ModDashboard";
import AccountModeration from "./pages/moderator/AccountModeration";
import PromotedServices from "./pages/moderator/PromotedServices";

// Auth Pages
import LoginPage from "./auth/LoginPage";
import SignupPage from "./auth/SignupPage";
import CustomerSignup from "./auth/CustomerSignup"; // Fixed: Added Import
import MerchantSignup from "./auth/MerchantSignup"; // Fixed: Added Import

// Placeholder Component
const PlaceholderPage = ({ title }) => (
  <div className="max-w-5xl mx-auto animate-in fade-in duration-500 py-10">
    <div className="mb-8">
      <h1 className="text-xl font-bold text-[#003366]">{title}</h1>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold opacity-60">
        Moderator Tool Access
      </p>
    </div>
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-20 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
        <span className="font-black text-2xl">!</span>
      </div>
      <p className="text-gray-400 text-sm font-medium">
        The {title} interface is linked and ready for development.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Simulation Routes - Points to your real components now */}
          <Route path="/signup/customer" element={<CustomerSignup />} />
          <Route path="/signup/merchant" element={<MerchantSignup />} />

          {/* Customer Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<CustomerHome />} />
            <Route path="products" element={<ShopProducts />} />
            <Route path="services" element={<BookServices />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="service/:id" element={<ProductDetails />} />
            <Route path="merchant/:id" element={<MerchantProfile />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
          </Route>

          {/* Profile/Account Routes */}
          <Route path="/profile" element={<ProfileLayout />}>
            <Route index element={<Profile />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="password" element={<ChangePassword />} />
            <Route path="orders" element={<Orders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="messages" element={<Messages />} />
            <Route path="preferences" element={<Preferences />} />
          </Route>

          {/* Merchant Command Center Routes */}
          <Route path="/merchant" element={<MerchantLayout />}>
            <Route index element={<MerchantDashboard />} />
            <Route path="settings" element={<ShopSettings />} />
            <Route path="products" element={<MerchantProducts />} />
            <Route path="orders" element={<MerchantOrders />} />
            <Route path="messages" element={<MerchantMessages />} />
            <Route path="subscriptions" element={<MerchantSubscriptions />} />
            <Route path="discounts" element={<MerchantDiscounts />} />
            <Route path="analytics" element={<MerchantAnalytics />} />
            <Route path="earnings" element={<MerchantEarnings />} />
          </Route>

          {/* Moderator Console Routes */}
          <Route path="/moderator" element={<IskoModLayout />}>
            <Route index element={<ModDashboard />} />
            <Route path="reports" element={<ReportLogs />} />
            <Route path="listings" element={<ListingManagement />} />
            <Route path="reviews" element={<ReviewModeration />} />
            <Route path="accounts" element={<AccountModeration />} />
            <Route path="promotions" element={<PromotedServices />} />
          </Route>

          {/* Admin Command Center Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="verify" element={<MerchantVerification />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="costs" element={<OperationalCosts />} />
            <Route path="moderators" element={<Moderators />} />
            <Route path="reports" element={<ReportLogs />} />
            <Route path="logs" element={<AccountLogs />} />
            <Route path="listings" element={<ListingManagement />} />
            <Route path="reviews" element={<ReviewModeration />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
