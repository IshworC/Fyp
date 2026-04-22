import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendOtpEmail = async (email, otp, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #5d0f0f; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Saan - Email Verification</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello ${name},</p>
        <p style="font-size: 16px; color: #333;">Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #5d0f0f; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #666;">This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message from Saan App. Please do not reply.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Saan App",
    html,
  });
};

// Send rejection notification email for venue registration
export const sendRejectionNotificationEmail = async (email, name, venueName, rejectedSection, rejectionReason) => {
  const sectionLabels = {
    venueName: 'Venue Name',
    phone: 'Phone Number',
    location: 'Location',
    profileImage: 'Profile Image',
    venueImages: 'Venue Images',
    citizenshipFront: 'Citizenship (Front)',
    citizenshipBack: 'Citizenship (Back)',
    businessRegistration: 'Business Registration',
    panCard: 'PAN Card',
  };

  const sectionLabel = sectionLabels[rejectedSection] || rejectedSection;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #5d0f0f; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Saan - Registration Update</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello ${name},</p>
        <p style="font-size: 16px; color: #333;">We've reviewed your venue registration for <strong>${venueName}</strong> and found an issue that requires your attention.</p>

        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">
            <span style="margin-right: 8px;">❌</span>Section Rejected: ${sectionLabel}
          </p>
          <p style="margin: 0; font-size: 14px; color: #b91c1c;">
            <strong>Reason:</strong> ${rejectionReason}
          </p>
        </div>

        <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">What You Need To Do:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
            <li style="margin-bottom: 8px;">Log in to your Saan account</li>
            <li style="margin-bottom: 8px;">Go to Venue Registration</li>
            <li style="margin-bottom: 8px;">Update the rejected section with correct information</li>
            <li>Submit your registration again for review</li>
          </ol>
        </div>

        <p style="font-size: 14px; color: #666;">
          <strong>Note:</strong> Only the rejected section needs to be corrected. All other approved sections are locked and cannot be modified.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:5173/venue-owner/registration"
             style="display: inline-block; background-color: #5d0f0f; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Update Registration
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you have any questions, please contact our support team.<br>
          This is an automated message from Saan App. Please do not reply.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Action Required: Update Your Venue Registration - ${sectionLabel}`,
    html,
  });
};

// Send approval notification email for venue registration
export const sendApprovalNotificationEmail = async (email, name, venueName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #059669; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello ${name},</p>
        <p style="font-size: 16px; color: #333;">Great news! Your venue registration has been <strong>approved</strong>.</p>

        <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
          <h2 style="margin: 0 0 8px 0; font-size: 22px; color: #065f46;">${venueName}</h2>
          <p style="margin: 0; font-size: 14px; color: #047857; font-weight: 600;">
            Your venue is now verified and active!
          </p>
        </div>

        <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
            <li style="margin-bottom: 8px;">Your venue is now visible to users on Saan</li>
            <li style="margin-bottom: 8px;">You can manage your venue details from your dashboard</li>
            <li style="margin-bottom: 8px;">Start receiving bookings and inquiries</li>
            <li>Keep your venue information updated for best results</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:5173/venue-owner/dashboard"
             style="display: inline-block; background-color: #059669; color: white; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Go to Dashboard
          </a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center;">
          Thank you for choosing Saan to showcase your venue!
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you have any questions, please contact our support team.<br>
          This is an automated message from Saan App. Please do not reply.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🎉 Congratulations! Your Venue "${venueName}" is Now Verified - Saan`,
    html,
  });
};

// Send booking confirmation email to User
export const sendBookingConfirmationToUser = async (email, name, venueName, date, totalAmount, guests, isConfirmedStatus) => {
  const formattedDate = new Date(date).toLocaleDateString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #059669; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 Booking Successful!</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello ${name},</p>
        <p style="font-size: 16px; color: #333;">Your payment was successful and your reservation at <strong>${venueName}</strong> has been fully confirmed!</p>
        
        <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #059669; padding-bottom: 10px;">Booking Summary</h3>
          <table style="width: 100%; font-size: 14px; color: #4b5563;">
            <tr><td style="padding: 5px 0; font-weight: bold;">Venue:</td><td style="padding: 5px 0; text-align: right;">${venueName}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Event Date:</td><td style="padding: 5px 0; text-align: right;">${formattedDate}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Guests:</td><td style="padding: 5px 0; text-align: right;">${guests} pax</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Total Paid:</td><td style="padding: 5px 0; text-align: right; color: #059669; font-weight: bold; font-size: 16px;">Rs. ${totalAmount}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center;">Get ready for a fantastic event! We look forward to hosting you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated message from Saan App. Please do not reply.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Booking Confirmed: ${venueName} - Saan`,
    html,
  });
};

// Send booking notification email to Venue Owner
export const sendBookingNotificationToOwner = async (email, ownerName, venueName, userName, date, guests, totalAmount) => {
  const formattedDate = new Date(date).toLocaleDateString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #5d0f0f; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔔 New Booking Notification</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello ${ownerName},</p>
        <p style="font-size: 16px; color: #333;">Great news! You have a highly anticipated new booking request that was successfully paid for <strong>${venueName}</strong>.</p>
        
        <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937; border-bottom: 2px solid #5d0f0f; padding-bottom: 10px;">Reservation Details</h3>
          <table style="width: 100%; font-size: 14px; color: #4b5563;">
            <tr><td style="padding: 5px 0; font-weight: bold;">Customer:</td><td style="padding: 5px 0; text-align: right;">${userName}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Date Required:</td><td style="padding: 5px 0; text-align: right;">${formattedDate}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Expected Guests:</td><td style="padding: 5px 0; text-align: right;">${guests} pax</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Amount Paid:</td><td style="padding: 5px 0; text-align: right; color: #059669; font-weight: bold; font-size: 16px;">Rs. ${totalAmount}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center;">You can view the full details of this interaction in your Venue Dashboard.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:5173/venue-owner/dashboard"
             style="display: inline-block; background-color: #5d0f0f; color: white; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Go to Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated message from Saan App. Please do not reply.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Paid Booking for ${venueName} - Saan`,
    html,
  });
};

// Send "Pay Later" notification email to User and Owner
export const sendPayLaterEmail = async ({ userEmail, userName, ownerEmail, ownerName, venueName, date, expiryTime }) => {
  const formattedDate = new Date(date).toLocaleDateString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #3b82f6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⏳ Booking Hold Initiated</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hello ${userName},</p>
        <p>Your booking for <strong>${venueName}</strong> on <strong>${formattedDate}</strong> is currently on a <strong>5-hour temporary hold</strong>.</p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-weight: bold;">
            ⚠️ You must complete payment within 5 hours, otherwise your booking will be automatically cancelled.
          </p>
          <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 14px;">
            Expiry Time: ${new Date(expiryTime).toLocaleString()}
          </p>
        </div>

        <p>Please log in to your dashboard to complete the payment via eSewa before the timer ends.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© Saan App - Venue Management System</p>
      </div>
    </div>
  `;

  // Send to user
  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Booking Hold: ${venueName} - Action Required`,
    html,
  });

  // Send simplified version to owner
  const ownerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #3b82f6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⏳ New Temporary Booking</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hello ${ownerName},</p>
        <p>A user has placed a 5-hour hold on your venue <strong>${venueName}</strong> for <strong>${formattedDate}</strong>.</p>
        <p><strong>Status:</strong> Timely Booking (Pending Payment)</p>
        <p>If the user does not complete the payment within 5 hours, the slot will be automatically released.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© Saan App</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: ownerEmail,
    subject: `Temporary Booking Alert: ${venueName}`,
    html: ownerHtml,
  });
};

// Send booking expiry notification
export const sendBookingExpiryEmail = async (email, name, venueName, date) => {
  const formattedDate = new Date(date).toLocaleDateString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ef4444; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">❌ Booking Cancelled</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hello ${name},</p>
        <p>Your temporary booking for <strong>${venueName}</strong> on <strong>${formattedDate}</strong> has been <strong>cancelled</strong> because the 5-hour payment window has expired.</p>
        <p>The slot is now available for other users to book.</p>
        <p>If you still wish to book this venue, please start a new booking process.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© Saan App</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Booking Cancelled: Non-payment - ${venueName}`,
    html,
  });
};
// Send comprehensive booking confirmation email
export const sendBookingConfirmationEmail = async ({
  to,
  userName,
  venueName,
  date,
  eventType,
  guests,
  selectedPackage,
  selectedMenuItems,
  totalPrice,
  paidAmount,
  paymentStatus,
  isOwner = false
}) => {
  const formattedDate = new Date(date).toLocaleDateString();
  const remainingAmount = totalPrice - paidAmount;
  
  let menuHtml = '';
  if (selectedMenuItems && selectedMenuItems.length > 0) {
    menuHtml = `
      <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Selected Menu</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${selectedMenuItems.map(item => `
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #1e293b;">${item.itemName}</td>
              <td style="padding: 4px 0; font-size: 14px; color: #64748b; text-align: right;">x${item.quantity}</td>
              <td style="padding: 4px 0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;">Rs. ${item.price * item.quantity}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  let packageHtml = '';
  if (selectedPackage && selectedPackage.packageName) {
    packageHtml = `
      <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd;">
        <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em;">Selected Package</h3>
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0c4a6e;">${selectedPackage.packageName}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #075985;">Type: ${selectedPackage.packageType}</p>
      </div>
    `;
  }

  const html = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #5d0f0f; padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Booking Confirmation</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">${isOwner ? 'A new booking has been placed' : 'Your reservation is confirmed!'}</p>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="font-size: 16px; color: #334155; margin-bottom: 25px;">Hello ${userName},</p>
        
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">Event Overview</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Venue</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${venueName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Event Type</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${eventType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Guests</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${guests} Pax</td>
            </tr>
          </table>
        </div>

        ${packageHtml}
        ${menuHtml}

        <div style="margin-top: 25px; padding: 20px; background: #1e293b; border-radius: 16px; color: #ffffff;">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Payment Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: rgba(255,255,255,0.8);">Total Amount</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">Rs. ${totalPrice}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #4ade80;">Amount Paid</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right; color: #4ade80;">Rs. ${paidAmount}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 15px 0 0 0; font-size: 16px; font-weight: 700;">Remaining Balance</td>
              <td style="padding: 15px 0 0 0; font-size: 20px; font-weight: 800; text-align: right; color: #facc15;">Rs. ${remainingAmount}</td>
            </tr>
          </table>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.5); text-align: center;">Status: ${paymentStatus.toUpperCase()}</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">${isOwner ? 'Manage this booking in your dashboard.' : 'Thank you for choosing Saan for your special day!'}</p>
          <a href="http://localhost:5173" style="display: inline-block; padding: 14px 32px; background: #5d0f0f; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.2s;">View Dashboard</a>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8;">© Saan - Modern Venue Management<br>This is an automated confirmation email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Saan App" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Booking Confirmation: ${venueName} - ${formattedDate}`,
    html,
  });
};
