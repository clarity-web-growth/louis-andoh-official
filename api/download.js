// /api/download.js

export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing reference");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/downloads?reference=eq.${reference}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(403).send("Unauthorized");
    }

    // ✅ If reference exists → serve file
    return res.redirect(
      302,
      `${process.env.VERCEL_URL}/api/secure-files/gold-framework.pdf`
    );

  } catch (error) {
    return res.status(500).send("Server error");
  }
}
