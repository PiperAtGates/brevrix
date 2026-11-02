# ⚡ Brevrix – Full-Stack Web, Enterprise DevOps & Digital Growth Studio

A modern, high-converting portfolio, engineering showcase, and technical blog built with **Astro**, **Tailwind CSS**, and **Lucide**. Dedicated and optimized for global sub-second edge deployment to **Cloudflare Pages**.

Official Domain: **[https://brevrix.com](https://brevrix.com)**

---

## 🌟 Key Features

- **Blazing Fast Astro Architecture**: Zero unnecessary JavaScript by default, achieving **100/100 Google Lighthouse** speed and Core Web Vitals.
- **Enterprise Engineering & Growth Suite**:
  1. **Enterprise DevOps & Kubernetes**: Linux administration, Docker, Helm, ArgoCD GitOps, Jenkins, and Trivy security scanning.
  2. **Modern Web & WordPress Development**: Ultra-fast Astro static platforms, custom WordPress CMS builds, and headless architectures.
  3. **Database Operations & Streaming Systems**: PostgreSQL, MySQL, Redis, ClickHouse, and message queuing (Kafka, RabbitMQ).
  4. **AI & Computer Vision Automations**: Python, YOLOv5/v8, OpenCV, and n8n workflow pipelines.
  5. **Digital Marketing & Technical SEO (GEO)**: Structured JSON-LD entity graph, Google Search Console optimization, and AI Answer Engine optimization (`/llms.txt`).
  6. **Virtual Project Coordination & Financial Documentation**: Accounting-backed bookkeeping, spreadsheet models, and executive status reporting.
- **AI Search Optimization (GEO/AEO)**: Fully configured with `/llms.txt` and `/robots.txt` granting access to GPTBot, PerplexityBot, and ClaudeBot.
- **Built-in Decap CMS**: Visual content management dashboard at `/admin/` for writing technical articles and guides.
- **Rich E-E-A-T Entity Graph**: Verified founder credentials and knowledge graph schema for Google and AI assistants.
- **Predictable Pricing & Estimator**: Interactive client-side cost and delivery timeline calculator.

---

## 🛠️ Project Structure

```text
Brevrix/
├── public/
│   ├── admin/
│   │   ├── config.yml       # Decap CMS GitHub repo configuration
│   │   └── index.html       # Visual admin dashboard
│   ├── favicon.svg          # Neon gradient Brevrix brand icon
│   ├── llms.txt             # AI Search Optimization definition
│   ├── robots.txt           # Search and AI crawler directives
│   ├── _headers             # Cloudflare Pages edge security and caching headers
│   └── _redirects           # Cloudflare Pages static & SPA routing rules
├── src/
│   ├── components/          # Reusable Astro UI components
│   ├── content/
│   │   └── blog/            # Markdown articles & technical guides
│   ├── content.config.ts    # Astro v7 Content Collections schema
│   ├── data/                # Structured data for services, projects, FAQs, pricing
│   ├── layouts/
│   │   └── Layout.astro     # Core layout with E-E-A-T Schema & SEO tags
│   ├── pages/               # File-based routing (Home, Services, Work, Blog, About, Pricing, Contact)
│   └── styles/
│       └── global.css       # Tailwind CSS v4 and glassmorphism design system
├── astro.config.mjs         # Astro configuration with Sitemap and Vite Tailwind plugin
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

# 3. Open in browser:
# http://localhost:4321
```

To run Decap CMS locally without passwords:
```bash
npx decap-server
```

---

## ☁️ Deployment on Cloudflare Pages

This repository is pre-configured for seamless Git integration with **Cloudflare Pages**:

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository: **`PiperAtGates/brevrix`**.
4. Configure the build settings:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**:
     - `NODE_VERSION` = `22`
5. Click **Save and Deploy**. 

Your site will automatically build and distribute across 300+ global edge locations with free automatic SSL certificates.
