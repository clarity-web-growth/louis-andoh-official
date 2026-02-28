import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { token } = req.query;

  // Replace with real token validation later
  if (token !== process.env.DOWNLOAD_SECRET) {
    return res.status(403).send("Unauthorized");
  }

  const filePath = path.join(process.cwd(), "THE_GOLD_EXECUTION_FRAMEWORK_AUTHORITY_EDITION.pdf");

  const file = fs.readFileSync(filePath);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=The_Gold_Execution_Framework.pdf");
  res.send(file);
}
