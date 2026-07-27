import nodemailer from "nodemailer";

const getEnv = (key: string) => process.env[key]?.trim();

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
};

type OrderEmailPayload = {
  recipientEmail: string;
  customerName?: string;
  orderId: number;
  total?: number;
  deliveryMethod?: string | null;
  items: OrderItem[];
};

const smtpHost = getEnv("SMTP_HOST");
const smtpPort = Number(getEnv("SMTP_PORT") || 587);
const smtpUser = getEnv("SMTP_USER");
const smtpPass = getEnv("SMTP_PASS");
const smtpFrom = getEnv("SMTP_FROM") || smtpUser || "no-reply@example.com";

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: (getEnv("SMTP_SECURE") || "false").toLowerCase() === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

export const sendOrderPlacedEmail = async (payload: OrderEmailPayload) => {
  if (!transporter) {
    console.warn("Order email skipped: SMTP is not configured.");
    return { ok: false, reason: "smtp-not-configured" };
  }

  const itemsMarkup = payload.items.length
    ? payload.items
        .map((item) => {
          const qty = item.quantity || 0;
          const price = Number(item.price || 0);
          return `<li>${item.name || "Product"} × ${qty} — ₱${price.toFixed(2)}</li>`;
        })
        .join("")
    : "<li>No items listed.</li>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2>Order placed successfully</h2>
      <p>Hello ${payload.customerName || "there"},</p>
      <p>Your order <strong>#${payload.orderId}</strong> has been received and is now being processed.</p>
      <p><strong>Delivery method:</strong> ${payload.deliveryMethod || "Standard"}</p>
      <p><strong>Total:</strong> ₱${Number(payload.total || 0).toFixed(2)}</p>
      <ul>${itemsMarkup}</ul>
      <p>Thank you for shopping with DON.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: payload.recipientEmail,
      subject: `DON order confirmation #${payload.orderId}`,
      html,
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to send order confirmation email", error);
    return { ok: false, reason: "send-failed", error };
  }
};
