export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference, email } = req.body;

  if (!reference || !email) {
    return res.status(400).json({ error: "Missing data" });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        amount: 3660000, // 36,600 GHS in pesewas
        currency: "GHS",
        metadata: {
          book_reference: reference
        },
        callback_url: `${process.env.VERCEL_URL}/enrollment-success.html`
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ error: "Paystack init failed" });
    }

    return res.status(200).json({ authorization_url: data.data.authorization_url });

  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
