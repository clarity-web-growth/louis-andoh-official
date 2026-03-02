// /api/paystack-webhook.js

import crypto from "crypto";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const mailerliteApiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  // 🔐 Verify Paystack signature
  const hash = crypto
    .createHmac("sha512", paystackSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  // Only handle successful charges
  if (event.event === "charge.success") {
    const { email, first_name } = event.data.customer;
    const reference = event.data.reference;
    const amount = event.data.amount; // amount in kobo
    const paidAmount = amount / 100;

    // 🔎 Verify correct product price (example: GHS 1697)
    if (paidAmount !== 1697) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    try {
      // Add buyer to MailerLite group
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailerliteApiKey}`,
        },
        body: JSON.stringify({
          email: email,
          fields: {
            name: first_name || "",
            paystack_reference: reference,
          },
          groups: [groupId],
        }),
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "MailerLite failed" });
    }
  }

  return res.status(200).json({ received: true });
}
