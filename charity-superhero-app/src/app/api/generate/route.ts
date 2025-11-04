// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildPrompt(firstName: string, accessories?: string) {
  const issueNo = randInt(1, 499);
  const price = randInt(50, 100); // in cents
  const accText =
    accessories && accessories.trim().length > 0
      ? accessories.trim()
      : "artist's choice of classic superhero gear";

  const prompt = `Create a comic book cover in the style of Marvel or DC issues.
Theme: “Taking Action Against Cancer” — bold, inspiring, and heroic.

Design requirements:

Title/Header: Prominently display the hero’s name (e.g., “${firstName}”) with a tagline below: “EXPECT MIRACLES”.
Publisher box: Add details like issue number (e.g., “No. ${issueNo}”) and other common items found on a comic book cover.
Hero depiction:
The central figure should be a smiling superhero in a confident, action pose.
Ensure the superhero’s face is a highly realistic match to the uploaded photo — lifelike, expressive, and immediately recognizable, as if it were a movie poster.
Costume: Bright, classic suit with a bold chest logo – feel free to incorporate the cancer ribbon
Include accessories or symbolic details (cape, belt, gloves, etc.).
Text bubbles: Include dialogue as you see fit
Cover details:
Price tag (e.g., “${price}¢”)
Include tagline “Taking Action Against Cancer” — bold, inspiring, and heroic.
“Use a slightly richer vintage color palette — deeper reds, bright yellows, sky blues, and bold blacks — with subtle highlights and glows around the hero for added pop. Enhance contrast while preserving halftone shading for a lively, printed feel.”
Include the cancer ribbon
Accessories:
Add accessories: ${accText}
Other:
Do not include or depict cancer cells.
Tone: Heroic, motivational, nostalgic — as if it’s a collectible Golden Age comic issue celebrating a real-life hero.`;

  return prompt;
}

type OpenAIImageResp = {
  data?: Array<{ url?: string; b64_json?: string }>;
  error?: { message?: string; code?: string };
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const photo = form.get("photo") as File | Blob | null;
    const firstName = (form.get("firstName") as string | null)?.trim();
    const accessories = (form.get("accessories") as string | null) ?? "";

    if (!photo) {
      return NextResponse.json(
        { error: "Missing photo upload." },
        { status: 400 }
      );
    }
    if (!firstName) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(firstName, accessories || undefined);

    // Build form-data for OpenAI image edits.
    // Use `image[]` per API to condition on the uploaded photo.
    const openaiForm = new FormData();
    const imageName =
      (photo as any)?.name || "photo.png"; // Blob may not have a name; that's OK
    openaiForm.append("image[]", photo, imageName);
    openaiForm.append("prompt", prompt);
    openaiForm.append("size", "1024x1024");
    openaiForm.append("model", "gpt-image-1");

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiForm,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `OpenAI error: ${errText}` }, { status: 500 });
    }
    const json = (await resp.json()) as OpenAIImageResp;
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "No image returned from OpenAI." }, { status: 500 });
    }

    const buffer = Buffer.from(b64, "base64");

    // Upload to Cloudinary
    const secureUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "charity-superhero", resource_type: "image", format: "png" },
        (err, result) => {
          if (err || !result?.secure_url)
            return reject(err || new Error("Cloudinary upload failed"));
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ imageUrl: secureUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}
