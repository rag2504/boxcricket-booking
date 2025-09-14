// Use the same API base URL logic as the rest of the app
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://box-junu.onrender.com/api";

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, AlertTriangle, Home, Receipt, MapPin } from "lucide-react";

function getQueryParam(search: string, key: string) {
  const params = new URLSearchParams(search);
  return params.get(key);
}

interface PaymentStatus {
  status: string;
  bookingId?: string;
  orderId?: string;
  amount?: number;
  bookingDetails?: any;
}

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        // Get parameters from URL
        const bookingId = getQueryParam(location.search, "booking_id");
        const orderId = getQueryParam(location.search, "order_id");
        const paymentSessionId = getQueryParam(location.search, "payment_session_id");
        const txStatus = getQueryParam(location.search, "txStatus") || getQueryParam(location.hash, "txStatus");

        console.log("Payment callback params:", { bookingId, orderId, paymentSessionId, txStatus });

        if (!bookingId) {
          setError("No booking ID found in callback URL.");
          setLoading(false);
          return;
        }

        // If we have payment success parameters, verify the payment first
        if (orderId && paymentSessionId && txStatus && txStatus.toUpperCase() === "SUCCESS") {
          console.log("Payment success detected, verifying payment...");

          try {
            const token = localStorage.getItem("boxcric_token");
            const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                order_id: orderId,
                payment_session_id: paymentSessionId,
                bookingId: bookingId
              })
            });

            const verifyData = await verifyResponse.json();
            console.log("Payment verification response:", verifyData);

            if (verifyData.success) {
              // Payment verified successfully, booking should be confirmed
              setPaymentStatus({
                status: "SUCCESS",
                bookingId,
                orderId,
                amount: verifyData.booking?.pricing?.totalAmount,
                bookingDetails: verifyData.booking
              });
              setLoading(false);
              return;
            } else {
              console.error("Payment verification failed:", verifyData.message);
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
          }
        }

        // First, try to get status from URL parameters (Cashfree callback)
        if (txStatus) {
          console.log("Using txStatus from URL:", txStatus);
          const status = mapCashfreeStatus(txStatus);
          setPaymentStatus({
            status,
            bookingId,
            orderId
          });
          setLoading(false);
          return;
        }

        // If no txStatus, fetch from backend
        console.log("Fetching booking status from backend...");
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
        const data = await response.json();

        if (data.success && data.booking) {
          const booking = data.booking;
          const paymentStatus = booking.payment?.status || "pending";
          const bookingStatus = booking.status;

          console.log("PaymentCallback: Backend response:", { paymentStatus, bookingStatus, booking });
          console.log("PaymentCallback: booking.groundId type:", typeof booking?.groundId);
          console.log("PaymentCallback: booking.groundId value:", booking?.groundId);
          console.log("PaymentCallback: booking.ground value:", booking?.ground);

          // Determine final status based on both payment and booking status
          let finalStatus = "PENDING";
          if (paymentStatus === "completed" && bookingStatus === "confirmed") {
            finalStatus = "SUCCESS";
          } else if (paymentStatus === "failed" || bookingStatus === "cancelled") {
            finalStatus = "FAILED";
          } else if (paymentStatus === "pending" && bookingStatus === "pending") {
            finalStatus = "PENDING";
          }

          setPaymentStatus({
            status: finalStatus,
            bookingId,
            orderId: booking.payment?.cashfreeOrderId,
            amount: booking.pricing?.totalAmount,
            bookingDetails: booking
          });
        } else {
          // Fallback: try to get status from Cashfree directly
          console.log("Trying Cashfree status endpoint...");
          const cashfreeResponse = await fetch(`${API_BASE_URL}/payments/status/${bookingId}`);
          const cashfreeData = await cashfreeResponse.json();

          if (cashfreeData.success && cashfreeData.status) {
            const status = mapCashfreeStatus(cashfreeData.status);
            setPaymentStatus({
              status,
              bookingId,
              orderId: cashfreeData.cashfreeOrderId
            });
          } else {
            setError("Could not fetch payment status. Please check your bookings.");
          }
        }
      } catch (error) {
        console.error("Payment status fetch error:", error);
        setError("Failed to fetch payment status. Please check your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [location]);

  // Helper function to map Cashfree status to our status
  const mapCashfreeStatus = (status: string): string => {
    const statusUpper = status.toUpperCase();
    if (["SUCCESS", "PAID", "COMPLETED"].includes(statusUpper)) {
      return "SUCCESS";
    } else if (["FAILED", "CANCELLED", "EXPIRED", "TERMINATED", "USER_DROPPED"].includes(statusUpper)) {
      return "FAILED";
    } else if (["PENDING"].includes(statusUpper)) {
      return "PENDING";
    } else if (["ACTIVE"].includes(statusUpper)) {
      // ACTIVE means payment session is still active but user might have cancelled
      // Check if we have URL parameters indicating cancellation
      const urlParams = new URLSearchParams(window.location.search);
      const txStatus = urlParams.get('txStatus');
      if (txStatus && ["CANCELLED", "FAILED", "USER_DROPPED"].includes(txStatus.toUpperCase())) {
        return "FAILED";
      }
      return "PENDING";
    }
    return statusUpper;
  };

  // Helper functions to extract ground information
  const getGroundName = (ground: any): string => {
    if (!ground) return "Ground";
    
    // Handle different ground data structures
    if (typeof ground === "string") {
      return "Ground"; // Just the ID was provided
    }
    
    if (typeof ground === "object") {
      return ground.name || "Ground";
    }
    
    return "Ground";
  };
  
  const getGroundImage = (ground: any): string => {
    if (!ground) return "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
    
    // Handle different ground data structures
    if (typeof ground === "string") {
      return "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
    }
    
    if (typeof ground === "object") {
      // Check if images array exists and has items
      if (ground.images && Array.isArray(ground.images) && ground.images.length > 0) {
        const imgItem = ground.images[0];
        if (typeof imgItem === "string") {
          return imgItem.startsWith('http') ? imgItem : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
        } else if (imgItem && typeof imgItem === "object" && "url" in imgItem) {
          return imgItem.url && imgItem.url.startsWith('http') ? imgItem.url : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
        }
      }
    }
    
    return "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
  };
  
  const getGroundAddress = (ground: any): string => {
    if (!ground) return "No address available";
    
    // Handle different ground data structures
    if (typeof ground === "string") {
      return "No address available";
    }
    
    if (typeof ground === "object") {
      return ground.location?.address ||
        (ground.location ? ground.location : "") ||
        "No address available";
    }
    
    return "No address available";
  };

  // Countdown and navigation logic
  useEffect(() => {
    if (!paymentStatus) return;

    const { status } = paymentStatus;

    if (status === "SUCCESS") {
      toast.success("Payment successful! Your booking is confirmed.");
    } else if (status === "FAILED") {
      toast.error("Payment failed or was cancelled.");
    }

    // Start countdown for navigation
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (status === "SUCCESS") {
            navigate("/profile/bookings");
          } else {
            navigate("/");
          }
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
      case "PENDING":
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-orange-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return {
          title: "Payment Successful!",
          description: "Your booking has been confirmed successfully.",
          color: "text-green-600"
        };
      case "FAILED":
        return {
          title: "Payment Failed",
          description: "Your payment could not be processed or was cancelled.",
          color: "text-red-600"
        };
      case "PENDING":
        return {
          title: "Payment Pending",
          description: "Your payment is still being processed. Please wait.",
          color: "text-yellow-600"
        };
      default:
        return {
          title: "Unknown Status",
          description: "We're checking your payment status. Please wait.",
          color: "text-orange-600"
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
              <div className="flex justify-center">
                <Clock className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Payment Status...
                </h3>
                <p className="text-gray-600">
                  Please wait while we verify your payment.
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="flex justify-center">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Error
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate("/profile/bookings")}
                    className="w-full"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Check My Bookings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </div>
            </>
          ) : paymentStatus ? (
            <>
              <div className="flex justify-center">
                {getStatusIcon(paymentStatus.status)}
              </div>

              <div>
                <h3 className={`text-xl font-semibold mb-2 ${getStatusMessage(paymentStatus.status).color}`}>
                  {getStatusMessage(paymentStatus.status).title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {getStatusMessage(paymentStatus.status).description}
                </p>
              </div>

              {/* Booking Details */}
              {paymentStatus.bookingId && (
                <div className="space-y-4">
                  {/* Ground Information */}
                  {paymentStatus.bookingDetails?.groundId && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={getGroundImage(paymentStatus.bookingDetails.groundId)}
                            alt={getGroundName(paymentStatus.bookingDetails.groundId)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {getGroundName(paymentStatus.bookingDetails.groundId)}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{getGroundAddress(paymentStatus.bookingDetails.groundId)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-medium">{paymentStatus.bookingDetails?.bookingId || paymentStatus.bookingId}</span>
                    </div>
                    {paymentStatus.orderId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">{paymentStatus.orderId}</span>
                      </div>
                    )}
                    {paymentStatus.amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">₹{paymentStatus.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {paymentStatus.status === "SUCCESS" ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Redirecting to your bookings in {countdown} seconds...
                    </p>
                    <Button
                      onClick={() => navigate("/profile/bookings")}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      View My Bookings
                    </Button>
                  </>
                ) : paymentStatus.status === "FAILED" ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Redirecting to home in {countdown} seconds...
                    </p>
                    <Button
                      onClick={() => navigate("/")}
                      className="w-full"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Try Booking Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/profile/bookings")}
                      className="w-full"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Check My Bookings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate("/profile/bookings")}
                      className="w-full"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Check My Bookings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="w-full"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
