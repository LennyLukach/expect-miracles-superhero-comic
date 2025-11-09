"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/** Brand colors */
const DEEP_BLUE = "#003087";
const PURPLE = "#7b2c85";
const WHITE = "#ffffff";

/** Keep this OUTSIDE so inputs don’t remount and lose focus */
function ComicCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border-2 p-4"
      style={{
        backgroundColor: WHITE,
        borderColor: DEEP_BLUE,
        boxShadow: `6px 6px 0 0 ${DEEP_BLUE}`,
      }}
    >
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handlePickedFile(e: React.ChangeEvent<HTMLInputElement>) {
    setResultUrl(null);
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function generateOnce(formData: FormData) {
    const resp = await fetch("/api/generate", { method: "POST", body: formData });
    const json = (await resp.json()) as GenResponse;
    if (!resp.ok || !json.imageUrl) {
      throw new Error(json.error || "Image generation failed.");
    }
    return json.imageUrl!;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultUrl(null);

    if (!file) {
      setError("Please upload or take a clear selfie first.");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }

    const fd = new FormData();
    fd.append("photo", file);
    fd.append("firstName", firstName.trim());
    fd.append("accessories", accessories.trim());

    setLoading(true);
    try {
      const url = await generateOnce(fd);
      setResultUrl(url);
    } catch {
      try {
        await new Promise((r) => setTimeout(r, 900));
        const url = await generateOnce(fd);
        setResultUrl(url);
      } catch (err2) {
        const msg =
          err2 instanceof Error ? err2.message : typeof err2 === "string" ? err2 : "Unexpected error";
        setError(
          typeof msg === "string" && msg.trim().length > 0
            ? `${msg} — please try another photo.`
            : "We hit an error twice — please try another photo."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const withVars = (obj: Record<string, string | number>) =>
    obj as React.CSSProperties;

  return (
    <main
      className="min-h-dvh p-4 md:p-6 relative overflow-hidden"
      style={withVars({
        background: `
          radial-gradient(42% 28% at 78% 18%, ${PURPLE}22, transparent 60%),
          radial-gradient(36% 24% at 22% 70%, ${PURPLE}1c, transparent 65%),
          linear-gradient(180deg, ${DEEP_BLUE} 0%, #043897 35%, ${DEEP_BLUE} 100%)
        `,
      })}
    >
      {/* Subtle paper micro-lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={withVars({
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 2px, transparent 4px)",
        })}
      />
      {/* Gentle vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={withVars({
          background:
            "radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.25) 100%)",
        })}
      />

      {/* Loading overlay */}
      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${WHITE}80`, borderTopColor: "transparent" }}
            />
            <p className="font-bold tracking-wide" style={{ color: WHITE }}>
              Generating your cover… this can take about a minute
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        {/* Logo header */}
        <header className="pt-2">
          <div className="mx-auto w-full max-w-[760px]">
            <div className="relative mx-auto flex items-center justify-center">
              <div
                aria-hidden
                className="absolute -inset-x-6 -inset-y-3 rounded-3xl blur-[22px]"
                style={{ background: `${PURPLE}40` }}
              />
              <div
                className="relative rounded-3xl border-[6px] px-4 py-2"
                style={{
                  backgroundColor: WHITE,
                  borderColor: DEEP_BLUE,
                  boxShadow: `8px 10px 0 0 ${DEEP_BLUE}99`,
                }}
              >
                <div className="relative h-14 w-[260px] sm:h-16 sm:w-[320px] md:h-[72px] md:w-[380px]">
                  <Image
                    src="/expect-miracles-logo.png"
                    alt="Expect Miracles Foundation — Financial Services Against Cancer"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <h1
              className="text-4xl font-extrabold leading-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]"
              style={{ color: WHITE }}
            >
              Expect Miracles
            </h1>
            <h2
              className="text-2xl font-black drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]"
              style={{ color: PURPLE }}
            >
              Superhero Maker
            </h2>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={onSubmit} className="grid gap-5">
          {/* Step 1 — Selfie */}
          <ComicCard>
            <div className="flex flex-col gap-3">
              <label
                className="font-extrabold text-base tracking-wide"
                style={{ color: DEEP_BLUE }}
              >
                Step 1 — Selfie
              </label>

              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickedFile}
                className="hidden"
              />

              {/* Unified upload button styled like input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded border-2 p-3 text-center text-base font-bold transition-all active:translate-x-[1px] active:translate-y-[1px]"
                style={{
                  backgroundColor: WHITE,
                  borderColor: DEEP_BLUE,
                  color: "#000",
                }}
              >
                {file ? "Change Photo" : "Upload Selfie"}
              </div>

              {file && (
                <p className="text-xs font-bold" style={{ color: "#222" }}>
                  Selected: <span className="underline">{file.name}</span>
                </p>
              )}

              {preview ? (
                <div
                  className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] overflow-hidden rounded-xl border-2"
                  style={{ backgroundColor: WHITE, borderColor: DEEP_BLUE }}
                >
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                </div>
              ) : (
                <p className="text-xs font-semibold" style={{ color: "#333" }}>
                  Tip: clear, front-facing photos work best.
                </p>
              )}
            </div>
          </ComicCard>

          {/* Step 2+3 — Text inputs */}
          <ComicCard>
            <div className="flex flex-col gap-4">
              <div>
                <label
                  className="block text-sm font-extrabold"
                  style={{ color: DEEP_BLUE }}
                >
                  Step 2 — First name <span style={{ color: PURPLE }}>*</span>
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded border-2 p-3 text-base font-bold placeholder:text-black/60 outline-none focus:ring-2"
                  style={{
                    backgroundColor: WHITE,
                    borderColor: DEEP_BLUE,
                    color: "#000",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-extrabold"
                  style={{ color: DEEP_BLUE }}
                >
                  Step 3 — Accessories (optional)
                </label>
                <input
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  className="mt-1 w-full rounded border-2 p-3 text-base font-bold placeholder:text-black/60 outline-none focus:ring-2"
                  style={{
                    backgroundColor: WHITE,
                    borderColor: DEEP_BLUE,
                    color: "#000",
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border-4 px-5 py-3 text-base font-extrabold active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-60"
                style={{
                  backgroundColor: PURPLE,
                  color: WHITE,
                  borderColor: DEEP_BLUE,
                  boxShadow: `4px 4px 0 0 ${DEEP_BLUE}`,
                }}
              >
                {loading && (
                  <span
                    className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: WHITE, borderTopColor: "transparent" }}
                  />
                )}
                {loading ? "Generating…" : "Generate Comic-Book Cover"}
              </button>

              {error && (
                <p className="text-sm font-bold" style={{ color: PURPLE }}>
                  {error}
                </p>
              )}
            </div>
          </ComicCard>
        </form>

        {/* Result */}
        {resultUrl && (
          <ComicCard>
            <div className="flex flex-col gap-3">
              <div
                className="relative w-full h-[85vh] sm:h-[90vh] md:h-[92vh] overflow-hidden rounded-xl border-2"
                style={{ backgroundColor: WHITE, borderColor: DEEP_BLUE }}
              >
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
                className="mt-1 inline-flex items-center justify-center rounded-lg border-4 px-5 py-3 text-base font-black"
                style={{
                  backgroundColor: WHITE,
                  color: DEEP_BLUE,
                  borderColor: DEEP_BLUE,
                  boxShadow: `4px 4px 0 0 ${DEEP_BLUE}`,
                }}
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
