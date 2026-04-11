import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
});

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, type, message } = req.body;

    // Validate required fields
    if (!name || !email || !type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Get admin email from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    if (!adminEmail) {
      console.error('❌ Admin email not configured');
      return res.status(500).json({
        success: false,
        message: 'Unable to process your request. Please try again later.'
      });
    }

    // Create email content
    const subject = `New ${type.charAt(0).toUpperCase() + type.slice(1)} from ${name}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #5d0f0f; margin-bottom: 20px;">New Customer ${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 10px 0;"><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
            <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          </div>
          
          <div style="border-top: 2px solid #5d0f0f; padding-top: 20px; margin-top: 20px;">
            <h3 style="color: #5d0f0f; margin-top: 0;">Message:</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated email from SAAN Venue Booking System</p>
            <p>Reply to this customer at: <strong>${email}</strong></p>
          </div>
        </div>
      </div>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: subject,
      html: htmlContent,
      replyTo: email,
    });

    console.log(`✅ Contact form email sent to admin from ${name} (${email})`);

    // Also send confirmation email to user
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #5d0f0f; margin-bottom: 20px;">We Received Your Message</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${name},</p>
          
          <p style="color: #333; line-height: 1.6;">Thank you for contacting us! We have received your ${type} and our team will review it shortly.</p>
          
          <p style="color: #333; line-height: 1.6;">We typically respond to inquiries within 24-48 hours. If your matter is urgent, please call us directly.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #5d0f0f; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Your ${type}:</strong></p>
            <p style="margin: 10px 0; color: #666; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Best regards,<br><strong>SAAN Venue Booking Team</strong></p>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated confirmation email. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'We received your message - SAAN Support',
        html: confirmationHtml,
      });
      console.log(`✅ Confirmation email sent to user ${email}`);
    } catch (confirmationError) {
      console.warn('⚠️ Failed to send confirmation email:', confirmationError.message);
      // Don't fail the request, just log the warning
    }

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit your message. Please try again later.',
      error: error.message
    });
  }
};
