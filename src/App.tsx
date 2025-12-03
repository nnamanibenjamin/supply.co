import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignupPage from "./pages/signup/page.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import ProductsPage from "./pages/products/page.tsx";
import ProductPage from "./pages/products/[id]/page.tsx";
import SupplierProductsPage from "./pages/dashboard/products/page.tsx";
import AddProductPage from "./pages/dashboard/products/add/page.tsx";
import EditProductPage from "./pages/dashboard/products/edit/[id]/page.tsx";
import CreateRFQPage from "./pages/rfq/create/page.tsx";
import HospitalRFQsPage from "./pages/dashboard/rfqs/page.tsx";
import RFQDetailPage from "./pages/dashboard/rfqs/[id]/page.tsx";
import SupplierRFQsPage from "./pages/dashboard/supplier-rfqs/page.tsx";
import SubmitQuotePage from "./pages/dashboard/supplier-rfqs/[id]/quote/page.tsx";
import CreditsPage from "./pages/dashboard/credits/page.tsx";
import TransactionHistoryPage from "./pages/dashboard/credits/history/page.tsx";
import QuotationsPage from "./pages/dashboard/quotations/page.tsx";
import QuotationDetailPage from "./pages/dashboard/quotations/[id]/page.tsx";
import NotificationsPage from "./pages/dashboard/notifications/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/dashboard/products" element={<SupplierProductsPage />} />
          <Route path="/dashboard/products/add" element={<AddProductPage />} />
          <Route path="/dashboard/products/edit/:id" element={<EditProductPage />} />
          <Route path="/rfq/create" element={<CreateRFQPage />} />
          <Route path="/dashboard/rfqs" element={<HospitalRFQsPage />} />
          <Route path="/dashboard/rfqs/:id" element={<RFQDetailPage />} />
          <Route path="/dashboard/supplier-rfqs" element={<SupplierRFQsPage />} />
          <Route path="/dashboard/supplier-rfqs/:id/quote" element={<SubmitQuotePage />} />
          <Route path="/dashboard/credits" element={<CreditsPage />} />
          <Route path="/dashboard/credits/history" element={<TransactionHistoryPage />} />
          <Route path="/dashboard/quotations" element={<QuotationsPage />} />
          <Route path="/dashboard/quotations/:id" element={<QuotationDetailPage />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
