const { Users } = require("../models");
import logger from "../config/winston";
import { sendMail } from "../services/send-mail";
import crypto from "crypto";


export async function SendOtp(userData) {
  try {
    // Generate 6 digit OTP and expiry time
    const otp = Math.floor(100000 + Math.random() * 900000);
    const EXPIRE_IN = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Update user with OTP details
    await Users.update(
      { otp, otpExpire: EXPIRE_IN },
      { where: { email: userData?.email } }
    );

    const emailData = {
      to: userData.email,
      name: userData.name, 
      subject: "One Time Password"
    };

    const otpData = {
      otp: otp,
      name: userData?.name,
      email: userData?.email,
      isOtp: userData?.isOtp || false,
      isRegistration: userData?.isRegistration || false,
    };

    // Send OTP email
    const result = await sendMail(emailData, otpData, "email-template.html");
    return result;

  } catch (error) {
    logger.error(`Error in SendOtp: ${error.message}`); 
    throw error;
  }
}


//----------- Function to send magic link for passwordless login
export async function sendMagicLink(userData) {
  try {

    const magicLinkToken = crypto.randomBytes(32).toString("hex");
    const EXPIRE_IN = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes expiry

    // Hash token for DB for security
    const hashedToken = crypto.createHash("sha256").update(magicLinkToken).digest("hex");

    await Users.update(
      { magicLinkToken: hashedToken, magicLinkTokenExpire: EXPIRE_IN },
      { where: { email: userData?.email } }
    );

    // Email and link data
    const emailData = {
      to: userData.email,
      name: userData.name,
      subject: "Magic Link"
    };

    const linkData = {
      token: magicLinkToken,
      name: userData?.name,
      email: userData?.email
    };

    await sendMail(emailData, linkData, "email-template.html");
    return { success: true, message: "Magic link sent to your email." };

  } catch (error) {
    logger.error(`Error in sendMagicLink: ${error.message}`);
    throw error;
  }
}
