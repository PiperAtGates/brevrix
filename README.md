# ⚡ Brivrix – Elite Freelance Engineering & Digital Solutions

A modern, high-converting portfolio and freelancing services website built with **Astro**, **Tailwind CSS**, and **Lucide**. Engineered specifically for rapid sub-second edge deployment to **Cloudflare Pages** or **Netlify**.

---

## 🌟 Key Features

- **Blazing Fast Astro Architecture**: Zero unnecessary JavaScript by default, achieving **100/100 Google Lighthouse** speed and Core Web Vitals.
- **Comprehensive Freelance Services Suite**:
  1. Full-Stack Web & SaaS Engineering (Astro, Next.js, TypeScript, PostgreSQL)
  2. UI/UX & Interactive Design Systems (Figma, Tokens, Prototypes)
  3. Cloud Edge, DevOps & Hosting (Cloudflare Pages, Netlify, Docker, CI/CD)
  4. AI Integrations & Intelligent Automations (LLMs, LangChain, n8n)
  5. Speed Optimization & Technical SEO (Sub-second TTFB, Schema markup)
  6. Mobile Apps & Cross-Platform PWAs (React Native, Expo)
- **Interactive Project Estimator**: Real-time interactive cost & delivery timeline calculator allowing prospective clients to scope projects and request customized proposals instantly.
- **Production Portfolio & Case Studies**: Categorized showcase of client projects with verified performance metrics and tech stacks.
- **Predictable Pricing Packages**: Transparent Sprint, MVP Launchpad, and Monthly Retainer tiers with comparison matrices.
- **Conversion-Optimized Contact Flow**: Interactive project brief builder with direct booking links, budget pickers, and SLA response guarantees.
- **Edge Deployment Ready**: Pre-configured for seamless 1-click deployments on both **Cloudflare Pages** and **Netlify**.

---

## 🛠️ Project Structure

```text
Brivrix/
├── public/
│   ├── favicon.svg          # Custom neon gradient Brivrix brand icon
│   ├── _headers             # Global edge security and caching headers
│   └── _redirects           # Static SPA & routing redirect definitions
├── src/
│   ├── components/
│   │   ├── Navbar.astro             # Sticky glass navbar with active states & mobile drawer
│   │   ├── Footer.astro             # Comprehensive directory footer with live uptime badge
│   │   ├── Hero.astro               # High-impact hero with live availability pill & metrics
│   │   ├── TechMarquee.astro        # Continuous infinite-loop modern technology banner
│   │   ├── ServiceCard.astro        # Interactive service cards with deliverables checklist
│   │   ├── ProjectCard.astro        # Case study cards with mockups & metric badges
│   │   ├── ProjectEstimator.astro   # Dynamic client-side price & timeline calculator
│   │   ├── ProcessWorkflow.astro    # 4-step discovery-to-launch roadmap
│   │   ├── TestimonialsSection.astro# Verified founder & client reviews
│   │   ├── PricingSection.astro     # Transparent package tiers
│   │   ├── FaqAccordion.astro       # Interactive collapsible FAQ
│   │   ├── ContactForm.astro        # Multi-step project brief submission
│   │   └── CtaBanner.astro          # High-converting bottom banner
│   ├── data/
│   │   ├── services.ts      # Catalog of freelancing services & deliverables
│   │   ├── projects.ts      # Portfolio case studies & performance metrics
│   │   ├── pricing.ts       # Service tiers and feature comparisons
│   │   ├── testimonials.ts  # Verified client feedback
│   │   └── faq.ts           # Frequently asked questions
│   ├── layouts/
│   │   └── Layout.astro     # SEO metadata, OpenGraph, JSON-LD Schema, & styles
│   ├── pages/
│   │   ├── index.astro      # Flagship homepage
│   │   ├── services.astro   # Deep-dive freelance service directory
│   │   ├── work.astro       # Filterable portfolio & case studies
│   │   ├── about.astro      # Developer background & engineering philosophy
│   │   ├── pricing.astro    # Transparent pricing & project estimator
│   │   └── contact.astro    # Interactive brief builder & booking hub
│   └── styles/
│       └── global.css       # Tailwind CSS v4, glassmorphism, & dark mode styling
├── astro.config.mjs         # Astro configuration with Vite Tailwind plugin
├── netlify.toml             # 1-click deployment configuration for Netlify
├── package.json
└── tsconfig.json
```

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser at
# http://localhost:4321
```

---

## ☁️ Deployment Instructions

### Option 1: Deploy to Cloudflare Pages (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Set the following build settings:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `22` (or set environment variable `NODE_VERSION = 22`)
5. Click **Save and Deploy**. Your site will be globally deployed across 300+ edge data centers with free SSL!

Alternatively, deploy directly from your terminal using Wrangler:
```bash
npm run build
npx wrangler pages deploy dist
```

---

### Option 2: Deploy to Netlify

This project already includes a pre-configured [`netlify.toml`](./netlify.toml) file.

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Netlify](https://app.netlify.com/) and click **Add new site** > **Import an existing project**.
3. Select your repository. Netlify will automatically detect:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy Site**.

Alternatively, deploy using the Netlify CLI:
```bash
npm run build
npx netlify deploy --prod --dir=dist
```

---

## ✏️ Customization Guide

- **Change Brand / Contact Info**: Edit `src/components/Navbar.astro`, `src/components/Footer.astro`, and `src/pages/contact.astro`.
- **Add / Edit Services**: Modify `src/data/services.ts`.
- **Add / Edit Projects**: Modify `src/data/projects.ts`.
- **Adjust Pricing & Turnarounds**: Modify `src/data/pricing.ts` and `src/components/ProjectEstimator.astro`.
- **SEO & Social Sharing**: Update default title and description in `src/layouts/Layout.astro`.
