import express from "express";
import { Request, Response } from "../types";

export const aiRouter = express.Router();

aiRouter.post("/suggest", async (req: Request, res: Response) => {
  try {
    const { contents } = req.body;

    if (!contents) {
      return res.status(400).json({ msg: "Contents required", type: "ERROR" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ msg: "AI service not configured", type: "ERROR" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "X-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ msg: "AI request failed", type: "ERROR" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Internal server error", type: "ERROR" });
  }
});
