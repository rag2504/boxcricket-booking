// Booking receipt email template
export const generateBookingReceiptHTML = (booking, user) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const ground = booking.groundId || booking.ground || {};
  const playerDetails = booking.playerDetails || {};
  const contactPerson = playerDetails.contactPerson || {};
  const pricing = booking.pricing || {};
  const timeSlot = booking.timeSlot || {};

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=3.0">
      <meta name="format-detection" content="telephone=no">
      <title>BoxCric - Booking Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.5;
          color: #000;
          background-color: #fff;
          font-size: 14px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 20px;
        }
        .header {
          border-bottom: 3px solid #22c55e;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-section {
          flex: 1;
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
        .receipt-info {
          text-align: right;
          flex: 1;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
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
        .section:last-child { border-bottom: none; }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .section-icon {
          margin-right: 10px;
          font-size: 20px;
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
        .full-width { grid-column: 1 / -1; }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-confirmed {
          background: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
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
        .qr-placeholder {
          width: 80px;
          height: 80px;
          background: #e5e7eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          body {
            margin: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .container {
            margin: 0;
            box-shadow: none;
            border-radius: 0;
          }
          .header {
            border-bottom: 2px solid #000 !important;
          }
          .info-item {
            border: 1px solid #000 !important;
          }
        }
        @media (max-width: 600px) {
          .container { 
            margin: 5px; 
            padding: 10px;
            font-size: 12px;
          }
          .header {
            flex-direction: column;
            text-align: center;
          }
          .receipt-info {
            text-align: center;
            margin-top: 10px;
          }
          .logo {
            font-size: 24px;
          }
          .receipt-title {
            font-size: 20px;
          }
          .booking-id-value {
            font-size: 16px;
          }
          .info-grid { 
            display: block; 
          }
          .info-row { 
            display: block; 
          }
          .info-item {
            display: block;
            width: 100%;
            margin-bottom: 10px;
            padding: 8px;
          }
          .section-title {
            font-size: 14px;
          }
          .info-value {
            font-size: 12px;
          }
          .pricing-row {
            font-size: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            <div class="logo">🏏 BoxCric</div>
            <div class="tagline">Book. Play. Win.</div>
          </div>
          <div class="receipt-info">
            <div class="receipt-title">BOOKING RECEIPT</div>
            <div class="receipt-date">${formatDate(new Date())}</div>
          </div>
        </div>

        <div class="booking-id">
          <div class="booking-id-label">Booking ID</div>
          <div class="booking-id-value">${booking.bookingId || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-icon">🏟️</span>
            Venue Details
          </div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">Ground Name</div>
                <div class="info-value">${ground?.name || booking?.groundId?.name || 'Ground details unavailable'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${ground?.location?.cityName || ground?.location?.city || booking?.groundId?.location?.cityName || booking?.groundId?.location?.city || 'N/A'}</div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Address</div>
                <div class="info-value">${ground?.location?.address || booking?.groundId?.location?.address || 'Address not available'}</div>
              </div>
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Contact</div>
                <div class="info-value">${ground?.contact?.phone || ground?.owner?.contact || booking?.groundId?.contact?.phone || booking?.groundId?.owner?.contact || 'Contact not available'}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-icon">📅</span>
            Booking Details
          </div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${formatDate(booking.bookingDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Time Slot</div>
                <div class="info-value">${timeSlot.startTime && timeSlot.endTime ? `${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}` : 'N/A'}</div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Duration</div>
                <div class="info-value">${timeSlot.duration || 'N/A'} hour(s)</div>
              </div>
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <strong style="color: #22c55e;">${booking.status === 'confirmed' ? '✅ CONFIRMED' : '⏳ PENDING'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-icon">👥</span>
            Team Details
          </div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">Team Name</div>
                <div class="info-value">${playerDetails.teamName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Players</div>
                <div class="info-value">${playerDetails.playerCount || 'N/A'}</div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Contact Person</div>
                <div class="info-value">${contactPerson.name || 'N/A'}</div>
              </div>
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Phone</div>
                <div class="info-value">${contactPerson.phone || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span class="section-icon">💰</span>
            Payment Summary
          </div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">Base Amount</div>
                <div class="info-value">₹${pricing.baseAmount || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Discount</div>
                <div class="info-value">-₹${pricing.discount || 0}</div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Taxes & Fees</div>
                <div class="info-value">₹${pricing.taxes || 0}</div>
              </div>
              <div class="info-item" style="border-top: none; background: #f0fdf4;">
                <div class="info-label">Total Amount</div>
                <div class="info-value" style="font-size: 18px; font-weight: bold; color: #22c55e;">₹${pricing.totalAmount || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 2px solid #22c55e;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
            Thank you for choosing BoxCric!
          </div>
          <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
            Show this receipt at the venue for entry
          </div>
          <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 12px; margin: 15px 0; font-size: 14px; color: #0369a1;">
            📱 <strong>Need to access your booking details again?</strong><br>
            Visit our website and go to the <strong>"My Bookings"</strong> section to view all your booking information and receipts.
          </div>
          <div style="font-size: 12px; color: #666;">
            📧 support@boxcric.com | 📞 +91-XXXX-XXXX-XX | 🌐 www.boxcric.com
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
