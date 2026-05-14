import { createElement, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";

// Layouts
const CustomerLayout = lazy(() => import("./layouts/CustomerLayout"));
const ProfileLayout = lazy(() => import("./layouts/ProfileLayout"));
const MerchantLayout = lazy(() => import("./layouts/MerchantLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const IskoModLayout = lazy(() => import("./layouts/IskoModLayout"));

// Customer Pages
const CustomerHome = lazy(() => import("./pages/customer/CustomerHome"));
const ProductDetails = lazy(() => import("./pages/customer/ProductDetails"));
const Cart = lazy(() => import("./pages/customer/Cart"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Addresses = lazy(() => import("./pages/customer/Addresses"));
const ChangePassword = lazy(() => import("./pages/customer/ChangePassword"));
const Orders = lazy(() => import("./pages/customer/Orders"));
const Wishlist = lazy(() => import("./pages/customer/Wishlist"));
const Messages = lazy(() => import("./pages/customer/Messages"));
const Preferences = lazy(() => import("./pages/customer/Preferences"));
const ShopProducts = lazy(() => import("./pages/customer/ShopProducts"));
const BookServices = lazy(() => import("./pages/customer/BookServices"));
const SearchResults = lazy(() => import("./pages/customer/SearchResults"));
const MerchantProfile = lazy(() => import("./pages/customer/MerchantProfile"));

// Merchant Pages
const MerchantDashboard = lazy(() => import("./pages/merchant/MerchantDashboard"));
const ShopSettings = lazy(() => import("./pages/merchant/ShopSettings"));
const MerchantProducts = lazy(() => import("./pages/merchant/MerchantProducts"));
const MerchantOrders = lazy(() => import("./pages/merchant/MerchantOrders"));
const MerchantMessages = lazy(() => import("./pages/merchant/MerchantMessages"));
const MerchantDiscounts = lazy(() => import("./pages/merchant/MerchantDiscounts"));
const MerchantAnalytics = lazy(() => import("./pages/merchant/MerchantAnalytics"));
const MerchantEarnings = lazy(() => import("./pages/merchant/MerchantEarnings"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const MerchantVerification = lazy(() =>
  import("./pages/admin/MerchantVerification"),
);
const AccountManagement = lazy(() => import("./pages/admin/AccountManagement"));
const OperationalCosts = lazy(() => import("./pages/admin/OperationalCosts"));
const Moderators = lazy(() => import("./pages/admin/Moderators"));
const ReportLogs = lazy(() => import("./pages/admin/ReportLogs"));
const AccountLogs = lazy(() => import("./pages/admin/AccountLogs"));
const ListingManagement = lazy(() => import("./pages/admin/ListingManagement"));
const ReviewModeration = lazy(() => import("./pages/admin/ReviewModeration"));

// Moderator Pages
const ModDashboard = lazy(() => import("./pages/moderator/ModDashboard"));
const AccountModeration = lazy(() =>
  import("./pages/moderator/AccountModeration"),
);
const PromotedServices = lazy(() =>
  import("./pages/moderator/PromotedServices"),
);

// Auth Pages
const LoginPage = lazy(() => import("./auth/LoginPage"));
const SignupPage = lazy(() => import("./auth/SignupPage"));
const CustomerSignup = lazy(() => import("./auth/CustomerSignup"));
const MerchantSignup = lazy(() => import("./auth/MerchantSignup"));

const withSuspense = (Component) => (
  <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading...</div>}>
    {createElement(Component)}
  </Suspense>
);

const RequireAuth = ({ roles }) => {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={withSuspense(LoginPage)} />
          <Route path="/signup" element={withSuspense(SignupPage)} />

          {/* Simulation Routes - Points to your real components now */}
          <Route
            path="/signup/customer"
            element={withSuspense(CustomerSignup)}
          />
          <Route
            path="/signup/merchant"
            element={withSuspense(MerchantSignup)}
          />

          {/* Customer Routes */}
          <Route path="/" element={withSuspense(CustomerLayout)}>
            <Route index element={withSuspense(CustomerHome)} />
            <Route path="search" element={withSuspense(SearchResults)} />
            <Route path="products" element={withSuspense(ShopProducts)} />
            <Route path="services" element={withSuspense(BookServices)} />
            <Route path="product/:id" element={withSuspense(ProductDetails)} />
            <Route path="service/:id" element={withSuspense(ProductDetails)} />
            <Route path="merchant/:id" element={withSuspense(MerchantProfile)} />
            <Route element={<RequireAuth roles={["customer"]} />}>
              <Route path="cart" element={withSuspense(Cart)} />
              <Route path="checkout" element={withSuspense(Checkout)} />
            </Route>
          </Route>

          {/* Profile/Account Routes */}
          <Route element={<RequireAuth roles={["customer"]} />}>
            <Route path="/profile" element={withSuspense(ProfileLayout)}>
              <Route index element={withSuspense(Profile)} />
              <Route path="addresses" element={withSuspense(Addresses)} />
              <Route path="password" element={withSuspense(ChangePassword)} />
              <Route path="orders" element={withSuspense(Orders)} />
              <Route path="wishlist" element={withSuspense(Wishlist)} />
              <Route path="messages" element={withSuspense(Messages)} />
              <Route path="preferences" element={withSuspense(Preferences)} />
            </Route>
          </Route>

          {/* Merchant Command Center Routes */}
          <Route element={<RequireAuth roles={["merchant"]} />}>
            <Route path="/merchant" element={withSuspense(MerchantLayout)}>
              <Route index element={withSuspense(MerchantDashboard)} />
              <Route path="settings" element={withSuspense(ShopSettings)} />
              <Route path="products" element={withSuspense(MerchantProducts)} />
              <Route path="orders" element={withSuspense(MerchantOrders)} />
              <Route path="messages" element={withSuspense(MerchantMessages)} />
              <Route path="discounts" element={withSuspense(MerchantDiscounts)} />
              <Route path="analytics" element={withSuspense(MerchantAnalytics)} />
              <Route path="earnings" element={withSuspense(MerchantEarnings)} />
            </Route>
          </Route>

          {/* Moderator Console Routes */}
          <Route element={<RequireAuth roles={["moderator"]} />}>
            <Route path="/moderator" element={withSuspense(IskoModLayout)}>
              <Route index element={withSuspense(ModDashboard)} />
              <Route path="reports" element={withSuspense(ReportLogs)} />
              <Route path="listings" element={withSuspense(ListingManagement)} />
              <Route path="reviews" element={withSuspense(ReviewModeration)} />
              <Route path="accounts" element={withSuspense(AccountModeration)} />
              <Route path="promotions" element={withSuspense(PromotedServices)} />
            </Route>
          </Route>

          {/* Admin Command Center Routes */}
          <Route element={<RequireAuth roles={["admin"]} />}>
            <Route path="/admin" element={withSuspense(AdminLayout)}>
              <Route index element={withSuspense(AdminDashboard)} />
              <Route path="verify" element={withSuspense(MerchantVerification)} />
              <Route path="accounts" element={withSuspense(AccountManagement)} />
              <Route path="costs" element={withSuspense(OperationalCosts)} />
              <Route path="moderators" element={withSuspense(Moderators)} />
              <Route path="reports" element={withSuspense(ReportLogs)} />
              <Route path="logs" element={withSuspense(AccountLogs)} />
              <Route path="listings" element={withSuspense(ListingManagement)} />
              <Route path="reviews" element={withSuspense(ReviewModeration)} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
