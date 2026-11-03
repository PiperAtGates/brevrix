export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "Pricing" | "Process" | "Tech & Code" | "Hosting";
}

export const faqsData: FaqItem[] = [
  {
    id: "faq-1",
    question: "Why build with Astro instead of a traditional WordPress or bloated Next.js setup?",
    answer: "Astro ships zero JavaScript to the browser by default, resulting in near-instant page load times (100/100 Google Lighthouse scores), lower bounce rates, and better search rankings. It allows dynamic interactive islands only where you need them, making your site blazing fast, easier to maintain, and extremely cost-effective to host.",
    category: "Tech & Code"
  },
  {
    id: "faq-2",
    question: "How does hosting on Cloudflare Pages work, and what does it cost?",
    answer: "Cloudflare Pages is a global edge network with a generous free tier that handles hundreds of thousands of monthly visitors for $0 in hosting fees! We configure global CDN edge caching, custom domain routing, automated TLS 1.3 certificates, and automated Git deployment so every time you push code or content to GitHub, your live site updates worldwide in seconds.",
    category: "Hosting"
  },
  {
    id: "faq-3",
    question: "Who owns the code and design files after the project is complete?",
    answer: "You do—100%. Upon final milestone completion, full intellectual property (IP), GitHub repositories, Dockerfiles, Kubernetes manifests, environment keys, and deployment accounts are transferred completely to you. No vendor lock-in, no hidden licensing fees.",
    category: "Process"
  },
  {
    id: "faq-4",
    question: "How do payments work and what payment methods do you accept?",
    answer: "We accept payments via Payoneer, Wise, and direct international bank wire transfer. For fixed-price sprints, payments are structured into clear milestones: 50% upon kickoff and 50% upon final verification and code handover. For the $249 Server & Speed Audit, payment is completed upfront, and the full $249 fee is credited toward any development build booked within 14 days.",
    category: "Pricing"
  },
  {
    id: "faq-5",
    question: "What is your typical project timeline and communication cadence?",
    answer: "The $249 Server & Speed Audit is delivered within 72 hours. Smaller web sprints take 5 to 7 business days, while Kubernetes infrastructure and full deployments take 2 to 3 weeks. You receive access to a private Slack or Discord channel with Sadia for direct updates, plus a live staging preview URL to test progress in real-time.",
    category: "Process"
  },
  {
    id: "faq-6",
    question: "Do you offer post-launch support and warranty?",
    answer: "Yes! Every custom build includes a 30-day post-launch warranty where any unexpected bugs, regressions, or configuration issues within scope are resolved immediately at zero additional charge. For ongoing infrastructure maintenance, our monthly retainer plan provides continuous dedicated capacity.",
    category: "Pricing"
  },
  {
    id: "faq-7",
    question: "Can I customize the packages or request a custom scope?",
    answer: "Absolutely. Many systems require tailored architecture—such as hybrid Kubernetes clusters, high-availability database replication, or custom event webhooks. Use our Interactive Project Estimator or reach out directly at hello@brevrix.com to receive a transparent, fixed-price proposal.",
    category: "Pricing"
  }
];
