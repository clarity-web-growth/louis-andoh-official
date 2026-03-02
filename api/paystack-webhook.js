// /api/paystack-webhook.js

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const mailerliteApiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify Paystack signature
  const hash = crypto
    .createHmac("sha512", paystackSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const email = event.data.customer.email;
    const name = event.data.customer.first_name || "";
    const amount = event.data.amount;

    // 🔒 Verify amount (1697 GHS = 169700 kobo)
    if (amount !== 169700) {
      return res.status(400).send("Invalid payment amount");
    }

    try {
      // ✅ Save reference in Supabase
      await fetch(`${supabaseUrl}/rest/v1/downloads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          reference: reference,
        }),
      });

      // ✅ Add subscriber to MailerLite
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
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  return res.status(200).json({ received: true });
}
