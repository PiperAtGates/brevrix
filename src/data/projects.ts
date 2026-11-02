export interface ProjectItem {
  id: string;
  title: string;
  category: "Web & SaaS" | "UI/UX Design" | "AI & Automation" | "DevOps & Cloud";
  tagline: string;
  description: string;
  metric: string;
  metricLabel: string;
  tech: string[];
  imageGradient: string;
  demoUrl?: string;
  githubUrl?: string;
  features: string[];
}

export const projectsData: ProjectItem[] = [
  {
    id: "zenith-saas",
    title: "Zenith Flow – AI Ops Platform",
    category: "Web & SaaS",
    tagline: "Autonomous incident monitoring and developer workflow automation dashboard.",
    description: "Architected a responsive SaaS application handling real-time telemetry from multiple cloud clusters. Implemented live WebSocket streaming, dark mode glassmorphism UI, and role-based team management.",
    metric: "320ms",
    metricLabel: "Query response time down from 2.4s",
    tech: ["Astro", "React", "TypeScript", "Tailwind CSS", "Cloudflare Workers", "Supabase"],
    imageGradient: "from-blue-600 via-indigo-600 to-violet-800",
    features: [
      "Real-time event streaming with WebSockets",
      "Dynamic data visualization with SVG charts",
      "Stripe recurring billing & tier gating",
      "Multi-tenant role permissions"
    ]
  },
  {
    id: "pulse-fintech",
    title: "PulsePay – Global Treasury Portal",
    category: "UI/UX Design",
    tagline: "Ultra-sleek financial exchange interface designed for seamless cross-border liquidity.",
    description: "Designed a comprehensive 40-screen mobile and desktop design system in Figma. Conducted 18 user interviews to eliminate friction in multi-currency conversion flows.",
    metric: "+68%",
    metricLabel: "Checkout completion rate increase",
    tech: ["Figma", "Design Tokens", "Micro-Interactions", "User Journey Mapping", "Design System"],
    imageGradient: "from-emerald-600 via-teal-600 to-cyan-800",
    features: [
      "Atomic design token component library",
      "Interactive high-fidelity prototyping",
      "Zero-latency transaction preview modals",
      "WCAG 2.1 AA accessibility compliance"
    ]
  },
  {
    id: "cortex-ai",
    title: "Cortex Copilot – Internal Enterprise AI",
    category: "AI & Automation",
    tagline: "Context-aware enterprise documentation search and automated compliance auditor.",
    description: "Built an intelligent RAG (Retrieval-Augmented Generation) pipeline connecting Slack, Notion, and Jira. Reduced customer support escalation turnaround by 75%.",
    metric: "14 hrs",
    metricLabel: "Saved per engineer each week",
    tech: ["Python", "OpenAI API", "Vector Embeddings", "LangChain", "n8n", "Docker"],
    imageGradient: "from-purple-600 via-pink-600 to-rose-700",
    features: [
      "Semantic similarity search over 50,000+ internal documents",
      "Automated weekly status reports generated to Slack",
      "Enterprise encryption and prompt sanitization",
      "Hallucination mitigation validation guards"
    ]
  },
  {
    id: "hypercloud-infra",
    title: "Veloce Media – Edge CDN & Infrastructure",
    category: "DevOps & Cloud",
    tagline: "Zero-downtime global multi-region edge deployment for high-traffic media site.",
    description: "Migrated legacy monolith to a distributed edge network using Cloudflare Pages, Netlify Functions, and automated GitHub Actions CI/CD pipelines.",
    metric: "100/100",
    metricLabel: "Lighthouse mobile performance score",
    tech: ["Cloudflare Pages", "Netlify", "GitHub Actions", "Docker", "Wrangler", "Edge Caching"],
    imageGradient: "from-amber-500 via-orange-600 to-red-700",
    features: [
      "Global asset caching with sub-30ms TTFB worldwide",
      "Automated pull-request preview environments",
      "Zero-downtime blue/green deployment strategy",
      "Cloudflare Web Application Firewall (WAF) integration"
    ]
  },
  {
    id: "novak-commerce",
    title: "Novak Athletics – Headless E-Commerce",
    category: "Web & SaaS",
    tagline: "High-speed headless storefront with sub-second product filters and cart sync.",
    description: "Engineered an ultra-fast headless storefront using Astro, Tailwind, and Shopify Storefront API. Boosted mobile conversion rates by 42% in the first 30 days.",
    metric: "+42%",
    metricLabel: "Increase in organic mobile conversions",
    tech: ["Astro", "Tailwind CSS", "Shopify API", "TypeScript", "Netlify Edge"],
    imageGradient: "from-cyan-600 via-blue-600 to-indigo-800",
    features: [
      "Instant client-side predictive product search",
      "Optimized WebP image delivery and responsive sizing",
      "Cart persistence across multi-tab browsing sessions",
      "Automated sitemap & Schema.org product data"
    ]
  },
  {
    id: "lumina-mobile",
    title: "Lumina Habits – Daily Performance Tracker",
    category: "UI/UX Design",
    tagline: "Gamified behavioral neuroscience app designed for focused daily execution.",
    description: "Complete product design and interactive prototype for an award-winning iOS and Android productivity tracker with over 50,000 active beta users.",
    metric: "4.9 ★",
    metricLabel: "App store rating across 1,200+ reviews",
    tech: ["React Native", "Expo", "Figma", "Tailwind Mobile", "Local SQLite"],
    imageGradient: "from-fuchsia-600 via-purple-700 to-indigo-900",
    features: [
      "Offline-first habit streaks and cloud backup",
      "Custom haptic feedback and fluid animations",
      "Interactive data widget for iOS lockscreen",
      "Dark and OLED mode aesthetic"
    ]
  }
];

