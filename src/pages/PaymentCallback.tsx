import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Home,
  Receipt,
} from "lucide-react";
import { bookingsApi, paymentsApi } from "@/lib/api";

function getQueryParam(search: string, key: string) {
  return new URLSearchParams(search).get(key);
}

interface PaymentStatus {
  status: string;
  bookingId?: string;
  orderId?: string;
  amount?: number;
  bookingDetails?: Record<string, unknown>;
}

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const bookingId = getQueryParam(location.search, "booking_id");
        const orderId = getQueryParam(location.search, "order_id");
        const statusParam = getQueryParam(location.search, "status");

        if (!bookingId) {
          setError("No booking ID found in callback URL.");
          setLoading(false);
          return;
        }

        const bookingRes = (await bookingsApi.getBooking(bookingId)) as {
          success?: boolean;
          booking?: {
            status?: string;
            bookingId?: string;
            payment?: { status?: string; razorpayOrderId?: string };
            pricing?: { totalAmount?: number };
            [key: string]: unknown;
          };
        };

        if (bookingRes.success && bookingRes.booking) {
          const booking = bookingRes.booking;
          let finalStatus = "PENDING";
          if (
            booking.payment?.status === "completed" &&
            booking.status === "confirmed"
          ) {
            finalStatus = "SUCCESS";
          } else if (
            booking.payment?.status === "failed" ||
            booking.status === "cancelled"
          ) {
            finalStatus = "FAILED";
          } else if (statusParam === "success") {
            finalStatus = "SUCCESS";
          }

          setPaymentStatus({
            status: finalStatus,
            bookingId,
            orderId: booking.payment?.razorpayOrderId || orderId || undefined,
            amount: booking.pricing?.totalAmount,
            bookingDetails: booking,
          });
          setLoading(false);
          return;
        }

        const statusRes = (await paymentsApi.getPaymentStatus(bookingId)) as {
          success?: boolean;
          status?: string;
          razorpayOrderId?: string;
        };

        if (statusRes.success) {
          const s = String(statusRes.status || "").toLowerCase();
          setPaymentStatus({
            status: s === "paid" || s === "completed" ? "SUCCESS" : "PENDING",
            bookingId,
            orderId: statusRes.razorpayOrderId || orderId || undefined,
          });
        } else {
          setError("Could not fetch payment status. Please check your bookings.");
        }
      } catch (err) {
        console.error("Payment callback error:", err);
        setError("Failed to fetch payment status.");
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [location]);

  useEffect(() => {
    if (!paymentStatus) return;

    const { status } = paymentStatus;

    if (status === "SUCCESS") {
      toast.success("Payment successful! Your booking is confirmed.");
    } else if (status === "FAILED") {
      toast.error("Payment failed or was cancelled.");
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(status === "SUCCESS" ? "/profile/bookings" : "/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Clock className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return {
          title: "Payment Successful!",
          description: "Your CricBox booking has been confirmed.",
          color: "text-green-600",
        };
      case "FAILED":
        return {
          title: "Payment Failed",
          description: "Your payment could not be processed or was cancelled.",
          color: "text-red-600",
        };
      default:
        return {
          title: "Payment Pending",
          description: "We're confirming your payment. Check My Bookings shortly.",
          color: "text-yellow-600",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {loading ? (
            <>
              <Clock className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
              <p className="text-gray-600">Verifying your payment…</p>
            </>
          ) : error ? (
            <>
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => navigate("/profile/bookings")} className="w-full">
                <Receipt className="w-4 h-4 mr-2" />
                My Bookings
              </Button>
            </>
          ) : paymentStatus ? (
            <>
              <div className="flex justify-center">
                {getStatusIcon(paymentStatus.status)}
              </div>
              <h3
                className={`text-xl font-semibold ${getStatusMessage(paymentStatus.status).color}`}
              >
                {getStatusMessage(paymentStatus.status).title}
              </h3>
              <p className="text-gray-600">
                {getStatusMessage(paymentStatus.status).description}
              </p>
              {paymentStatus.bookingId && (
                <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking</span>
                    <span className="font-medium">
                      {(paymentStatus.bookingDetails as { bookingId?: string })
                        ?.bookingId || paymentStatus.bookingId}
                    </span>
                  </div>
                  {paymentStatus.amount != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium">₹{paymentStatus.amount}</span>
                    </div>
                  )}
                </div>
              )}
              {paymentStatus.status === "SUCCESS" ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => navigate("/profile/bookings")}
                >
                  View My Bookings ({countdown}s)
                </Button>
              ) : (
                <Button className="w-full" onClick={() => navigate("/")}>
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
