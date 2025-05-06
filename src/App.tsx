import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import HomePage from "./components/public/HomePage";
import ProductsPage from "./components/public/ProductsPage";
import UserDashboard from "./components/public/UserDashboard";
import OrderHistory from "./components/public/OrderHistory";
import ContactPage from "./components/public/ContactPage";
import AboutPage from "./components/public/AboutPage";
import routes from "tempo-routes";

// Lazy load components that aren't immediately needed
const ProfileEdit = lazy(() => import("./components/public/ProfileEdit"));
const DeliveryPreferences = lazy(
  () => import("./components/public/DeliveryPreferences"),
);
const Checkout = lazy(() => import("./components/public/Checkout"));
const Login = lazy(() => import("./components/public/auth/Login"));
const Signup = lazy(() => import("./components/public/auth/Signup"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<Home />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/profile" element={<ProfileEdit />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/delivery-preferences"
            element={<DeliveryPreferences />}
          />
          <Route path="/checkout" element={<Checkout />} />
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" />
          )}
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
