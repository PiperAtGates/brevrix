export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  badge?: string;
  popular?: boolean;
  description: string;
  features: string[];
  notIncluded?: string[];
  deliveryEstimate: string;
  ctaText: string;
  ctaLink: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: "sprint",
    name: "Design & Speed Sprint",
    tagline: "Ideal for landing pages, quick audits, or UX overhauls.",
    price: "$1,450",
    period: "per project",
    popular: false,
    description: "Rapid delivery of high-converting landing pages, design systems, or technical speed remediation.",
    features: [
      "High-conversion Landing Page (Astro or Next.js)",
      "Pixel-perfect responsive design (Desktop + Mobile)",
      "Lighthouse 95+ score optimization",
      "Cloudflare Pages 1-click deployment",
      "Direct Slack / Discord communication channel",
      "3-5 days rapid turnaround"
    ],
    notIncluded: [
      "Complex backend database architecture",
      "Custom authentication & role portals"
    ],
    deliveryEstimate: "3 - 5 business days",
    ctaText: "Start Quick Sprint",
    ctaLink: "/contact?tier=sprint"
  },
  {
    id: "mvp",
    name: "Full MVP Launchpad",
    tagline: "The complete package to bring your software idea to market.",
    price: "$3,800",
    period: "per project",
    badge: "Most Popular",
    popular: true,
    description: "End-to-end full-stack product development from Figma wireframes to production deployment with auth and billing.",
    features: [
      "Complete Full-Stack Application (Frontend + Backend)",
      "Modern UI/UX Design System in Figma",
      "User Auth, Roles & Profile Management",
      "Stripe or LemonSqueezy payment integration",
      "Cloudflare Pages production edge infrastructure",
      "Automated CI/CD build pipelines & staging links",
      "30 days post-launch warranty & bug fixes",
      "Comprehensive video walkthrough and codebase docs"
    ],
    deliveryEstimate: "2 - 3 weeks",
    ctaText: "Build Your MVP",
    ctaLink: "/contact?tier=mvp"
  },
  {
    id: "retainer",
    name: "Dedicated Engineering Partner",
    tagline: "Ongoing dedicated freelance engineering, feature sprints, and support.",
    price: "$4,200",
    period: "per month",
    popular: false,
    description: "Your on-demand senior engineer and product designer for continuous feature iteration, optimization, and scaling.",
    features: [
      "Dedicated 20-25 engineering hours / week",
      "Direct private Slack channel & daily standup syncs",
      "Continuous feature rollouts & code reviews",
      "AI & LLM feature integrations and automation flows",
      "Proactive 24/7 uptime monitoring & security patching",
      "Pause or cancel anytime with 14 days notice",
      "Priority response within 2 hours"
    ],
    deliveryEstimate: "Continuous bi-weekly sprints",
    ctaText: "Book Retainer Call",
    ctaLink: "/contact?tier=retainer"
  }
];

