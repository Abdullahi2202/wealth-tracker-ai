
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
// Remove incorrect import: import RegistrationForm from "./pages/RegistrationForm";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Assistant from "./pages/Assistant";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import Expenses from "./pages/Expenses";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import Investments from "./pages/Investments";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Register from "./pages/Register"; // Correct import!

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* Correct usage! */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
