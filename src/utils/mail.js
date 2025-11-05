import { transporter } from "../config/mailer.js";

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"J-Librairie" <${process.env.SMTP_USER}>`, // ⚠️ tu avais EMAIL_USER → à corriger
      to,
      subject,
      html,
    });

    console.log("✅ Email envoyé :", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erreur envoi email :", error);
    return false;
  }
};
