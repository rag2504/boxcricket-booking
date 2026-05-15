import { generateBookingReceiptHTML } from "../templates/bookingReceiptTemplate.js";
import { getEmailProvider, sendEmailWithRetry } from "./mailSender.js";

// Send booking receipt email
export const sendBookingReceiptEmail = async (booking, user) => {
  try {
    console.log(`📧 Sending booking receipt email to: ${user.email}`);
    console.log(`📋 Booking ID: ${booking.bookingId}`);

    let htmlContent;
    try {
      if (!booking?.bookingId) throw new Error("Invalid booking data - missing booking ID");
      if (!user?.email) throw new Error("Invalid user data - missing email");

      htmlContent = generateBookingReceiptHTML(booking, user);
      if (!htmlContent || htmlContent.length < 100) {
        throw new Error("Generated HTML content is too short or empty");
      }
    } catch (templateError) {
      console.error("❌ Error generating email template:", templateError);
      return {
        success: false,
        message: `Template generation failed: ${templateError.message}`,
        error: templateError.message,
      };
    }

    const subject = `BoxCric - Booking Receipt #${booking.bookingId}`;
    const text = `
BoxCric - Booking Receipt

Booking ID: ${booking.bookingId}
Ground: ${booking.groundId?.name || "N/A"}
Date: ${new Date(booking.bookingDate).toLocaleDateString("en-IN")}
Time: ${booking.timeSlot?.startTime} - ${booking.timeSlot?.endTime}
Amount: ₹${booking.pricing?.totalAmount || 0}
Status: ${booking.status}

Thank you for choosing BoxCric!
Visit: www.boxcric.com
    `;

    console.log(`📧 [RECEIPT] for ${user.email} — ${booking.bookingId}`);

    if (getEmailProvider() === "none") {
      console.log("⚠️ Email not configured — receipt logged only");
      return {
        success: true,
        message: "Email service not configured. Receipt generated but not sent.",
        developmentMode: true,
      };
    }

    const info = await sendEmailWithRetry({
      to: user.email,
      subject,
      html: htmlContent,
      text,
    });

    console.log(`✅ Receipt email sent! (${info.provider}) ID: ${info.messageId}`);
    return {
      success: true,
      message: "Receipt email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error in sendBookingReceiptEmail:", error);
    return {
      success: false,
      message: "Failed to send receipt email",
      error: error.message,
    };
  }
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (booking, user) => {
  try {
    console.log(`📧 Sending booking confirmation email to: ${user.email}`);

    const ground = booking.groundId || booking.ground || {};
    const timeSlot = booking.timeSlot || {};
    const groundName = ground.name || "Ground name not available";
    const location =
      ground?.location?.cityName ||
      ground?.location?.city ||
      ground?.location?.address ||
      "Location not available";
    const address = ground?.location?.address || "Address not available";
    const contact =
      ground?.owner?.contact || ground?.contact?.phone || ground?.contact || "Contact not available";

    const subject = `BoxCric - Booking Confirmation #${booking.bookingId}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%); padding: 20px; text-align: center; }
          .logo { color: white; font-size: 24px; font-weight: bold; }
          .content { padding: 30px; }
          .booking-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .booking-id { font-size: 24px; font-weight: bold; color: #22c55e; text-align: center; margin-bottom: 15px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏏 BoxCric</div>
            <p style="color: white; margin: 10px 0 0 0;">Book. Play. Win.</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; text-align: center;">Booking Confirmed! 🎉</h2>
            <div class="booking-box">
              <div class="booking-id">${booking.bookingId}</div>
              <p><strong>Ground:</strong> ${groundName}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Address:</strong> ${address}</p>
              <p><strong>Contact:</strong> ${contact}</p>
              <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString("en-IN")}</p>
              <p><strong>Time:</strong> ${timeSlot.startTime || "N/A"} - ${timeSlot.endTime || "N/A"}</p>
              <p><strong>Amount:</strong> ₹${booking.pricing?.totalAmount || 0}</p>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for choosing BoxCric!</p>
            <p>📧 support@boxcric.com | 🌐 www.boxcric.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (getEmailProvider() === "none") {
      return { success: true, message: "Confirmation generated (email not configured)" };
    }

    const info = await sendEmailWithRetry({
      to: user.email,
      subject,
      html: htmlContent,
    });

    console.log(`✅ Confirmation email sent! (${info.provider})`);
    return { success: true, message: "Confirmation email sent successfully", messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending booking confirmation email:", error);
    return { success: false, message: "Failed to send confirmation email", error: error.message };
  }
};

export default {
  sendBookingReceiptEmail,
  sendBookingConfirmationEmail,
};
