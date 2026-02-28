export default function handler(req, res) {
  const { token } = req.query;

  if (token !== "gold-access-2026") {
    return res.status(403).send("Unauthorized");
  }

  return res.redirect(
    302,
    "https://louis-andoh-official.vercel.app/THE_GOLD_EXECUTION_FRAMEWORK_AUTHORITY_EDITION.pdf"
  );
}
