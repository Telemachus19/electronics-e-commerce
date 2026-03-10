const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Verify Your Email - Electronics E-Commerce",
    text: `Your verification code is: ${otp}. It expires in 15 minutes.`,
    html: `<h3>Welcome!</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 15 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };