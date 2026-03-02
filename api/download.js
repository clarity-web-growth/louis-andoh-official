import { supabase } from './lib/supabase.js';

export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing payment reference");
  }

  try {

    // 1️⃣ Verify with Paystack
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await verify.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(403).send("Payment not verified.");
    }

    // 2️⃣ Check if reference already used
    const { data: existing } = await supabase
      .from('downloads')
      .select('*')
      .eq('reference', reference)
      .single();

    if (existing) {
      return res.status(403).send("Download already used.");
    }

    // 3️⃣ Insert reference (marks as used)
    const { error } = await supabase
      .from('downloads')
      .insert([{ reference }]);

    if (error) {
      return res.status(500).send("Failed to record download.");
    }

    // 4️⃣ Serve file
    return res.redirect(
      302,
      `${req.headers.origin}/api/secure-files/gold-framework.pdf`
    );

  } catch (error) {
    return res.status(500).send("Verification failed.");
  }
}
