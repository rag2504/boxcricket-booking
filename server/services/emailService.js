import nodemailer from "nodemailer";
import { generateBookingReceiptHTML } from "../templates/bookingReceiptTemplate.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Email transporter configuration (reusing the same config as auth)
const createTransporter = () => {
  // Check if email environment variables are configured
  console.log("📧 Checking email configuration...");
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("⚠️  Email configuration incomplete. Using development mode - emails will be logged to console.");
    console.log("📧 Missing email config:", {
      host: !!process.env.EMAIL_HOST,
      port: !!process.env.EMAIL_PORT,
      user: !!process.env.EMAIL_USER,
      pass: !!process.env.EMAIL_PASS
    });
    return null;
  }

  console.log("📧 Email configuration found:", {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM
  });

  console.log("📧 Email service configuration:");
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");

  try {
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add timeout to prevent hanging connections
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
      // Add additional options for better compatibility
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug logging
      logger: true // Enable logger
    });

    // Test the connection (don't await here, do it when sending)
    console.log("📧 Email transporter created successfully");

    return transport;
  } catch (error) {
    console.error("❌ Failed to create or verify email transport:", error);
    console.error("❌ Error details:", error.message);
    return null;
  }
};

const transporter = createTransporter();

// Send booking receipt email
export const sendBookingReceiptEmail = async (booking, user) => {
  try {
    console.log(`📧 Sending booking receipt email to: ${user.email}`);
    console.log(`📋 Booking ID: ${booking.bookingId}`);

    // Generate HTML content with error handling
    let htmlContent;
    try {
      // Validate booking data before generating template
      if (!booking || !booking.bookingId) {
        throw new Error('Invalid booking data - missing booking ID');
      }
      if (!user || !user.email) {
        throw new Error('Invalid user data - missing email');
      }

      htmlContent = generateBookingReceiptHTML(booking, user);
      console.log('✅ Email template generated successfully');
      console.log(`📄 Generated email HTML length: ${htmlContent.length} characters`);

      // Validate generated content
      if (!htmlContent || htmlContent.length < 100) {
        throw new Error('Generated HTML content is too short or empty');
      }

      if (!htmlContent.includes('BoxCric') || !htmlContent.includes('BOOKING RECEIPT')) {
        throw new Error('Generated HTML is missing required elements');
      }

    } catch (templateError) {
      console.error('❌ Error generating email template:', templateError);
      return {
        success: false,
        message: `Template generation failed: ${templateError.message}`,
        error: templateError.message
      };
    }

    // Email subject
    const subject = `BoxCric - Booking Receipt #${booking.bookingId}`;
    
    // Always log receipt generation for debugging
    console.log(`📧 [RECEIPT GENERATED] for ${user.email}:`);
    console.log(`   Booking ID: ${booking.bookingId}`);
    console.log(`   Ground: ${booking.groundId?.name || 'N/A'}`);
    console.log(`   Date: ${booking.bookingDate}`);
    console.log(`   Amount: ₹${booking.pricing?.totalAmount || 0}`);
    console.log(`   ─────────────────────────────────────────`);
    
    // If transporter is not available (development mode), just log to console
    if (!transporter) {
      console.log(`⚠️ Email transporter not available - receipt will only be logged to console`);
      console.log(`📧 Receipt HTML content generated for ${user.email}`);
      console.log(`📧 Would send email with subject: BoxCric - Booking Receipt #${booking.bookingId}`);
      return { 
        success: true, 
        message: "Email service not configured. Receipt generated successfully but not sent. Please configure email settings in .env file.",
        developmentMode: true
      };
    }

    // Verify transporter before sending
    try {
      await transporter.verify();
      console.log("✅ Email transporter verified before sending");
    } catch (verifyError) {
      console.error("❌ Email transporter verification failed:", verifyError);
      return {
        success: false,
        message: "Email service not available",
        error: verifyError.message
      };
    }

    // Try to send email with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`📧 Sending receipt email attempt ${attempts}/${maxAttempts}...`);
        
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: user.email,
          subject: subject,
          html: htmlContent,
          // Add text version as fallback
          text: `
BoxCric - Booking Receipt

Booking ID: ${booking.bookingId}
Ground: ${booking.groundId?.name || 'N/A'}
Date: ${new Date(booking.bookingDate).toLocaleDateString('en-IN')}
Time: ${booking.timeSlot?.startTime} - ${booking.timeSlot?.endTime}
Amount: ₹${booking.pricing?.totalAmount || 0}
Status: ${booking.status}

Thank you for choosing BoxCric!

Need to access your booking details again?
Visit our website and go to the "My Bookings" section to view all your booking information and receipts.

Visit: www.boxcric.com
          `,
        });
        
        console.log(`✅ Receipt email sent successfully! Message ID: ${info.messageId}`);
        return { 
          success: true, 
          message: "Receipt email sent successfully",
          messageId: info.messageId 
        };
      } catch (error) {
        console.error(`❌ Receipt email sending error (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts >= maxAttempts) {
          console.log(`📧 [EMAIL FAILED AFTER ${maxAttempts} ATTEMPTS] Receipt for ${user.email}`);
          return { 
            success: false, 
            message: `Failed to send receipt email after ${maxAttempts} attempts`,
            error: error.message 
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  } catch (error) {
    console.error("❌ Error in sendBookingReceiptEmail:", error);
    return { 
      success: false, 
      message: "Failed to generate or send receipt email",
      error: error.message 
    };
  }
};

// Send booking confirmation email (when booking is first created)
export const sendBookingConfirmationEmail = async (booking, user) => {
  try {
    console.log(`📧 Sending booking confirmation email to: ${user.email}`);
    console.log(`📋 Ground data for email:`, booking.groundId);
    
    const ground = booking.groundId || booking.ground || {};
    const timeSlot = booking.timeSlot || {};
    
    // Better location handling
    const groundName = ground.name || 'Ground name not available';
    const location = ground?.location?.cityName || ground?.location?.city || ground?.location?.address || 'Location not available';
    const address = ground?.location?.address || 'Address not available';
    const contact = ground?.owner?.contact || ground?.contact?.phone || ground?.contact || 'Contact not available';
    
    console.log(`🏟️ Email ground details - Name: ${groundName}, Location: ${location}, Address: ${address}`);
    
    const subject = `BoxCric - Booking Confirmation #${booking.bookingId}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=3.0">
        <meta name="format-detection" content="telephone=no">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%); padding: 20px; text-align: center; }
          .logo { color: white; font-size: 24px; font-weight: bold; }
          .content { padding: 30px; }
          .booking-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .booking-id { font-size: 24px; font-weight: bold; color: #22c55e; text-align: center; margin-bottom: 15px; }
          .details { margin: 15px 0; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .receipt-note { background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
          @media (max-width: 600px) {
            .container { margin: 5px; padding: 10px; }
            .content { padding: 15px; }
            .booking-box { padding: 15px; margin: 10px 0; }
            .booking-id { font-size: 20px; }
            .logo { font-size: 20px; }
            .details { margin: 10px 0; font-size: 14px; }
          }
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
            <p style="color: #4b5563; text-align: center;">Your cricket ground booking has been confirmed.</p>
            
            <div class="booking-box">
              <div class="booking-id">${booking.bookingId}</div>
              <div class="details">
                <div><span class="label">Ground:</span> <span class="value">${groundName}</span></div>
                <div><span class="label">Location:</span> <span class="value">${location}</span></div>
                <div><span class="label">Address:</span> <span class="value">${address}</span></div>
                <div><span class="label">Contact:</span> <span class="value">${contact}</span></div>
                <div><span class="label">Date:</span> <span class="value">${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</span></div>
                <div><span class="label">Time:</span> <span class="value">${timeSlot.startTime || 'N/A'} - ${timeSlot.endTime || 'N/A'}</span></div>
                <div><span class="label">Amount:</span> <span class="value">₹${booking.pricing?.totalAmount || 0}</span></div>
                <div><span class="label">Status:</span> <span class="value">${booking.status}</span></div>
              </div>
            </div>
            
            <div class="receipt-note">
              <p style="color: #0ea5e9; font-weight: bold; margin: 0 0 8px 0;">📧 Booking Receipt</p>
              <p style="color: #4b5563; margin: 0; font-size: 14px;">A detailed booking receipt will be available in the <strong>"My Bookings"</strong> section of our website once your payment is confirmed.</p>
            </div>
            
            <p style="color: #6b7280; text-align: center;">
              You will receive a detailed receipt once your payment is confirmed.
            </p>
          </div>
          <div class="footer">
            <p>Thank you for choosing BoxCric!</p>
            <p>📧 support@boxcric.com | 🌐 www.boxcric.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    if (!transporter) {
      console.log(`⚠️ Email transporter not available - confirmation will only be logged to console`);
      return { success: true, message: "Confirmation generated (development mode)" };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Confirmation email sent successfully! Message ID: ${info.messageId}`);
    return { 
      success: true, 
      message: "Confirmation email sent successfully",
      messageId: info.messageId 
    };
  } catch (error) {
    console.error("❌ Error sending booking confirmation email:", error);
    return { 
      success: false, 
      message: "Failed to send confirmation email",
      error: error.message 
    };
  }
};

export default {
  sendBookingReceiptEmail,
  sendBookingConfirmationEmail
};
