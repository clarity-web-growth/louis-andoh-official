import crypto from "crypto";

export default async function handler(req, res) {

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ valid: false });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {

    // Check if advisory applicant is approved but not yet enrolled
    const response = await fetch(
      `${supabaseUrl}/rest/v1/advisory_access?book_reference=eq.${reference}&approved=eq.true&enrollment_paid=eq.false`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(200).json({ valid: false });
    }

    // Generate secure token
    const token = crypto.randomBytes(16).toString("hex");

    // Save token in downloads table
    await fetch(
      `${supabaseUrl}/rest/v1/downloads?reference=eq.${reference}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          download_token: token
        })
      }
    );

    // Return validation + token
    return res.status(200).json({
      valid: true,
      token: token
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      valid: false
    });

  }

}
