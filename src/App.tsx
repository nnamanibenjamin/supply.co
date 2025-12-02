import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignupPage from "./pages/signup/page.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import ProductPage from "./pages/products/[id]/page.tsx";
import SupplierProductsPage from "./pages/dashboard/products/page.tsx";
import AddProductPage from "./pages/dashboard/products/add/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/dashboard/products" element={<SupplierProductsPage />} />
          <Route path="/dashboard/products/add" element={<AddProductPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
