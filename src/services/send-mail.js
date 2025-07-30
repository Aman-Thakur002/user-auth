import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import axios from "axios";
const path = require("path");

const appRoot = path.resolve(__dirname);

handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

// Helper for equality comparison
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Helper for formatting currency
handlebars.registerHelper('currency', function(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'XCD'
  }).format(amount);
});


let readHTMLFile = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, function (err, html) {
      if (err) reject(err);
      else resolve(html);
    });
  });
};

export async function sendMail(
  emailData,
  replacements,
  htmlFileName = "mail-template.html",
  pdfBufferData = null,
  pdfFileName = null
) {
  try {
    const {
      MAIL_DRIVER,
      MAIL_HOST,
      MAIL_PORT,
      MAIL_USER,
      MAIL_PASS,
      MAIL_FROM_NAME,
      MAIL_FROM_ADDRESS,
      MAIL_BREVO_API_KEY,
    } = process.env;

    const filePath = `${appRoot}/mail-templates/${htmlFileName}`;
    const html = await readHTMLFile(filePath);
    const template = handlebars.compile(html);
    const htmlsend = template(replacements);

    let msg;
    switch (MAIL_DRIVER) {
      case "sendmail": {
        const transporter = nodemailer.createTransport({
          sendmail: true,
          newline: "unix",
          path: "/usr/sbin/sendmail",
        });

        msg = {
          from: emailData.from || `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: htmlsend,
        };

        if (pdfBufferData) {
          msg.attachments = [{ filename: pdfFileName, content: pdfBufferData }];
        }

        await transporter.sendMail(msg);
        console.log("Email sent via sendmail");
        break;
      }

      case "smtp": {
        const transporter = nodemailer.createTransport({
          host: MAIL_HOST,
          port: MAIL_PORT,
          secure: false,
          auth: {
            user: MAIL_USER,
            pass: MAIL_PASS,
          },
        });

        msg = {
          from: emailData.from || `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: htmlsend,
        };

        if (pdfBufferData) {
          msg.attachments = [{ filename: pdfFileName, content: pdfBufferData }];
        }

        await transporter.sendMail(msg);
        console.log("Email sent via SMTP");
        break;
      }

      case "brevo": {
        const brevoPayload = {
          sender: {
            name: MAIL_FROM_NAME,
            email: MAIL_FROM_ADDRESS,
          },
          to: [
            {
              email: emailData?.to,
              name: emailData?.name || "",
            },
          ],
          subject: emailData.subject,
          htmlContent: htmlsend,
        };
        // console.log(brevoPayload.to);
        if (pdfBufferData) {
          brevoPayload.attachment = [
            {
              name: pdfFileName,
              content: pdfBufferData.toString("base64"),
            },
          ];
        }

        await axios.post("https://api.brevo.com/v3/smtp/email", brevoPayload, {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": MAIL_BREVO_API_KEY,
          },
        });

        console.log("Email sent via Brevo");
        break;
      }

      default:
        throw new Error(`Unsupported MAIL_DRIVER: ${MAIL_DRIVER}`);
    }

    return "Email Sent!";
  } catch (error) {
    console.error("Failed to send email:", error);
    return
  }
}
