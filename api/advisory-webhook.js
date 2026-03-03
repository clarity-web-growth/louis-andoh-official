import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hash = crypto
    .createHmac("sha512", paystackSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {

    const amount = event.data.amount;
    const reference = event.data.metadata?.reference;

    // Verify advisory payment amount
    if (amount !== 3660000) { 
       return res.status(400).send("Invalid amount");
    }

    if (!reference) {
      return res.status(400).send("Missing book reference");
    }

    try {
      await fetch(
        `${supabaseUrl}/rest/v1/advisory_access?book_reference=eq.${reference}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            enrollment_paid: true
          }),
        }
      );

      return res.status(200).json({ success: true });

    } catch (error) {
      return res.status(500).json({ error: "Webhook failed" });
    }
  }

  return res.status(200).json({ received: true });
}
