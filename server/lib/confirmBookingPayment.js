import Booking from "../models/Booking.js";
import NotificationService from "../services/notificationService.js";

/**
 * Confirm booking after successful Razorpay payment.
 */
export async function confirmBookingAfterPayment(booking, paymentPayload) {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentDetails,
  } = paymentPayload;

  booking.payment = {
    ...booking.payment,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentId: razorpayPaymentId,
    status: "completed",
    paidAt: new Date(),
    paymentDetails: paymentDetails || {},
    method: paymentDetails?.method || booking.payment?.method,
  };

  booking.status = "confirmed";
  booking.confirmation = {
    confirmedAt: new Date(),
    confirmationCode: `BC${Date.now().toString().slice(-6)}`,
    confirmedBy: "razorpay",
  };

  await booking.save();
  console.log("✅ Booking confirmed:", booking.bookingId);

  try {
    const groundName =
      booking.groundId?.name ||
      (typeof booking.groundId === "object" && booking.groundId?.name) ||
      "Ground";
    await NotificationService.createBookingNotification(
      booking.userId,
      {
        bookingId: booking.bookingId,
        groundName,
        groundId: booking.groundId?._id || booking.groundId,
        date: booking.bookingDate.toISOString().split("T")[0],
        timeSlot: `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`,
        amount: booking.pricing?.totalAmount,
      },
      "booking_confirmed"
    );
  } catch (err) {
    console.error("❌ Notification after payment failed:", err.message);
  }

  sendReceiptEmailAsync(booking).catch((err) =>
    console.error("❌ Receipt email failed:", err.message)
  );

  return booking;
}

async function sendReceiptEmailAsync(booking) {
  const User = (await import("../models/User.js")).default;
  const { sendBookingReceiptEmail } = await import("../services/emailService.js");
  const Ground = (await import("../models/Ground.js")).default;
  const { fallbackGrounds } = await import("../data/fallbackGrounds.js");

  const user = await User.findById(booking.userId);
  if (!user?.email) return;

  let bookingForEmail = booking.toObject();
  const groundId = bookingForEmail.groundId;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(groundId));

  if (isValidObjectId) {
    const mongoGround = await Ground.findById(groundId);
    if (mongoGround) {
      bookingForEmail.groundId = mongoGround.toObject();
    } else {
      const fallback = fallbackGrounds.find((g) => g._id === groundId);
      if (fallback) bookingForEmail.groundId = fallback;
    }
  } else {
    const fallback = fallbackGrounds.find((g) => g._id === groundId);
    if (fallback) bookingForEmail.groundId = fallback;
  }

  const result = await sendBookingReceiptEmail(bookingForEmail, user);
  console.log(
    "📧 Receipt email:",
    result.success ? "SUCCESS" : `FAILED - ${result.message}`
  );
}

/**
 * Check slot overlap before confirming (race after payment).
 */
export async function checkBookingSlotConflict(booking) {
  const groundRef = booking.groundId?._id || booking.groundId;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(groundRef));
  if (!isValidObjectId) return false;

  const overlapping = await Booking.find({
    groundId: groundRef,
    bookingDate: booking.bookingDate,
    status: "confirmed",
    _id: { $ne: booking._id },
    createdAt: { $gte: booking.createdAt },
  });

  const start = new Date(`2000-01-01 ${booking.timeSlot.startTime}`);
  const end = new Date(`2000-01-01 ${booking.timeSlot.endTime}`);

  return overlapping.some((existing) => {
    const bookingStart = new Date(`2000-01-01 ${existing.timeSlot.startTime}`);
    const bookingEnd = new Date(`2000-01-01 ${existing.timeSlot.endTime}`);
    return start < bookingEnd && end > bookingStart;
  });
}
