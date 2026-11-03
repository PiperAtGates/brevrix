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
    id: "audit",
    name: "Server & Speed Audit",
    tagline: "Low-risk, comprehensive diagnostic of your infrastructure or website speed.",
    price: "$249",
    period: "fixed price • 72 hrs",
    badge: "Fastest Entry",
    popular: false,
    description: "Deep audit of your Linux/Kubernetes servers or WordPress/Astro speed. Includes written report, loom video, and 100% fee credit toward any build booked within 14 days.",
    features: [
      "Guaranteed 72-hour turnaround",
      "Core Web Vitals & TTFB bottleneck analysis",
      "Linux server & SSH security posture review",
      "Database slow query & caching inspection",
      "Actionable remediation blueprint (PDF)",
      "15-min recorded Loom walkthrough of findings",
      "100% fee credited toward any development project"
    ],
    notIncluded: [
      "Direct code refactoring during audit (quoted separately)"
    ],
    deliveryEstimate: "72 hours",
    ctaText: "Book Audit ($249)",
    ctaLink: "/contact?tier=audit"
  },
  {
    id: "sprint",
    name: "High-Speed Web Sprint",
    tagline: "Ideal for fast Astro sites, speed overhauls, or landing platforms.",
    price: "$1,450",
    period: "per project",
    popular: false,
    description: "Rapid engineering of ultra-fast static websites, Cloudflare edge caching, and 100/100 Core Web Vitals remediation.",
    features: [
      "Custom Astro web platform (Desktop + Mobile)",
      "100/100 Google PageSpeed optimization",
      "Cloudflare Pages edge deployment & SSL",
      "Web3Forms / Lead capture integration",
      "Direct Slack / Discord communication",
      "100% code & Git repository handover",
      "30-day post-launch bug warranty"
    ],
    notIncluded: [
      "Complex multi-tenant backend portals"
    ],
    deliveryEstimate: "5 - 7 business days",
    ctaText: "Start Web Sprint",
    ctaLink: "/contact?tier=sprint"
  },
  {
    id: "mvp",
    name: "Kubernetes & Cloud DevOps Sprint",
    tagline: "Production-ready cluster setup, GitOps pipelines, and security.",
    price: "$2,850",
    period: "per project",
    badge: "Most Requested",
    popular: true,
    description: "End-to-end cloud infrastructure engineering: multi-node Kubernetes clusters, ArgoCD GitOps, Trivy security, and database backup automation.",
    features: [
      "Production Kubernetes (k8s/k3s) cluster setup",
      "ArgoCD declarative GitOps with auto-sync",
      "GitLab CI / GitHub Actions CI/CD pipelines",
      "Trivy container security vulnerability scanner",
      "PostgreSQL disaster recovery & pgBackRest backups",
      "Prometheus & Grafana monitoring dashboards",
      "30-day post-launch operational warranty",
      "Comprehensive infrastructure documentation"
    ],
    deliveryEstimate: "2 - 3 weeks",
    ctaText: "Build Cloud Stack",
    ctaLink: "/contact?tier=mvp"
  },
  {
    id: "retainer",
    name: "Dedicated Engineering Partner",
    tagline: "Ongoing dedicated DevOps & web capacity on monthly retainer.",
    price: "$3,800",
    period: "per month",
    popular: false,
    description: "Your on-demand senior systems engineer for continuous infrastructure updates, performance tuning, and emergency incident response.",
    features: [
      "Dedicated 20-25 engineering hours per week",
      "Direct private Slack/Discord channel with Sadia",
      "Continuous Kubernetes & server updates",
      "Proactive 24/7 uptime monitoring & alerting",
      "AI & n8n automation workflow builds",
      "Pause or cancel anytime with 14 days notice",
      "Priority SLA: response within 2 hours"
    ],
    deliveryEstimate: "Continuous bi-weekly sprints",
    ctaText: "Book Retainer Call",
    ctaLink: "https://cal.com/brevrix"
  }
];
