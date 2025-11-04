"use client";

import { useState } from "react";
import Image from "next/image";

/** Keep this OUTSIDE so inputs don’t remount and lose focus */
function ComicCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-black bg-[#f3ead7] p-4 shadow-[6px_6px_0_0_#000]">
      {children}
    </div>
  );
}

type GenResponse = { imageUrl?: string; error?: string };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [accessories, setAccessories] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setResultUrl(null);
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    if (!file) {
      setError("Please upload a clear photo of the person.");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("firstName", firstName.trim());
      fd.append("accessories", accessories.trim());

      const resp = await fetch("/api/generate", { method: "POST", body: fd });
      const json = (await resp.json()) as GenResponse;
      if (!resp.ok || !json.imageUrl) {
        throw new Error(json.error || "Image generation failed.");
      }
      setResultUrl(json.imageUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#0b1626] bg-[radial-gradient(circle_at_16px_16px,rgba(255,255,255,0.05)_2px,transparent_2px)] [background-size:24px_24px] p-4 md:p-6">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-white/60 border-t-transparent animate-spin" />
            <p className="text-white font-bold tracking-wide">Building your cover…</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-5">
        {/* Title */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold leading-tight text-[#f8f6f1] drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
            Expect Miracles
          </h1>
          <h2 className="text-2xl font-black text-[#f5c042] drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
            Superhero Maker
          </h2>
        </header>

        {/* Mobile-first layout */}
        <form onSubmit={onSubmit} className="grid gap-5">
          <ComicCard>
            <div className="flex flex-col gap-3">
              <label className="font-extrabold text-base tracking-wide text-[#111]">
                Upload Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onPick}
                className="block w-full rounded border-2 border-black bg-white p-3 text-sm font-semibold text-black placeholder:text-black/60"
                required
              />
              {file && (
                <p className="text-xs font-bold text-[#222]">
                  Selected: <span className="underline">{file.name}</span>
                </p>
              )}

              {/* LARGER, non-cropping preview */}
              {preview && (
                <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] overflow-hidden rounded-lg border-2 border-black bg-[#e6ddc6]">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                </div>
              )}
              {!preview && (
                <p className="text-xs text-[#333] font-semibold">
                  Tip: Clear, front-facing photos work best.
                </p>
              )}
            </div>
          </ComicCard>

          <ComicCard>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-extrabold text-[#111]">
                  First name <span className="text-[#c0312b]">*</span>
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g., Alex"
                  className="mt-1 w-full rounded border-2 border-black bg-[#fff1b3] p-3 text-base font-bold text-black placeholder:text-black/60 outline-none focus:ring-2 focus:ring-[#f5c042]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-[#111]">
                  Super hero accessories (optional)
                </label>
                <input
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  placeholder="e.g., shield, utility belt, cosmic gauntlet"
                  className="mt-1 w-full rounded border-2 border-black bg-[#cfe2ff] p-3 text-base font-bold text-black placeholder:text-black/60 outline-none focus:ring-2 focus:ring-[#6da7ff]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border-4 border-black bg-[#f5c042] px-5 py-3 text-base font-extrabold text-black shadow-[4px_4px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0_0_#000] disabled:opacity-60"
              >
                {loading && (
                  <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                )}
                {loading ? "Generating…" : "Generate Comic Cover"}
              </button>

              {error && (
                <p className="text-sm font-bold text-[#c0312b]">{error}</p>
              )}
            </div>
          </ComicCard>
        </form>

        {resultUrl && (
          <ComicCard>
            <div className="flex flex-col gap-3">
              {/* LARGER, non-cropping generated image */}
              <div className="relative w-full h-[85vh] sm:h-[90vh] md:h-[92vh] overflow-hidden rounded-lg border-2 border-black bg-[#e6ddc6]">
                <Image
                  src={resultUrl}
                  alt="Generated Comic Cover"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>

              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center justify-center rounded-lg border-4 border-black bg-[#fff1b3] px-5 py-3 text-base font-black text-black shadow-[4px_4px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0_0_#000]"
              >
                Open Full Image
              </a>
            </div>
          </ComicCard>
        )}
      </div>
    </main>
  );
}
