import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(403).send("Unauthorized");
  }

  const filePath = path.join(process.cwd(), "api/secure-files/gold-framework.pdf");

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=The_Gold_Execution_Framework_Authority_Edition.pdf"
  );

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
