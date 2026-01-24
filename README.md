# Expect Miracles – Superhero Comic App

This project is a full‑stack web app built for a live fundraising event supporting *Expect Miracles*, a cancer charity. The idea was simple: let people take a selfie, add a few details, and get back a comic‑book‑style superhero version of themselves.

The app was designed for real people in a real event setting—non‑technical users, phones in hand, lots of traffic, and no patience for confusing UI. Everything about it is geared toward being fast, clear, and fun while still being reliable and safe in a public environment.

---

## What It Does

* Lets users upload a selfie
* Collects a few optional details (name, accessories)
* Generates a personalized superhero image
* Returns a comic‑style portrait in seconds
* Works smoothly on mobile and desktop
* Stores and serves images from the cloud

---

## Tech Stack

**Frontend**

* Next.js
* React
* Tailwind CSS

**Backend / Infrastructure**

* Next.js API routes
* Cloudinary for image storage
* Environment‑based configuration

**AI**

* OpenAI image generation
* Custom prompt design for consistent comic style

---

## How It Works

1. A user uploads a photo and fills out the form.
2. The app sends that data to a serverless API route.
3. The server:

   * Validates the input
   * Builds a prompt based on the user’s details
   * Sends the image + prompt to the OpenAI image API
4. The generated image is uploaded to Cloudinary.
5. The final image is sent back and shown to the user.

The flow is built to handle real‑world issues—slow responses, failed requests, and users who don’t read instructions—without breaking the experience.

---

## Running It Locally

### Requirements

* Node.js 18+
* An OpenAI API key
* A Cloudinary account

### Install

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

`.env.local` is ignored by git. Do not commit secrets.

### Start the App

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Deployment

The app is set up to deploy cleanly on platforms like Vercel:

1. Push the repo to GitHub
2. Connect it to Vercel
3. Add the same environment variables in the dashboard
4. Deploy

---

## Privacy & Safety

* No API keys or secrets are stored in the repo
* User images are processed only to generate the result
* No personal data is stored beyond what’s needed
* Prompts are written to keep results appropriate for a public event

---

## Why This Exists

This was built for a real fundraising event for *Expect Miracles*. The goal wasn’t just to show off AI—it was to give people something memorable and fun while supporting a good cause.

It’s also a portfolio project that reflects real product constraints: live users, performance limits, unclear requirements, and the need for something that just works.

---

Built to support Expect Miracles and to show what practical, user‑focused AI apps can look like.
