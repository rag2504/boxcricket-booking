import { useState, useEffect } from "react";
import { User, Calendar, Clock, ArrowLeft, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BookingData {
  _id: string;
  bookingId: string;
  groundId: {
    _id: string;
    name: string;
    location: {
      address: string;
    };
  };
  bookingDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
    duration: number;
  };
  playerDetails: {
    teamName?: string;
    playerCount: number;
    contactPerson: {
      name: string;
      phone: string;
      email: string;
    };
    requirements?: string;
  };
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  pricing: {
    baseAmount: number;
    discount: number;
    taxes: number;
    totalAmount: number;
    currency: string;
  };
  createdAt: string;
}

// Countdown Timer Component for Pending Bookings
const BookingCountdown = ({ createdAt, onExpired }: { createdAt: string; onExpired: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const bookingTime = new Date(createdAt).getTime();
      const expiryTime = bookingTime + (5 * 60 * 1000); // 5 minutes
      const now = new Date().getTime();
      const remaining = Math.max(0, expiryTime - now);
      
      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        onExpired();
      }
      
      return remaining;
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    return () => clearInterval(timer);
  }, [createdAt, isExpired, onExpired]);

  if (timeLeft <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
        <div className="flex items-center space-x-2 text-red-700">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-medium">⏰ Booking expired - will be cancelled soon</span>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-orange-700">
          <Timer className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            Complete payment in {minutes}:{seconds.toString().padStart(2, '0')} or booking will be cancelled
          </span>
        </div>
        <div className="text-orange-800 font-mono font-bold">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      <div className="mt-2 bg-orange-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-orange-500 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (5 * 60 * 1000)) * 100}%` }}
        />
      </div>
    </div>
  );
};

const Bookings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBookings();
    }
  }, [isAuthenticated]);

  const fetchUserBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const response: any = await bookingsApi.getMyBookings();
      //@ts-ignore
      if (response.success) {
        //@ts-ignore
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load your bookings");
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleBookingExpired = (bookingId: string) => {
    console.log(`Booking ${bookingId} has expired, refreshing booking list...`);
    // Refresh the booking list to get updated status
    fetchUserBookings();
  };

  // Manual cleanup function for testing
  const triggerManualCleanup = async () => {
    try {
      const token = localStorage.getItem('boxcric_token');
      const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://box-junu.onrender.com/api');
      
      const response = await fetch(`${apiBase}/bookings/cleanup-expired`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Cleanup completed: ${data.expiredCount} expired bookings processed`);
        fetchUserBookings(); // Refresh the booking list
      } else {
        toast.error('Cleanup failed: ' + data.message);
      }
    } catch (error) {
      console.error('Manual cleanup error:', error);
      toast.error('Failed to trigger cleanup');
    }
  };

  const getStatusColor = (status: BookingData["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot: { startTime: string; endTime: string }) => {
    return `${timeSlot.startTime} to ${timeSlot.endTime}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Please login to view your bookings
              </h3>
              <p className="text-gray-600 mb-4">
                You need to be logged in to access your booking history.
              </p>
              <Button 
                className="bg-cricket-green hover:bg-cricket-green/90"
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="bg-cricket-green hover:bg-cricket-green/90 w-full sm:w-auto"
              onClick={() => navigate("/")}
            >
              Book New Ground
            </Button>
            {/* Development cleanup button */}
            {import.meta.env.DEV && (
              <Button 
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-50 w-full sm:w-auto"
                onClick={triggerManualCleanup}
              >
                🧹 Force Cleanup
              </Button>
            )}
          </div>
        </div>

        {/* Bookings Content */}
        {isLoadingBookings ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings.filter(b => b.groundId).length > 0 ? (
          <div className="space-y-4">
            {bookings.filter(b => b.groundId).map((booking) => (
              <Card key={booking._id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {booking.groundId ? booking.groundId.name : "Unknown Ground"}
                        </h3>
                        <Badge
                          className={getStatusColor(booking.status)}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{formatTime(booking.timeSlot)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span>{booking.playerDetails.playerCount} players</span>
                        </div>
                      </div>

                      {booking.playerDetails.teamName && (
                        <div className="mt-2 text-sm text-gray-600">
                          Team: {booking.playerDetails.teamName}
                        </div>
                      )}

                      <div className="mt-3 text-sm text-gray-600">
                        Booked on {formatDate(booking.createdAt)}
                      </div>
                      
                      {/* Countdown Timer for Pending Bookings */}
                      {booking.status === "pending" && (
                        <BookingCountdown 
                          createdAt={booking.createdAt} 
                          onExpired={() => handleBookingExpired(booking._id)}
                        />
                      )}
                    </div>

                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <div className="text-xl font-bold text-cricket-green">
                        ₹{booking.pricing.totalAmount}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Amount
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/booking/${booking._id}`)}
                    >
                      View Details
                    </Button>
                    {booking.status === "confirmed" && (
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                    )}
                    {booking.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start exploring cricket grounds and make your first booking!
              </p>
              <Button 
                className="bg-cricket-green hover:bg-cricket-green/90"
                onClick={() => navigate("/")}
              >
                Explore Grounds
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Bookings;
