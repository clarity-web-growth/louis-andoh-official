export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing payment reference");
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(403).send("Payment not verified");
    }

    // If verified → redirect to file
    return res.redirect(
      302,
      "https://louis-andoh-official.vercel.app/THE_GOLD_EXECUTION_FRAMEWORK_AUTHORITY_EDITION.pdf"
    );

  } catch (error) {
    return res.status(500).send("Verification failed");
  }
}
