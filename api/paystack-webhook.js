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

  if (event.event !== "charge.success") {
    return res.status(200).json({ received: true });
  }

  const reference = event.data.reference;
  const email = event.data.customer.email;
  const name = event.data.customer.first_name || "";
  const amount = event.data.amount;
  const status = event.data.status;

  // 🔒 Validate payment integrity
  if (status !== "success") {
    return res.status(400).send("Payment not successful");
  }

  if (amount !== 169700) {
    return res.status(400).send("Invalid payment amount");
  }

  try {
    // 🔎 Check if reference already exists
    const check = await fetch(
      `${supabaseUrl}/rest/v1/downloads?reference=eq.${reference}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const existing = await check.json();

    if (existing.length > 0) {
      return res.status(200).json({ already_processed: true });
    }

    // ✅ Insert reference
    const insert = await fetch(`${supabaseUrl}/rest/v1/downloads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        reference: reference,
      }),
    });

    if (!insert.ok) {
      throw new Error("Failed to insert reference");
    }

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
