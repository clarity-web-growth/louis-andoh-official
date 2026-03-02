export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ valid: false });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/downloads?reference=eq.${reference}&applied=eq.false`,
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

    return res.status(200).json({ valid: true });

  } catch (error) {
    return res.status(500).json({ valid: false });
  }
}
