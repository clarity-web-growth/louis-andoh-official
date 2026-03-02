export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { reference } = req.body;

  if (!reference) {
    return res.status(400).send("Missing reference");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/downloads?reference=eq.${reference}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ applied: true }),
      }
    );

    if (!response.ok) {
      throw new Error("Update failed");
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).send("Failed to mark as applied");
  }
}
