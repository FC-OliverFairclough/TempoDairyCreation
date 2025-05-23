import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import HomePage from "./components/public/HomePage";
import ProductsPage from "./components/public/ProductsPage";
import UserDashboard from "./components/public/UserDashboard";
import OrderHistory from "./components/public/OrderHistory";
import ContactPage from "./components/public/ContactPage";
import AboutPage from "./components/public/AboutPage";
import CartPage from "./components/public/CartPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import routes from "tempo-routes";

// Lazy load components that aren't immediately needed
const ProfileEdit = lazy(() => import("./components/public/ProfileEdit"));
const DeliveryPreferences = lazy(
  () => import("./components/public/DeliveryPreferences"),
);
const Checkout = lazy(() => import("./components/public/Checkout"));
const OrderConfirmation = lazy(
  () => import("./components/public/OrderConfirmation"),
);
const OrderDetails = lazy(() => import("./components/public/OrderDetails"));
const Login = lazy(() => import("./components/public/auth/Login"));
const Signup = lazy(() => import("./components/public/auth/Signup"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-history"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/delivery-preferences"
            element={
              <ProtectedRoute>
                <DeliveryPreferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-details/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" />
          )}
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
