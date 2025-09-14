import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Bookings from "./pages/Bookings";
import Favorites from "./pages/Favorites";
import About from "./pages/About";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import BookingDetails from "./pages/BookingDetails";
import GroundDetails from "./pages/GroundDetails";
import NotFound from "./pages/NotFound";
import PaymentCallback from "./pages/PaymentCallback";
import Notifications from "./pages/Notifications";
import Footer from "./components/Footer";
import OwnerPanel from "./pages/OwnerPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/bookings" element={<Bookings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="/ground/:id" element={<GroundDetails />} />
              <Route path="/booking/:id" element={<BookingDetails />} />
              <Route path="/owner-panel" element={<OwnerPanel />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
