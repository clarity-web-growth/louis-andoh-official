// /api/paystack-webhook.js

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const mailerliteApiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  const hash = crypto
    .createHmac("sha512", paystackSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const email = event.data.customer.email;
    const name = event.data.customer.first_name || "";

    try {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailerliteApiKey}`,
        },
        body: JSON.stringify({
          email: email,
          fields: {
            name: name,
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
