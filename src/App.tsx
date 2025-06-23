
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Assistant from "./pages/Assistant";
import Payments from "./pages/Payments";
import PaymentsHome from "./pages/PaymentsHome";
import SendPayment from "./pages/SendPayment";
import TopUpWallet from "./pages/TopUpWallet";
import AddCard from "./pages/AddCard";
import ReceivedPaymentsMobile from "./pages/ReceivedPaymentsMobile";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import Expenses from "./pages/Expenses";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import Investments from "./pages/Investments";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import VerifyIdentity from "@/pages/VerifyIdentity";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/home" element={<PaymentsHome />} />
            <Route path="/payments/send" element={<SendPayment />} />
            <Route path="/payments/topup" element={<TopUpWallet />} />
            <Route path="/payments/add-card" element={<AddCard />} />
            <Route path="/payments/received" element={<ReceivedPaymentsMobile />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify-identity" element={<VerifyIdentity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
