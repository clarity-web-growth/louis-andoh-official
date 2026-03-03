import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mailerliteApiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

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

  const amount = event.data.amount;
  const email = event.data.customer.email;

  // -----------------------------
  // 🟡 BOOK PURCHASE (36,600 GHS)
  // -----------------------------
  if (amount === 169700) { // <-- KEEP your original book amount here if different
    const reference = event.data.reference;

    try {
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

      // Add to MailerLite
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailerliteApiKey}`,
        },
        body: JSON.stringify({
          email: email,
          groups: [groupId],
        }),
      });

      return res.status(200).json({ success: true });

    } catch (error) {
      return res.status(500).json({ error: "Book webhook failed" });
    }
  }

  // -----------------------------
  // 🔴 ADVISORY PAYMENT (36,600 GHS)
  // -----------------------------
  if (amount === 3660000) { // 36,600 GHS in pesewas

    const bookReference = event.data.metadata?.book_reference;

    if (!bookReference) {
      return res.status(400).send("Missing book reference");
    }

    try {
      await fetch(
        `${supabaseUrl}/rest/v1/advisory_access?book_reference=eq.${bookReference}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            enrollment_paid: true,
          }),
        }
      );

      return res.status(200).json({ success: true });

    } catch (error) {
      return res.status(500).json({ error: "Advisory webhook failed" });
    }
  }

  return res.status(200).json({ received: true });
}
