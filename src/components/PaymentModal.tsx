import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Shield, Clock, MapPin, Calendar, Users, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { paymentsApi, bookingsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

// Declare Cashfree types
declare global {
  interface Window {
    Cashfree: any;
  }
}

interface Booking {
  _id?: string; // MongoDB ID
  id: string; // Legacy ID for compatibility
  bookingId: string;
  groundId?: any;
  ground?: any;
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
    };
  };
  pricing?: {
    baseAmount?: number;
    discount?: number;
    taxes?: number;
    totalAmount?: number;
    duration?: number;
  };
  amount?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentSuccess: (booking: Booking) => void;
}

const PaymentModal = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}: PaymentModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [temporaryHoldId, setTemporaryHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [countdownTime, setCountdownTime] = useState<number>(0);

  // Create temporary hold when payment modal opens
  useEffect(() => {
    const createTemporaryHold = async () => {
      if (isOpen && booking && !temporaryHoldId) {
        try {
          console.log("Creating temporary hold for payment:", {
            groundId: booking.groundId?._id || booking.groundId,
            bookingDate: booking.bookingDate,
            timeSlot: `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`
          });
          
          const holdResponse = await bookingsApi.createTemporaryHold({
            groundId: booking.groundId?._id || booking.groundId,
            bookingDate: booking.bookingDate,
            timeSlot: `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`
          });
          
          if (holdResponse && (holdResponse as any).success) {
            const holdId = (holdResponse as any).holdId;
            const expiresAt = new Date((holdResponse as any).expiresAt);
            
            setTemporaryHoldId(holdId);
            setHoldExpiresAt(expiresAt);
            
            console.log("Temporary hold created for payment:", holdId);
            toast.success("Slot reserved for 5 minutes during payment!");
          }
        } catch (error) {
          console.error("Failed to create temporary hold:", error);
          // Don't show error to user as the booking can still proceed
        }
      }
    };
    
    createTemporaryHold();
  }, [isOpen, booking, temporaryHoldId]);

  // Countdown effect for temporary hold expiration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (holdExpiresAt) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = holdExpiresAt.getTime();
        const timeLeft = Math.max(0, expiry - now);
        
        setCountdownTime(Math.floor(timeLeft / 1000));
        
        if (timeLeft <= 0) {
          // Hold expired
          setTemporaryHoldId(null);
          setHoldExpiresAt(null);
          toast.warning("Your payment time has expired. Please try booking again.");
        }
      }, 1000);
    } else {
      setCountdownTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [holdExpiresAt]);

  // Cleanup effect to release hold when modal closes
  useEffect(() => {
    return () => {
      if (temporaryHoldId) {
        bookingsApi.releaseTemporaryHold(temporaryHoldId).catch(console.error);
      }
    };
  }, [temporaryHoldId]);

  // Enhanced dynamic amount calculation with proper ground data handling
  const bookingData = useMemo(() => {
    if (!booking) return null;

    console.log("PaymentModal: Processing booking data:", booking);
    console.log("PaymentModal: booking.groundId:", booking.groundId);
    console.log("PaymentModal: booking.ground:", booking.ground);
    console.log("PaymentModal: typeof booking.groundId:", typeof booking.groundId);

    // Enhanced ground data selection logic
    let ground = null;
    
    // Priority 1: Check if groundId is an object (populated from backend)
    if (booking.groundId && typeof booking.groundId === "object" && booking.groundId.name) {
      ground = booking.groundId;
      console.log("PaymentModal: Using booking.groundId (populated object)");
    }
    // Priority 2: Check if ground property exists and has data
    else if (booking.ground && typeof booking.ground === "object" && booking.ground.name) {
      ground = booking.ground;
      console.log("PaymentModal: Using booking.ground");
    }
    // Priority 3: Try groundId if it has name property (backward compatibility)
    else if (booking.groundId && booking.groundId.name) {
      ground = booking.groundId;
      console.log("PaymentModal: Using booking.groundId (fallback)");
    }
    // Priority 4: Create a ground object using fallback data if we only have string ID
    else {
      const groundId = booking.groundId || booking.ground;
      
      // Define city-specific fallback ground data
      const getFallbackGroundData = (groundId: string) => {
        // Try to determine city from ground ID or use city-specific fallbacks
        let cityFallback = {
          name: "Cricket Ground",
          cityName: "Unknown City",
          state: "India",
          address: "Cricket Ground Location"
        };
        
        // Detect city from ground ID or common patterns
        if (groundId && typeof groundId === 'string') {
          const lowerId = groundId.toLowerCase();
          if (lowerId.includes('mumbai') || lowerId.includes('marine')) {
            cityFallback = {
              name: "Marine Drive Cricket Arena",
              cityName: "Mumbai",
              state: "Maharashtra",
              address: "Marine Drive, Mumbai, Maharashtra"
            };
          } else if (lowerId.includes('delhi') || lowerId.includes('cp') || lowerId.includes('dwarka')) {
            cityFallback = {
              name: "Delhi Cricket Arena",
              cityName: "Delhi",
              state: "Delhi",
              address: "Central Delhi, New Delhi, Delhi"
            };
          } else if (lowerId.includes('ahmedabad') || lowerId.includes('gujarat')) {
            cityFallback = {
              name: "Ahmedabad Cricket Stadium",
              cityName: "Ahmedabad",
              state: "Gujarat",
              address: "Ahmedabad, Gujarat"
            };
          } else if (lowerId.includes('bangalore') || lowerId.includes('bengaluru') || lowerId.includes('karnataka')) {
            cityFallback = {
              name: "Bangalore Cricket Ground",
              cityName: "Bangalore",
              state: "Karnataka",
              address: "Bangalore, Karnataka"
            };
          } else if (lowerId.includes('chennai') || lowerId.includes('tamil')) {
            cityFallback = {
              name: "Chennai Cricket Ground",
              cityName: "Chennai",
              state: "Tamil Nadu",
              address: "Chennai, Tamil Nadu"
            };
          } else if (lowerId.includes('hyderabad') || lowerId.includes('telangana')) {
            cityFallback = {
              name: "Hyderabad Cricket Ground",
              cityName: "Hyderabad",
              state: "Telangana",
              address: "Hyderabad, Telangana"
            };
          } else if (lowerId.includes('kolkata') || lowerId.includes('bengal')) {
            cityFallback = {
              name: "Kolkata Cricket Ground",
              cityName: "Kolkata",
              state: "West Bengal",
              address: "Kolkata, West Bengal"
            };
          } else if (lowerId.includes('pune') || lowerId.includes('maharashtra')) {
            cityFallback = {
              name: "Pune Cricket Ground",
              cityName: "Pune",
              state: "Maharashtra",
              address: "Pune, Maharashtra"
            };
          }
        }
        
        return {
          _id: groundId,
          name: cityFallback.name,
          description: "Premium cricket ground with excellent facilities for competitive matches.",
          location: {
            address: cityFallback.address,
            cityName: cityFallback.cityName,
            state: cityFallback.state
          },
          price: {
            perHour: 1500,
            currency: "INR",
            discount: 0
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
              alt: `${cityFallback.name} - Main View`,
              isPrimary: true
            }
          ],
          amenities: ["Floodlights", "Parking", "Washroom", "Changing Room", "Drinking Water"],
          features: {
            pitchType: "Artificial Turf",
            capacity: 22,
            lighting: true,
            parking: true
          },
          rating: {
            average: 4.7,
            count: 89
          },
          owner: {
            name: "Ground Owner",
            contact: "N/A",
            email: "owner@example.com"
          }
        };
      };
      
      ground = getFallbackGroundData(groundId);
      console.log("PaymentModal: Using city-specific fallback ground data for ID:", groundId);
    }
    
    console.log("PaymentModal: Final selected ground data:", ground);
    console.log("PaymentModal: Ground name:", ground?.name);
    console.log("PaymentModal: Ground location:", ground?.location);
    console.log("PaymentModal: Ground address:", ground?.location?.address);

    let firstImage = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
    if (
      ground.images &&
      Array.isArray(ground.images) &&
      ground.images.length > 0
    ) {
      const imgItem = ground.images[0];
      if (typeof imgItem === "string") {
        firstImage = imgItem.startsWith('http') ? imgItem : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
      } else if (imgItem && typeof imgItem === "object" && "url" in imgItem) {
        firstImage = imgItem.url && imgItem.url.startsWith('http') ? imgItem.url : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
      }
    }

    const address =
      ground?.location?.address ||
      (ground?.location ? ground.location : "") ||
      "No address available";

    // --- Dynamic baseAmount calculation ---
    let baseAmount = booking?.pricing?.baseAmount ?? 0;
    let perHour = ground?.price?.perHour || 0;
    let duration = booking?.timeSlot?.duration || 1;
    // If price ranges exist, pick the correct perHour based on startTime
    if (Array.isArray(ground?.price?.ranges) && ground.price.ranges.length > 0 && booking?.timeSlot?.startTime) {
      const slot = ground.price.ranges.find(r => r.start === booking.timeSlot.startTime);
      if (slot) {
        perHour = slot.perHour;
      } else {
        perHour = ground.price.ranges[0].perHour;
      }
    }
    if (!baseAmount || baseAmount === 0) {
      baseAmount = perHour * duration;
    }

    const discount = booking?.pricing?.discount ?? 0;
    // --- Dynamic taxes and totalAmount calculation ---
    let taxes = booking?.pricing?.taxes ?? 0;
    if (!taxes && baseAmount > 0) {
      taxes = Math.round((baseAmount - discount) * 0.02);
    }
    let totalAmount = booking?.pricing?.totalAmount ?? 0;
    if (!totalAmount && baseAmount > 0) {
      totalAmount = (baseAmount - discount) + taxes;
    }

    return {
      ground,
      firstImage,
      address,
      baseAmount,
      discount,
      taxes,
      totalAmount,
      duration,
    };
  }, [booking]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!booking || !user || !bookingData) return;

    try {
      setIsProcessing(true);

      // Create order on backend
      const orderResponse = await paymentsApi.createOrder({
        bookingId: booking._id || booking.id,
      });

      console.log("Order response:", orderResponse);

      if (!(orderResponse as any)?.success) {
        throw new Error((orderResponse as any)?.message || "Failed to create order");
      }

      const { order, appId } = orderResponse as any;
      console.log("Order details:", order);
      console.log("Payment URL:", order.payment_url);

      if (!appId) {
        throw new Error("Payment app ID missing from server response.");
      }

      // Use Cashfree SDK for checkout
      if (typeof window.Cashfree !== 'undefined') {
        const cashfree = window.Cashfree({
          mode: order.mode || "production"
        });
        
        const checkoutOptions = {
          paymentSessionId: order.payment_session_id,
          redirectTarget: "_self"
        };
        
        console.log("Opening Cashfree checkout with:", checkoutOptions);
        cashfree.checkout(checkoutOptions);
      } else {
        // Fallback to direct redirect if SDK not loaded
        const cashfreeUrl = order.payment_url || `https://payments.cashfree.com/pg/view/${order.payment_session_id}`;
        window.location.href = cashfreeUrl;
      }

      // Poll for payment completion
      const checkPaymentStatus = async () => {
        try {
          const verifyResponse = await paymentsApi.verifyPayment({
            order_id: order.id,
            payment_session_id: order.payment_session_id,
            bookingId: booking._id || booking.id,
          });

          if ((verifyResponse as any)?.success) {
            toast.success("Payment successful! Booking confirmed.");
            onPaymentSuccess(booking);
            
            // Clean up temporary hold on success
            if (temporaryHoldId) {
              try {
                await bookingsApi.releaseTemporaryHold(temporaryHoldId);
                console.log("Released temporary hold after payment success:", temporaryHoldId);
              } catch (error) {
                console.error("Failed to release hold after payment:", error);
              }
              setTemporaryHoldId(null);
              setHoldExpiresAt(null);
            }
            
            // Let PaymentCallback handle the redirect after payment success
            onClose();
            return true;
          } else if ((verifyResponse as any)?.requiresRefund) {
            // Handle the case where slot was taken by someone else
            toast.error((verifyResponse as any)?.message || "This time slot is no longer available. Your payment will be refunded.");
            setIsProcessing(false);
            // Redirect to home instead of grounds
            setTimeout(() => {
              navigate("/");
            }, 3000);
            onClose();
            return true; // Stop checking
          }
        } catch (error: any) {
          // Check if it's a conflict error (409 status)
          if (error.response?.status === 409) {
            const errorData = error.response?.data;
            toast.error(errorData?.message || "This time slot is no longer available. Your payment will be refunded.");
            setIsProcessing(false);
            setTimeout(() => {
              navigate("/");
            }, 3000);
            onClose();
            return true; // Stop checking
          }
          // Don't log errors for pending payments - this is normal
          return false;
        }
        return false;
      };

      // Wait 5 seconds before starting to check payment status
      setTimeout(() => {
        // Check payment status every 5 seconds
        const interval = setInterval(async () => {
          const isCompleted = await checkPaymentStatus();
          if (isCompleted) {
            clearInterval(interval);
            setIsProcessing(false);
          }
        }, 5000);

        // Stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(interval);
          setIsProcessing(false);
          toast.warning("Payment check timed out. Please check your booking status.");
        }, 300000); // 5 minutes
      }, 5000); // Wait 5 seconds before first check

    } catch (error: any) {
      console.error("Payment initiation error:", error);
      toast.error("Payment failed to initialize. Please try again.");
      setIsProcessing(false);
    }
  }, [booking, user, bookingData, onPaymentSuccess, onClose]);

  if (!booking || !bookingData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={async (open) => {
      if (!open) {
        // Clean up temporary hold when modal closes
        if (temporaryHoldId) {
          try {
            await bookingsApi.releaseTemporaryHold(temporaryHoldId);
            console.log("Released temporary hold on modal close:", temporaryHoldId);
          } catch (error) {
            console.error("Failed to release hold on close:", error);
          }
          setTemporaryHoldId(null);
          setHoldExpiresAt(null);
        }
        
        // Only show cancellation message and redirect if user manually closed the modal
        // Don't redirect if payment is in progress or completed
        if (!isProcessing) {
          toast.info("Payment cancelled by user.");
        }
      }
      onClose();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="payment-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-cricket-green flex items-center justify-center gap-3">
            Complete Your Payment
            {temporaryHoldId && countdownTime > 0 && (
              <div className="bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 animate-pulse">
                <Timer className="w-3 h-3" />
                <span>{Math.floor(countdownTime / 60)}:{(countdownTime % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
          </DialogTitle>
          <DialogDescription id="payment-description" className="sr-only">
            Complete your payment securely via Cashfree payment gateway
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={bookingData.firstImage}
                  alt={bookingData.ground?.name || "Ground"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {bookingData.ground?.name || "Cricket Ground"}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate">{bookingData.address}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(booking.bookingDate)}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {booking.playerDetails.playerCount} players
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Base Amount</span>
                <span>{formatCurrency(bookingData.baseAmount)}</span>
              </div>
              {bookingData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(bookingData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Convenience Fee (2%)</span>
                <span>{formatCurrency(bookingData.taxes)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold text-cricket-green">
                <span>Total Amount</span>
                <span>{formatCurrency(bookingData.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-green-800 mb-1">Secure Payment</div>
                <div className="text-sm text-green-700">
                  Your payment is protected by 256-bit SSL encryption and processed securely through Cashfree.
                  All major payment methods are supported.
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || bookingData.totalAmount <= 0}
              className="w-full bg-gradient-to-r from-cricket-green to-green-600 hover:from-cricket-green/90 hover:to-green-600/90 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Redirecting to Payment Gateway...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6" />
                  <span>Pay {formatCurrency(bookingData.totalAmount)}</span>
                </div>
              )}
            </Button>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>This booking will expire in 5 minutes if not paid</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;