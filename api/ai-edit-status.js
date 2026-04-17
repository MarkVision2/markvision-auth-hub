import { buildStatus, decodeTaskToken } from "./_ai-edit-utils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = typeof req.query?.token === "string" ? req.query.token : "";

  if (!token) {
    return res.status(400).json({ error: "token is required" });
  }

  try {
    const request = decodeTaskToken(token);
    const status = buildStatus(request, Date.now(), token);
    return res.status(200).json(status);
  } catch (error) {
    return res.status(400).json({ error: "Invalid task token" });
  }
}
