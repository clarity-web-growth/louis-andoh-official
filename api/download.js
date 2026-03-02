export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing payment reference");
  }

  try {
    // Verify payment with Paystack
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await verify.json();

    // Check if payment is successful
    if (
      data.status &&
      data.data.status === "success"
    ) {
      // Payment verified → serve file
      return res.redirect(
        302,
        `${req.headers.origin}/api/secure-files/gold-framework.pdf`
      );
    } else {
      return res.status(403).send("Payment not verified");
    }

  } catch (error) {
    return res.status(500).send("Verification failed");
  }
}
