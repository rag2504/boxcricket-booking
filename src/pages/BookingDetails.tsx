import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  Star,
  Shield,
  CreditCard,
  User,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import PaymentModal from "@/components/PaymentModal";
import { bookingsApi } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    if (id) {
      fetchBookingDetails();
    }
  }, [id, isAuthenticated]);

  // Auto-send receipt once when booking is confirmed (uses MongoDB _id for API)
  useEffect(() => {
    if (
      booking &&
      booking.status === "confirmed" &&
      !booking.emailSent &&
      isAuthenticated &&
      booking._id
    ) {
      const timer = setTimeout(() => {
        handleEmailReceipt();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [booking?._id, booking?.status, booking?.emailSent, isAuthenticated]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      const response = await bookingsApi.getBooking(id!);
      if ((response as any).success) {
        setBooking((response as any).booking);
      }
    } catch (error: any) {
      console.error("Failed to fetch booking details:", error);
      toast.error("Failed to load booking details");
      navigate("/profile/bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    try {
      const response = await bookingsApi.updateBookingStatus(booking._id, {
        status: "cancelled",
        reason: "User cancellation",
      });
      if ((response as any).success) {
        toast.success("Booking cancelled successfully");
        setBooking((prev: any) => ({ ...prev, status: "cancelled" }));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking");
    }
  };

  const getStatusColor = (status: string) => {
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
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Defensive helpers for deeply nested fields
  const ground =
    booking?.groundId && typeof booking.groundId === "object"
      ? booking.groundId
      : booking?.ground || {};

  const playerDetails = booking?.playerDetails || {};
  const contactPerson = playerDetails.contactPerson || {};

  // Defensive for pricing and payment
  const pricing = booking?.pricing || {};
  const payment = booking?.payment || { status: "pending" };

  // Helper function to check if payment is actually needed
  const needsPayment = () => {
    if (!booking) return false;

    // Only show payment if:
    // 1. Booking status is pending AND
    // 2. Payment status is pending (not failed/cancelled) AND
    // 3. Booking is not cancelled AND
    // 4. Payment hasn't failed
    return (
      booking.status === "pending" &&
      payment.status === "pending" &&
      !booking.cancellation &&
      payment.status !== "failed"
    );
  };

  // DO NOT auto-open payment modal - let user decide when to pay
  // This prevents annoying popup every time they view booking details

  // Receipt functions
  const handleEmailReceipt = async () => {
    try {
      // Prevent duplicate emails
      if (booking?.emailSent) {
        console.log('📧 Email already sent for this booking');
        return;
      }

      console.log('📧 Sending receipt email for booking:', booking._id);

      const bookingId = booking._id || booking.id;
      if (!bookingId) {
        toast.error("Invalid booking reference");
        return;
      }
      const response = await bookingsApi.sendReceipt(bookingId);

      const data = response as { success?: boolean; message?: string; error?: string };

      if (data?.success) {
        // Mark booking as email sent to prevent duplicates
        setBooking((prev: any) => ({ ...prev, emailSent: true }));
        toast.success("Receipt email sent successfully!");
        console.log('✅ Receipt email sent successfully');
      } else {
        console.error('❌ Email sending failed:', data);
        
        // Don't show error toast for access denied on automatic email sending
        // This prevents confusing error messages when user views their booking
        if (data.message !== "Access denied") {
          toast.error(data.message || "Failed to send receipt email");
          
          // Show more specific error if available
          if (data.error) {
            console.error('❌ Email error details:', data.error);
          }
        } else {
          // Just log access denied errors, don't show to user
          console.warn('⚠️ Email access denied - user may not own this booking');
        }
      }
    } catch (error: any) {
      console.error("❌ Error sending receipt email:", error);
      
      // Don't show error toast for access denied - this prevents confusing user
      if (error?.response?.data?.message !== "Access denied" && error?.message !== "Access denied") {
        toast.error("Failed to send receipt email. Please check your internet connection and try again.");
      } else {
        console.warn('⚠️ Email access denied in catch block - user may not own this booking');
      }
    }
  };


  const handleDownloadReceipt = async () => {
    try {
      setIsDownloadingReceipt(true);
      const token = localStorage.getItem('boxcric_token');
      const bookingId = booking.bookingId || booking._id;
      
      if (!token) {
        toast.error("You must be logged in to download the PDF receipt.");
        return;
      }

      // Always use API base URL so production doesn't call the frontend domain
      const apiBase = API_BASE_URL;

      // Detect mobile browsers
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Pre-open a tab on mobile to avoid popup blockers
      let preOpenTab: Window | null = null;
      if (isMobile) {
        preOpenTab = window.open('', '_blank');
      }

      console.log('📄 Starting PDF generation for booking:', bookingId);

      // Generate a guaranteed-to-work HTML receipt with current booking data
      const generateSimpleReceiptHTML = () => {
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>BoxCric Receipt</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                background: white; 
                color: black; 
                font-size: 14px;
                line-height: 1.5;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #22c55e; 
                padding-bottom: 20px; 
              }
              .logo { 
                font-size: 28px; 
                font-weight: bold; 
                color: #22c55e; 
                margin-bottom: 5px; 
              }
              .tagline { 
                font-size: 14px; 
                color: #666; 
              }
              .receipt-title { 
                font-size: 24px; 
                font-weight: bold; 
                color: #000; 
                margin: 10px 0; 
              }
              .receipt-date { 
                color: #666; 
                font-size: 12px; 
              }
              .booking-id { 
                text-align: center;
                background: #f8f9fa;
                border: 2px solid #22c55e;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
              }
              .booking-id-label { 
                font-size: 12px; 
                color: #666; 
                margin-bottom: 5px; 
                text-transform: uppercase; 
                letter-spacing: 1px; 
              }
              .booking-id-value { 
                font-size: 20px; 
                font-weight: bold; 
                color: #22c55e; 
                letter-spacing: 2px; 
                font-family: 'Courier New', monospace; 
              }
              .section { 
                margin-bottom: 20px; 
                border-bottom: 1px solid #ddd; 
                padding-bottom: 15px; 
              }
              .section-title { 
                font-size: 16px; 
                font-weight: 600; 
                color: #1f2937; 
                margin-bottom: 15px; 
              }
              .info-grid { 
                display: table; 
                width: 100%; 
                border-collapse: collapse; 
              }
              .info-row { 
                display: table-row; 
              }
              .info-item { 
                display: table-cell; 
                padding: 10px; 
                border: 1px solid #ddd; 
                vertical-align: top; 
                width: 50%; 
              }
              .info-label { 
                font-size: 11px; 
                color: #666; 
                text-transform: uppercase; 
                letter-spacing: 0.5px; 
                margin-bottom: 3px; 
                font-weight: bold; 
              }
              .info-value { 
                font-size: 14px; 
                font-weight: normal; 
                color: #000; 
              }
              .pricing-summary { 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
                padding: 20px; 
                border-radius: 10px; 
                margin-top: 20px; 
              }
              .pricing-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 10px; 
                padding: 5px 0; 
              }
              .pricing-total { 
                border-top: 2px solid #22c55e; 
                padding-top: 15px; 
                margin-top: 15px; 
                font-size: 18px; 
                font-weight: bold; 
                color: #22c55e; 
              }
              .footer { 
                background: #f9fafb; 
                padding: 25px; 
                text-align: center; 
                border-top: 1px solid #e5e7eb; 
                margin-top: 30px; 
              }
              .footer-text { 
                color: #6b7280; 
                font-size: 14px; 
                margin-bottom: 15px; 
              }
              .contact-info { 
                color: #4b5563; 
                font-size: 13px; 
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🏏 BoxCric</div>
              <div class="tagline">Book. Play. Win.</div>
              <div class="receipt-title">BOOKING RECEIPT</div>
              <div class="receipt-date">${new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
            </div>

            <div class="booking-id">
              <div class="booking-id-label">Booking ID</div>
              <div class="booking-id-value">${bookingId}</div>
            </div>

            <div class="section">
              <div class="section-title">🏟️ Venue Details</div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-item">
                    <div class="info-label">Ground Name</div>
                    <div class="info-value">${booking?.groundId?.name || booking?.ground?.name || 'Ground details unavailable'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Location</div>
                    <div class="info-value">${booking?.groundId?.location?.address || booking?.ground?.location?.address || 'N/A'}</div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item" style="border-top: none;">
                    <div class="info-label">Address</div>
                    <div class="info-value">${booking?.groundId?.location?.address || booking?.ground?.location?.address || 'Address not available'}</div>
                  </div>
                  <div class="info-item" style="border-top: none;">
                    <div class="info-label">Contact</div>
                    <div class="info-value">${booking?.groundId?.contact?.phone || booking?.ground?.contact?.phone || 'Contact not available'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📅 Booking Details</div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Time Slot</div>
                    <div class="info-value">${booking?.timeSlot?.startTime && booking?.timeSlot?.endTime ? 
                      `${new Date(`2000-01-01 ${booking.timeSlot.startTime}`).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })} - ${new Date(`2000-01-01 ${booking.timeSlot.endTime}`).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}` : 'N/A'}</div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item" style="border-top: none;">
                    <div class="info-label">Duration</div>
                    <div class="info-value">${booking?.timeSlot?.duration || 'N/A'} hour(s)</div>
                  </div>
                  <div class="info-item" style="border-top: none;">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                      <strong style="color: #22c55e;">${booking?.status === 'confirmed' ? '✅ CONFIRMED' : '⏳ PENDING'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">👥 Team Details</div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-item">
                    <div class="info-label">Team Name</div>
                    <div class="info-value">${booking?.playerDetails?.teamName || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Players</div>
                    <div class="info-value">${booking?.playerDetails?.playerCount || 'N/A'}</div>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item" style="border-top: none;">
                    <div class="info-label">Contact Person</div>
                    <div class="info-value">${booking?.playerDetails?.contactPerson?.name || 'N/A'}</div>
                  </div>
                  <div class="info-item" style="border-top: none;">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${booking?.playerDetails?.contactPerson?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">💰 Payment Summary</div>
              <div class="pricing-summary">
                <div class="pricing-row">
                  <span>Base Amount</span>
                  <span>₹${booking?.pricing?.baseAmount || 0}</span>
                </div>
                <div class="pricing-row">
                  <span>Discount</span>
                  <span>-₹${booking?.pricing?.discount || 0}</span>
                </div>
                <div class="pricing-row">
                  <span>Taxes & Fees</span>
                  <span>₹${booking?.pricing?.taxes || 0}</span>
                </div>
                <div class="pricing-row pricing-total">
                  <span>Total Amount</span>
                  <span>₹${booking?.pricing?.totalAmount || 0}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">
                Thank you for choosing BoxCric!
              </div>
              <div class="footer-text">
                Show this receipt at the venue for entry
              </div>
              <div class="contact-info">
                📧 support@boxcric.com | 📞 +91-XXXX-XXXX-XX | 🌐 www.boxcric.com
              </div>
            </div>
          </body>
          </html>
        `;
      };

      // Use the simple HTML generator instead of fetching from server
      const htmlContent = generateSimpleReceiptHTML();
      console.log('📄 Generated simple HTML receipt, length:', htmlContent.length);

      // Strategy 2a: Try npm package imports first
      let jsPDF: any = null;
      let html2canvas: any = null;

      try {
        console.log('📦 Loading PDF libraries from npm packages...');
        const jsPDFModule = await import('jspdf');
        const html2canvasModule = await import('html2canvas');
        jsPDF = jsPDFModule.default;
        html2canvas = html2canvasModule.default;
        console.log('✅ NPM packages loaded successfully');
      } catch (npmError) {
        console.warn('NPM packages failed, trying CDN fallback:', npmError);
        
        // Strategy 2b: Try CDN fallback
        try {
          if (typeof window !== 'undefined') {
            // @ts-ignore
            jsPDF = window.jsPDF || (window as any).jsPDF;
            // @ts-ignore
            html2canvas = window.html2canvas || (window as any).html2canvas;
            
            if (!jsPDF || !html2canvas) {
              throw new Error('CDN libraries not available');
            }
            console.log('✅ CDN libraries loaded successfully');
        } else {
            throw new Error('Window object not available');
          }
        } catch (cdnError) {
          console.error('CDN fallback also failed:', cdnError);
          throw new Error('PDF libraries could not be loaded');
        }
      }

      // Create a visible container for HTML rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 800px;
        background-color: #ffffff;
        font-family: Arial, sans-serif;
        color: #000;
        padding: 20px;
        z-index: 9999;
        visibility: visible;
        overflow: visible;
        white-space: normal;
        word-wrap: break-word;
        transform: scale(1);
        transform-origin: top left;
        border: 1px solid #ccc;
      `;
      document.body.appendChild(tempDiv);

      // Ensure all elements are visible and properly styled
      tempDiv.querySelectorAll('*').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.color = '#000';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
          el.style.overflow = 'visible';
          el.style.whiteSpace = 'normal';
          el.style.wordWrap = 'break-word';
          
          // Ensure text is visible
          if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
            el.style.color = '#000';
            el.style.backgroundColor = 'transparent';
            el.style.fontSize = el.style.fontSize || '14px';
          }
        }
      });

      // Debug: Log what elements we have
      console.log('🔍 Elements found in HTML:', {
        total: tempDiv.querySelectorAll('*').length,
        divs: tempDiv.querySelectorAll('div').length,
        paragraphs: tempDiv.querySelectorAll('p').length,
        headers: tempDiv.querySelectorAll('h1, h2, h3').length,
        textContent: tempDiv.textContent?.substring(0, 200)
      });

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🎨 Converting HTML to canvas...');

      // Convert HTML to canvas with improved settings
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging to see what's happening
        width: 800,
        height: Math.max(tempDiv.scrollHeight, 600),
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: Math.max(tempDiv.scrollHeight, 600),
        foreignObjectRendering: false,
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc: any) => {
          // Ensure cloned document has proper styling
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            clonedBody.style.backgroundColor = '#ffffff';
            clonedBody.style.color = '#000000';
            clonedBody.style.fontFamily = 'Arial, sans-serif';
          }
          
          // Ensure all text elements are visible
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el instanceof HTMLElement) {
              el.style.color = '#000000';
              el.style.visibility = 'visible';
              el.style.opacity = '1';
              el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
              
              // Ensure text is visible
              if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'SPAN' || 
                  el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
                el.style.color = '#000000';
                el.style.backgroundColor = 'transparent';
                el.style.fontSize = el.style.fontSize || '14px';
                el.style.fontWeight = el.style.fontWeight || 'normal';
              }
            }
          });
        }
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas generation failed - canvas is empty');
      }

      console.log('✅ Canvas generated successfully:', canvas.width, 'x', canvas.height);

      // Create PDF with proper settings
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      console.log('📄 PDF dimensions:', { pdfWidth, pdfHeight, pageHeight });

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Handle multi-page if content is taller than one page
      let heightLeft = pdfHeight - pageHeight;
      let pageCount = 1;
      while (heightLeft > 0) {
        pdf.addPage();
        pageCount++;
        const position = - (pdfHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      console.log(`📄 PDF generated with ${pageCount} pages`);

      const fileName = `BoxCric-Receipt-${bookingId}.pdf`;
      
      // Strategy 3: Fallback to new window if PDF generation fails
      try {
      if (isMobile) {
        const blobUrl = String(pdf.output('bloburl'));
        if (preOpenTab) preOpenTab.location.href = blobUrl as string;
        else window.open(blobUrl, '_blank');
      } else {
        pdf.save(fileName);
        }
        toast.success('Receipt PDF ready.');
      } catch (saveError) {
        console.warn('PDF save failed, opening in new window:', saveError);
        
        // Final fallback: Open receipt in new window for manual save
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          toast.info('Receipt opened in new window. Use browser print function to save as PDF.');
        } else {
          toast.error('Please allow popups to download the receipt.');
        }
      }

      // Clean up
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }

    } catch (error: any) {
      console.error('❌ Error downloading receipt:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Canvas generation failed')) {
        toast.error('PDF generation failed. Please try again or contact support.');
      } else if (error.message.includes('NetworkError')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('PDF libraries could not be loaded')) {
        toast.error('PDF generation failed. Please try again or contact support.');
      } else {
        toast.error('Failed to download receipt. Please try again.');
      }
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-cricket-green border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Not Found
            </h1>
            <Button onClick={() => navigate("/profile/bookings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile/bookings")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bookings</span>
          </Button>

          <Badge className={getStatusColor(booking.status)} variant="secondary">
            {booking.status
              ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
              : ""}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-cricket-green" />
                  <span>Booking Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {ground?.name || "Unknown Ground"}
                    </h2>
                    <div className="flex items-center space-x-1 text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{ground?.location?.address || ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Booking ID</div>
                    <div className="font-mono font-semibold">
                      {booking.bookingId || booking._id}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-cricket-green" />
                    <div>
                      <div className="text-sm text-gray-600">Date</div>
                      <div className="font-medium">
                        {formatDate(booking.bookingDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-cricket-green" />
                    <div>
                      <div className="text-sm text-gray-600">Time</div>
                      <div className="font-medium">
                        {booking.timeSlot?.startTime
                          ? booking.timeSlot.startTime +
                            " - " +
                            booking.timeSlot.endTime
                          : booking.timeSlot || ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-cricket-green" />
                    <div>
                      <div className="text-sm text-gray-600">Players</div>
                      <div className="font-medium">
                        {playerDetails?.playerCount || ""}
                      </div>
                    </div>
                  </div>
                </div>

                {playerDetails?.teamName && (
                  <div>
                    <div className="text-sm text-gray-600">Team Name</div>
                    <div className="font-medium">
                      {playerDetails.teamName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Person</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">
                      {contactPerson?.name || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{contactPerson?.phone || ""}</span>
                  </div>
                  {contactPerson?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span>{contactPerson.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ground Details */}
            <Card>
              <CardHeader>
                <CardTitle>Ground Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <img
                    src={
                      ground?.images && ground.images.length > 0
                        ? ground.images[0].url
                        : "/placeholder.svg"
                    }
                    alt={ground?.name || "Ground"}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {ground?.rating?.average || "N/A"}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({ground?.rating?.count || 0} reviews)
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        Pitch: {ground?.features?.pitchType || "N/A"}
                      </div>
                      <div>
                        Capacity: {ground?.features?.capacity || "N/A"} players
                      </div>
                      {ground?.features?.lighting && (
                        <div>✅ Night lighting available</div>
                      )}
                      {ground?.features?.parking && (
                        <div>✅ Parking available</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-cricket-green" />
                  <span>Payment Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Base Amount</span>
                  <span>₹{pricing.baseAmount || booking.amount || ""}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{pricing.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>GST (18%)</span>
                  <span>₹{pricing.taxes || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="text-cricket-green">
                    ₹{pricing.totalAmount || booking.amount || ""}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Payment Status
                  </div>
                  <Badge
                    className={
                      payment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : payment.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {payment.status === "completed" && "✅ "}
                    {payment.status === "failed" && "❌ "}
                    {payment.status === "pending" && "⏳ "}
                    {payment.status
                      ? payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)
                      : "Pending"}
                  </Badge>

                  {/* Show payment method if available */}
                  {payment.method && (
                    <div className="text-xs text-gray-500 mt-1">
                      via {payment.method}
                    </div>
                  )}

                  {/* Show transaction ID if available */}
                  {payment.transactionId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Transaction: {payment.transactionId}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Payment Action Message */}
                  {booking.status === "cancelled" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <p className="text-red-800 font-medium">❌ Order Cancelled</p>
                      <div className="text-sm text-red-700">
                        <p><strong>Booking ID:</strong> {booking.bookingId || booking._id}</p>
                        {booking.cancellation?.reason && (
                          <p><strong>Reason:</strong> {booking.cancellation.reason}</p>
                        )}
                      </div>
                      {(payment.status === "completed" || payment.paidAt) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                          <p className="text-yellow-800 text-sm">
                            💰 <strong>Refund Information:</strong> If you paid for this booking,
                            your refund will be processed within 2-3 business days to your original payment method.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {payment.status === "failed" && booking.status !== "cancelled" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <p className="text-red-800 font-medium">❌ Payment Failed</p>
                      <div className="text-sm text-red-700">
                        <p><strong>Booking ID:</strong> {booking.bookingId || booking._id}</p>
                        <p>Your payment could not be processed. You can try booking again or contact support.</p>
                      </div>
                    </div>
                  )}

                  {booking.status === "confirmed" && (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium">✅ Your booking is confirmed!</p>
                        {booking.confirmation?.confirmationCode && (
                          <p className="text-green-600 text-sm mt-1">
                            Confirmation Code: <span className="font-mono font-bold">{booking.confirmation.confirmationCode}</span>
                          </p>
                        )}
                      </div>

                      {/* Receipt Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleDownloadReceipt}
                          disabled={isDownloadingReceipt}
                          variant="outline"
                          className="flex items-center justify-center gap-2 border-cricket-green text-cricket-green hover:bg-cricket-green hover:text-white text-sm px-3 py-2 min-w-0 flex-1"
                        >
                          <Download className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {isDownloadingReceipt ? "Generating..." : "Download PDF"}
                          </span>
                        </Button>

                        {/* Email Receipt Button - REMOVED - Emails are now sent automatically */}
                      </div>

                    </>
                  )}

                  {/* Payment Button - Only show if payment is actually needed */}
                  {needsPayment() && (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 font-medium">⏳ Payment required to confirm your booking.</p>
                        <p className="text-yellow-600 text-sm mt-1">Complete your payment to secure your slot.</p>
                      </div>
                      <Button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full bg-cricket-green hover:bg-cricket-green/90"
                      >
                        Complete Payment
                      </Button>
                    </>
                  )}

                  {(booking.status === "pending" ||
                    booking.status === "confirmed") && (
                    <Button
                      variant="outline"
                      onClick={handleCancelBooking}
                      className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Cancel Booking
                    </Button>
                  )}

                  {booking.status === "completed" && !booking.feedback && (
                    <Button variant="outline" className="w-full">
                      Rate & Review
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/ground/${ground?._id || ""}`)}
                    className="w-full"
                  >
                    View Ground Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Confirmation Code */}
            {booking.confirmation?.confirmationCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Confirmation Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-cricket-green">
                      {booking.confirmation.confirmationCode}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Show this code at the ground
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={booking}
        onPaymentSuccess={() => {
          setBooking((prev: any) => ({
            ...prev,
            status: "confirmed",
            payment: { ...prev.payment, status: "completed" },
          }));
        }}
      />
    </div>
  );
};

export default BookingDetails;