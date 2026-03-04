// /api/download.js

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { token } = req.query;

if (!token) {
  return res.status(400).send("Missing token");
}

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {

    const response = await fetch(
      `${supabaseUrl}/rest/v1/downloads?download_token=eq.${token}`
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

    const record = data[0];

    const downloadCount = record.download_count || 0;
    const createdAt = new Date(record.created_at);
    const now = new Date();

    const hoursSincePurchase =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // ❌ Block if more than 24 hours
    if (hoursSincePurchase > 24) {
      return res
        .status(403)
        .send("Download window expired. Contact support.");
    }

    // ❌ Block if download limit reached
    if (downloadCount >= 2) {
      return res
        .status(403)
        .send("Download limit reached.");
    }

    // ✅ Increment download counter
    await fetch(
      `${supabaseUrl}/rest/v1/downloads?reference=eq.${reference}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          download_count: downloadCount + 1,
        }),
      }
    );

    const filePath = path.join(
      process.cwd(),
      "api",
      "secure-files",
      "gold-framework.pdf"
    );

    const file = fs.readFileSync(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Gold-Framework.pdf"
    );

    return res.status(200).send(file);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
}
