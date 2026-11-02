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
    answer: "Astro ships zero JavaScript by default, resulting in near-instant page load times (100/100 Google Lighthouse scores), lower bounce rates, and better search rankings. It allows dynamic interactive islands only where you need them, making your site blazing fast, easier to maintain, and extremely cost-effective to host.",
    category: "Tech & Code"
  },
  {
    id: "faq-2",
    question: "How does hosting on Cloudflare Pages work, and what does it cost?",
    answer: "Cloudflare Pages is an elite global edge network with a generous free tier that handles hundreds of thousands of monthly visitors for $0 in hosting fees! We configure the global CDN edge caching, custom domain, automatic SSL certificates, and automated Git deployment so every time you push code or content to GitHub, your live site updates worldwide in seconds.",
    category: "Hosting"
  },
  {
    id: "faq-3",
    question: "Who owns the code and design files after the project is complete?",
    answer: "You do—100%. Upon final milestone completion, full intellectual property (IP), GitHub repositories, Figma source files, environment keys, and deployment accounts are transferred completely to you. No vendor lock-in, no hidden licensing fees.",
    category: "Process"
  },
  {
    id: "faq-4",
    question: "What is your typical project timeline and communication cadence?",
    answer: "Smaller sprints and landing pages are typically delivered within 3 to 7 business days, while full-scale MVPs take 2 to 3 weeks. You receive access to a private Slack or Discord channel for direct daily updates, weekly loom video walkthroughs, and a live staging preview URL where you can test progress in real-time.",
    category: "Process"
  },
  {
    id: "faq-5",
    question: "Do you offer post-launch support and maintenance?",
    answer: "Yes! Every custom project includes a 30-day post-launch warranty where any unexpected bugs or styling adjustments are resolved immediately at zero additional charge. For ongoing maintenance and new features, monthly retainer options are available.",
    category: "Pricing"
  },
  {
    id: "faq-6",
    question: "Can I customize the packages or request a custom scope?",
    answer: "Absolutely. Many projects have unique technical requirements such as custom AI pipelines, legacy database migrations, or specialized payment flows. Use the Interactive Project Estimator on this site or submit an inquiry to receive a tailored, transparent proposal.",
    category: "Pricing"
  }
];

