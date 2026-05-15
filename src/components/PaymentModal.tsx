import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Shield, Clock, Calendar, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { paymentsApi, bookingsApi, type ApiErrorBody } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  openCashfreeCheckout,
  resolveCashfreeMode,
} from "@/lib/cashfreeCheckout";

interface Booking {
  _id?: string;
  id: string;
  bookingId: string;
  groundId?: { _id?: string; name?: string; price?: { perHour?: number } };
  ground?: { name?: string; price?: { perHour?: number } };
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
      email?: string;
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

type CreateOrderResponse = {
  success?: boolean;
  message?: string;
  code?: string;
  mode?: string;
  mock?: boolean;
  order?: {
    id: string;
    payment_session_id: string;
    amount?: number;
    mock?: boolean;
    mode?: string;
  };
};

function paymentErrorMessage(error: unknown): string {
  const err = error as ApiErrorBody;
  if (err.code === "CASHFREE_NOT_ACTIVATED") {
    return "Cashfree live account is not activated. On Render, set CASHFREE_ENVIRONMENT=SANDBOX with sandbox API keys, or complete KYC for live payments.";
  }
  if (err.code === "CASHFREE_ENV_MISMATCH") {
    return err.message || "Cashfree environment does not match your API keys.";
  }
  if (err.code === "CASHFREE_AUTH_FAILED") {
    return "Cashfree credentials are invalid for the selected environment (sandbox vs production).";
  }
  return err.message || "Payment failed to initialize";
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

  useEffect(() => {
    const createTemporaryHold = async () => {
      if (!isOpen || !booking || temporaryHoldId) return;
      const groundId = booking.groundId?._id || booking.groundId;
      if (!groundId) return;

      try {
        const holdResponse = (await bookingsApi.createTemporaryHold({
          groundId: String(groundId),
          bookingDate: booking.bookingDate,
          timeSlot: `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`,
        })) as { success?: boolean; holdId?: string; expiresAt?: string };

        if (holdResponse?.success && holdResponse.holdId) {
          setTemporaryHoldId(holdResponse.holdId);
          if (holdResponse.expiresAt) {
            setHoldExpiresAt(new Date(holdResponse.expiresAt));
          }
        }
      } catch (error) {
        console.warn("Temporary hold skipped:", error);
      }
    };

    createTemporaryHold();
  }, [isOpen, booking, temporaryHoldId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (holdExpiresAt) {
      interval = setInterval(() => {
        const timeLeft = Math.max(0, holdExpiresAt.getTime() - Date.now());
        setCountdownTime(Math.floor(timeLeft / 1000));
        if (timeLeft <= 0) {
          setTemporaryHoldId(null);
          setHoldExpiresAt(null);
        }
      }, 1000);
    } else {
      setCountdownTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [holdExpiresAt]);

  useEffect(() => {
    return () => {
      if (temporaryHoldId) {
        bookingsApi.releaseTemporaryHold(temporaryHoldId).catch(console.error);
      }
    };
  }, [temporaryHoldId]);

  const bookingData = useMemo(() => {
    if (!booking) return null;

    const ground =
      booking.groundId &&
      typeof booking.groundId === "object" &&
      booking.groundId.name
        ? booking.groundId
        : booking.ground || { name: "Cricket Ground" };

    let baseAmount = booking.pricing?.baseAmount ?? 0;
    const perHour = ground?.price?.perHour || 0;
    const duration = booking.timeSlot?.duration || 1;
    if (!baseAmount && perHour) baseAmount = perHour * duration;

    const discount = booking.pricing?.discount ?? 0;
    let taxes = booking.pricing?.taxes ?? 0;
    if (!taxes && baseAmount > 0) taxes = Math.round((baseAmount - discount) * 0.02);

    let totalAmount = booking.pricing?.totalAmount ?? 0;
    if (!totalAmount && baseAmount > 0) totalAmount = baseAmount - discount + taxes;

    return { ground, baseAmount, discount, taxes, totalAmount, duration };
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!booking || !user || !bookingData) return;

    const bookingId = String(booking._id || booking.id);

    try {
      setIsProcessing(true);
      console.log("💳 Creating payment order for booking:", bookingId);

      const orderResponse = (await paymentsApi.createOrder({
        bookingId,
      })) as CreateOrderResponse;

      if (!orderResponse?.success || !orderResponse.order) {
        throw orderResponse;
      }

      const { order } = orderResponse;
      const gatewayMode = resolveCashfreeMode(
        orderResponse.mode || order.mode
      );

      const isMockPayment =
        orderResponse.mock === true ||
        order.mock === true ||
        order.mode === "mock" ||
        !order.payment_session_id?.trim() ||
        order.payment_session_id.startsWith("mock_");

      if (isMockPayment) {
        console.log("🧪 Mock payment flow");
        const verifyResponse = (await paymentsApi.verifyPayment({
          order_id: order.id,
          payment_session_id: order.payment_session_id,
          bookingId,
          mock: true,
        })) as { success?: boolean; message?: string };

        if (!verifyResponse?.success) {
          throw new Error(verifyResponse?.message || "Mock payment verification failed");
        }

        if (temporaryHoldId) {
          await bookingsApi.releaseTemporaryHold(temporaryHoldId).catch(() => {});
        }
        onClose();
        navigate(
          `/payment/callback?booking_id=${bookingId}&order_id=${order.id}&order_status=PAID&mock=true`
        );
        return;
      }

      console.log("💳 Launching Cashfree checkout, mode:", gatewayMode);
      await openCashfreeCheckout(order.payment_session_id, gatewayMode);
      // Modal checkout: user completes payment in popup; callback URL handles confirmation
    } catch (error: unknown) {
      console.error("Payment initiation error:", error);
      toast.error(paymentErrorMessage(error));
      setIsProcessing(false);
    }
  }, [booking, user, bookingData, navigate, onClose, temporaryHoldId]);

  if (!booking || !bookingData) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (temporaryHoldId) {
            bookingsApi.releaseTemporaryHold(temporaryHoldId).catch(console.error);
            setTemporaryHoldId(null);
            setHoldExpiresAt(null);
          }
          if (!isProcessing) toast.info("Payment cancelled.");
        }
        onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-cricket-green flex items-center justify-center gap-3">
            Complete Your Payment
            {temporaryHoldId && countdownTime > 0 && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {Math.floor(countdownTime / 60)}:
                {(countdownTime % 60).toString().padStart(2, "0")}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Pay securely with Cashfree
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="font-semibold">{bookingData.ground?.name || "Ground"}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              {formatDate(booking.bookingDate)}
              <Clock className="w-4 h-4 ml-2" />
              {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
            </p>
          </div>

          <div className="border rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(bookingData.baseAmount)}</span>
            </div>
            {bookingData.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(bookingData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Fee (2%)</span>
              <span>{formatCurrency(bookingData.taxes)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold text-cricket-green">
              <span>Total</span>
              <span>{formatCurrency(bookingData.totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">
              Secured by Cashfree. UPI, cards, and net banking supported.
            </p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isProcessing || bookingData.totalAmount < 1}
            className="w-full h-14 text-lg bg-cricket-green hover:bg-cricket-green/90"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Opening Cashfree…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pay {formatCurrency(bookingData.totalAmount)}
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
