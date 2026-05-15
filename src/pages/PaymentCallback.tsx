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
  MapPin,
} from "lucide-react";
import { paymentsApi, bookingsApi } from "@/lib/api";

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
    const fetchPaymentStatus = async () => {
      try {
        const bookingId = getQueryParam(location.search, "booking_id");
        const orderId = getQueryParam(location.search, "order_id");
        const paymentSessionId = getQueryParam(location.search, "payment_session_id");
        const txStatus =
          getQueryParam(location.search, "txStatus") ||
          getQueryParam(location.hash, "txStatus");
        const orderStatus = getQueryParam(location.search, "order_status");
        const isMock = getQueryParam(location.search, "mock") === "true";

        console.log("💳 Payment callback params:", {
          bookingId,
          orderId,
          paymentSessionId,
          txStatus,
          orderStatus,
          isMock,
        });

        if (!bookingId) {
          setError("No booking ID found in callback URL.");
          setLoading(false);
          return;
        }

        const verifyWithBackend = async (mock = false) => {
          const verifyData = (await paymentsApi.verifyPayment({
            order_id: orderId || `order_${Date.now()}`,
            payment_session_id: paymentSessionId || undefined,
            bookingId,
            mock,
          })) as {
            success?: boolean;
            message?: string;
            status?: string;
            booking?: {
              pricing?: { totalAmount?: number };
              [key: string]: unknown;
            };
          };

          console.log("💳 Payment verification response:", verifyData);

          if (verifyData.success) {
            setPaymentStatus({
              status: "SUCCESS",
              bookingId,
              orderId: orderId || undefined,
              amount: verifyData.booking?.pricing?.totalAmount,
              bookingDetails: verifyData.booking,
            });
            return true;
          }

          if (verifyData.status === "pending") {
            setPaymentStatus({ status: "PENDING", bookingId, orderId: orderId || undefined });
            return true;
          }

          return false;
        };

        if (isMock || orderId?.startsWith("mock_")) {
          await verifyWithBackend(true);
          setLoading(false);
          return;
        }

        if (orderStatus) {
          const mapped = mapCashfreeStatus(orderStatus);
          if (mapped === "SUCCESS" && orderId) {
            const ok = await verifyWithBackend(false);
            if (ok) {
              setLoading(false);
              return;
            }
          }
          setPaymentStatus({ status: mapped, bookingId, orderId: orderId || undefined });
          setLoading(false);
          return;
        }

        if (orderId) {
          const ok = await verifyWithBackend(false);
          if (ok) {
            setLoading(false);
            return;
          }
        }

        if (txStatus) {
          const status = mapCashfreeStatus(txStatus);
          if (status === "SUCCESS" && orderId) {
            const ok = await verifyWithBackend(false);
            if (ok) {
              setLoading(false);
              return;
            }
          }
          setPaymentStatus({ status, bookingId, orderId: orderId || undefined });
          setLoading(false);
          return;
        }

        const bookingRes = (await bookingsApi.getBooking(bookingId)) as {
          success?: boolean;
          booking?: {
            status?: string;
            payment?: { status?: string; cashfreeOrderId?: string };
            pricing?: { totalAmount?: number };
            [key: string]: unknown;
          };
        };

        if (bookingRes.success && bookingRes.booking) {
          const booking = bookingRes.booking;
          const payStatus = booking.payment?.status || "pending";
          const bookingStatus = booking.status;

          let finalStatus = "PENDING";
          if (payStatus === "completed" && bookingStatus === "confirmed") {
            finalStatus = "SUCCESS";
          } else if (payStatus === "failed" || bookingStatus === "cancelled") {
            finalStatus = "FAILED";
          }

          setPaymentStatus({
            status: finalStatus,
            bookingId,
            orderId: booking.payment?.cashfreeOrderId,
            amount: booking.pricing?.totalAmount,
            bookingDetails: booking,
          });
          setLoading(false);
          return;
        }

        const statusRes = (await paymentsApi.getPaymentStatus(
          bookingId,
          orderId || undefined
        )) as {
          success?: boolean;
          status?: string;
          cashfreeOrderId?: string;
        };

        if (statusRes.success && statusRes.status) {
          setPaymentStatus({
            status: mapCashfreeStatus(statusRes.status),
            bookingId,
            orderId: statusRes.cashfreeOrderId || orderId || undefined,
          });
        } else {
          setError("Could not fetch payment status. Please check your bookings.");
        }
      } catch (err) {
        console.error("Payment status fetch error:", err);
        setError("Failed to fetch payment status. Please check your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [location]);

  const mapCashfreeStatus = (status: string): string => {
    const statusUpper = status.toUpperCase();
    if (["SUCCESS", "PAID", "COMPLETED"].includes(statusUpper)) return "SUCCESS";
    if (
      ["FAILED", "CANCELLED", "EXPIRED", "TERMINATED", "USER_DROPPED"].includes(
        statusUpper
      )
    ) {
      return "FAILED";
    }
    if (["PENDING", "ACTIVE"].includes(statusUpper)) return "PENDING";
    return statusUpper;
  };

  const getGroundName = (ground: unknown): string => {
    if (!ground || typeof ground === "string") return "Ground";
    if (typeof ground === "object" && ground !== null && "name" in ground) {
      return String((ground as { name?: string }).name || "Ground");
    }
    return "Ground";
  };

  const getGroundImage = (ground: unknown): string => {
    const fallback =
      "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
    if (!ground || typeof ground === "string") return fallback;
    if (typeof ground === "object" && ground !== null && "images" in ground) {
      const images = (ground as { images?: unknown[] }).images;
      if (Array.isArray(images) && images.length > 0) {
        const img = images[0];
        if (typeof img === "string" && img.startsWith("http")) return img;
        if (typeof img === "object" && img !== null && "url" in img) {
          const url = (img as { url?: string }).url;
          if (url?.startsWith("http")) return url;
        }
      }
    }
    return fallback;
  };

  const getGroundAddress = (ground: unknown): string => {
    if (!ground || typeof ground === "string") return "No address available";
    if (typeof ground === "object" && ground !== null && "location" in ground) {
      const loc = (ground as { location?: { address?: string } | string }).location;
      if (typeof loc === "object" && loc?.address) return loc.address;
      if (typeof loc === "string") return loc;
    }
    return "No address available";
  };

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
          color: "text-green-600",
        };
      case "FAILED":
        return {
          title: "Payment Failed",
          description: "Your payment could not be processed or was cancelled.",
          color: "text-red-600",
        };
      case "PENDING":
        return {
          title: "Payment Pending",
          description: "Your payment is still being processed. Please wait.",
          color: "text-yellow-600",
        };
      default:
        return {
          title: "Unknown Status",
          description: "We're checking your payment status. Please wait.",
          color: "text-orange-600",
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
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
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
                <h3
                  className={`text-xl font-semibold mb-2 ${getStatusMessage(paymentStatus.status).color}`}
                >
                  {getStatusMessage(paymentStatus.status).title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {getStatusMessage(paymentStatus.status).description}
                </p>
              </div>

              {paymentStatus.bookingId && (
                <div className="space-y-4">
                  {paymentStatus.bookingDetails?.groundId && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={getGroundImage(paymentStatus.bookingDetails.groundId)}
                            alt={getGroundName(paymentStatus.bookingDetails.groundId)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {getGroundName(paymentStatus.bookingDetails.groundId)}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">
                              {getGroundAddress(paymentStatus.bookingDetails.groundId)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-medium">
                        {(paymentStatus.bookingDetails as { bookingId?: string })
                          ?.bookingId || paymentStatus.bookingId}
                      </span>
                    </div>
                    {paymentStatus.orderId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">{paymentStatus.orderId}</span>
                      </div>
                    )}
                    {paymentStatus.amount != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">₹{paymentStatus.amount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                    <Button onClick={() => navigate("/")} className="w-full">
                      <Home className="w-4 h-4 mr-2" />
                      Try Booking Again
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => navigate("/profile/bookings")}
                    className="w-full"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Check My Bookings
                  </Button>
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
