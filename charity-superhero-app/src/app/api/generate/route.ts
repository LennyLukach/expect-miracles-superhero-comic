// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * PROMPT GOALS
 * - Flashier, brighter costume while keeping the strict color scheme.
 * - No muddy/navy-near-black drift; use vivid royal/electric blues, hot pink accents, crisp white trim.
 * - Background remains secondary but energetic.
 */
function buildPrompt(firstName: string, accessories?: string) {
  const issueNo = randInt(1, 499);
  const price = randInt(50, 100); // ¢
  const accText =
    accessories && accessories.trim().length > 0
      ? accessories.trim()
      : "artist's choice of classic superhero gear";

  const prompt = `Create a full-bleed vintage comic-book COVER illustration (Golden/Silver Age homage) celebrating a real-life hero.
Overall tone: bold, uplifting, iconic. Theme: “Taking Action Against Cancer”.

IDENTITY & LIKENESS
• The hero is based on the uploaded face — match facial structure, skin tone, eyes, nose, mouth, and hair. One single person only.
• Face is realistic and unmistakable; the rest of the art is clean comic ink + color.

TITLE & COVER ELEMENTS (draw into the art)
• Large arched title with the hero’s name: “${firstName}”.
• Tagline ribbon under the title: “EXPECT MIRACLES”.
• Publisher corner box including “No. ${issueNo}” and a tiny date.
• Circular price badge “${price}¢” near a top corner.
• Include the phrase “Taking Action Against Cancer” as a small banner/corner element.

========================
ACCESSORIES — HIGH PRIORITY (REQUIRED)
========================
Accessories to include: **${accText}**.
• Treat these as REQUIRED props/costume elements — they must be clearly visible on the final cover.
• Integrate them into the hero design or pose (held, worn, or attached) so they read at a glance.
• Place them without blocking the face, emblem, or main title; keep them inside the frame (not cropped off).
• If multiple items are listed, include ALL items in a coherent way (grouped or distributed) with readable silhouettes.
• Match brand color rules below: blue/pink/white (small neutral metallic silver allowed for buckles/fasteners only).
FAILURE GUARD: Do NOT omit or hide the listed accessories. If any accessory is unclear, recompose to make it readable.

========================
COSTUME — HARD REQUIREMENTS (BRIGHT / FLASHY)
========================
COLOR RULES (STRICT)
• Suit colors are LIMITED to DEEP/ROYAL BLUE, PINK, and WHITE, plus black/white for linework/highlights.
• Use the following specific color schemes:
    DEEP_BLUE = "#003087" 
    PURPLE = "#7b2c85"
    WHITE = "#ffffff"  
• Use **hot, saturated pink** accents (vivid magenta vibe) with controlled glow on edges/panels.
• White trim must be **clean and bright** (crisp highlights).
• Optional tiny metallic accents (silver/steel) only for buckles or fasteners.
• DO NOT use red, orange, green, or other colors anywhere on the suit.

SILHOUETTE & FIT
• Modern-classic superhero silhouette: athletic, streamlined, no bulky armor.
• Clean, readable shapes; tailored fit; clear separation between torso, belt, gloves, boots, and cape (if any).

COLOR BLOCKING (apply consistently)
• Base: **royal/electric blue** torso and legs (brighter than typical navy).
• Panels/Trim: **white** along edges, seams, or stripe panels (collar, shoulder piping, glove/boot cuffs).
• Accent: **hot pink** as secondary panels, piping, or energy seams (accent, not dominant over blue).
• Keep large, readable shapes—avoid busy micro-patterns or low-contrast mixes.

MATERIAL & SURFACE (to increase “pop”)
• Blue panels: semi-gloss with subtle specular highlights on curves.
• White trim: glossy/clean; sharp edge highlights.
• Pink accents: slightly luminous edge glow (subtle bloom), not neon spill.
• Minimal fabric texture (fine weave or micro-hex) only where it supports form; no noisy textures.

EMBLEM & RIBBON INTEGRATION
• Chest emblem includes a stylized **cancer ribbon** integrated into a badge/shield or circle.
• High contrast emblem: white with pink accent lines on a vivid blue field, or white/pink on blue.
• Keep edges crisp; avoid gradients that muddy the mark.

GLOVES, BELT, BOOTS, CAPE (if included)
• Gloves: bright blue with white cuffs (thin pink stripe permissible).
• Belt: white or blue, minimal silver buckle; optional small ribbon motif.
• Boots: bright blue with white top band; thin pink piping allowed.
• Cape (optional): blue exterior, white lining, thin pink edge binding. If no cape, emphasize strong shoulder lines.

HEAD / MASK (optional)
• If used, sleek domino/half mask in blue with white edge; tiny pink highlight acceptable. Hair natural.

POSE & READABILITY
• Confident, smiling hero pose; clear silhouette; emblem readable from mid-distance.
• Hands and fingers anatomically correct—no warping.

========================
BACKGROUND (SECONDARY, BUT ENERGETIC)
========================
• Choose ONE backdrop that complements the suit without stealing focus:
  - stylized skyline with halftone sunburst,
  - radiant energy beams / aurora arcs,
  - open sky with dramatic clouds,
  - abstract ribbon/geometric motif,
  - cosmic starfield or stadium/spotlights.
• Use atmospheric depth, rays, sparkles, and halftone texture; keep its saturation moderated so the suit remains the star.
• No plain/empty backgrounds.

RENDERING & PRINT FEEL
• Clean inking, crisp edges, controlled halftone shading; modern contrast without muddiness.
• **VIBRANCE OVERRIDE**: increase saturation and brightness slightly on the suit (blue/pink/white) to make it **pop**; keep skin tones natural.
• Cinematic key light with a bright rim light to pop the silhouette from the background.
• Subtle vintage paper grain/vignette only—no stains, tears, or heavy grime.

FAILURE GUARDS (DO NOT)
• Do NOT darken the blues to nearly black; keep them clearly blue and vibrant.
• Do NOT introduce colors outside blue/pink/white on the suit.
• Do NOT add bulky armor or noisy textures.
• Do NOT duplicate people, distort hands, or add watermarks/gibberish text.
• Do NOT depict medical equipment or cancer cells.

DELIVERABLE
• A complete, collectible-quality comic cover with integrated title elements and the polished, **bright/flashy** costume described above — with the following accessories included and clearly visible: **${accText}**.`;

  return prompt;
}


type OpenAIImageData = { url?: string; b64_json?: string };
type OpenAIImageResp =
  | { data: OpenAIImageData[]; error?: undefined }
  | { data?: undefined; error: { message?: string; code?: string } };

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

    // Build form-data for OpenAI image *edits* (conditioning on the uploaded photo)
    const openaiForm = new FormData();
    const imageName =
      photo instanceof File && photo.name ? photo.name : "photo.png";
    openaiForm.append("image[]", photo, imageName);
    openaiForm.append("prompt", prompt);
    // For even cleaner, poppier results, uncomment if your account supports it:
    // openaiForm.append("size", "2048x2048");
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
      return NextResponse.json(
        { error: `OpenAI error: ${errText}` },
        { status: 500 }
      );
    }

    const json = (await resp.json()) as OpenAIImageResp;
    const b64 =
      json && "data" in json && Array.isArray(json.data)
        ? json.data[0]?.b64_json
        : undefined;

    if (!b64) {
      return NextResponse.json(
        { error: "No image returned from OpenAI." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(b64, "base64");

    // Upload to Cloudinary
    const secureUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "charity-superhero", resource_type: "image", format: "png" },
        (
          err: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined
        ) => {
          if (err || !result?.secure_url) {
            reject(err ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ imageUrl: secureUrl });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
