import nodemailer from "nodemailer";
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const mailOptions = {
      from: `${process.env.PROJECT_NAME || "Code Sync"} <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error)
  }
};
