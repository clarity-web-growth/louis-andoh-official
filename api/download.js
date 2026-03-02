import { isUsed, markAsUsed } from "./used-references.js";

export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing payment reference");
  }

  try {
    // Check if reference already used
    if (isUsed(reference)) {
      return res.status(403).send("Download already used.");
    }

    // Verify with Paystack
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await verify.json();

    if (data.status && data.data.status === "success") {

      // Mark reference as used
      markAsUsed(reference);

      return res.redirect(
        302,
        `${req.headers.origin}/api/secure-files/gold-framework.pdf`
      );

    } else {
      return res.status(403).send("Payment not verified.");
    }

  } catch (error) {
    return res.status(500).send("Verification failed.");
  }
}
