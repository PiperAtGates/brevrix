export interface ProjectItem {
  id: string;
  title: string;
  category: "Web & SaaS" | "UI/UX Design" | "AI & Automation" | "DevOps & Cloud";
  projectTypeBadge: "Live Production" | "Architecture Blueprint" | "Internal Lab Build" | "Security Blueprint";
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
    id: "brevrix-platform",
    title: "Brevrix.com — High-Performance Edge Web Platform",
    category: "Web & SaaS",
    projectTypeBadge: "Live Production",
    tagline: "Ultra-fast Astro v5, Tailwind CSS v4, and Cloudflare Pages edge delivery.",
    description: "Architected and engineered the official Brevrix production web system. Built with static site generation, sub-50ms edge caching across 300+ global Cloudflare PoPs, and 100/100 Core Web Vitals.",
    metric: "100/100",
    metricLabel: "Verified Lighthouse Core Web Vitals",
    tech: ["Astro", "Tailwind CSS", "TypeScript", "Cloudflare Pages", "Edge Caching"],
    imageGradient: "from-blue-600 via-indigo-600 to-violet-800",
    demoUrl: "https://brevrix.com",
    githubUrl: "https://github.com/PiperAtGates/brevrix",
    features: [
      "100/100 Google PageSpeed mobile & desktop score",
      "Sub-50ms Time To First Byte (TTFB) worldwide",
      "Zero client-side JavaScript bloat on static routes",
      "Automated CI/CD deployment on every Git push"
    ]
  },
  {
    id: "argocd-gitops-lab",
    title: "Kubernetes GitOps with ArgoCD & Automated Security",
    category: "DevOps & Cloud",
    projectTypeBadge: "Architecture Blueprint",
    tagline: "Declarative multi-cluster deployment pipeline with automated drift healing.",
    description: "Engineered a production-ready GitOps pipeline using ArgoCD on Kubernetes. Features automated vulnerability scanning with Trivy in CI, declarative sync policies, and blue/green zero-downtime rollouts.",
    metric: "0 Downtime",
    metricLabel: "Automated blue/green deployment rollouts",
    tech: ["Kubernetes", "ArgoCD", "Docker", "Trivy", "GitLab CI", "Prometheus"],
    imageGradient: "from-amber-500 via-orange-600 to-red-700",
    githubUrl: "https://github.com/PiperAtGates/brevrix",
    features: [
      "Declarative Application CRDs with automated sync",
      "Container vulnerability scanning with Trivy in CI pipeline",
      "Drift detection and self-healing cluster state",
      "Prometheus & Grafana alerting for pod health"
    ]
  },
  {
    id: "postgres-ha-ops",
    title: "PostgreSQL High Availability & pgBackRest Disaster Recovery",
    category: "DevOps & Cloud",
    projectTypeBadge: "Architecture Blueprint",
    tagline: "Automated point-in-time recovery and streaming replication for mission-critical databases.",
    description: "Designed a resilient database disaster recovery architecture. Implemented pgBackRest for automated differential backups to S3-compatible storage, WAL archiving, and automated failover verification.",
    metric: "< 15 min",
    metricLabel: "RTO disaster recovery target",
    tech: ["PostgreSQL", "pgBackRest", "Linux", "Bash", "Redis", "Grafana"],
    imageGradient: "from-emerald-600 via-teal-600 to-cyan-800",
    features: [
      "Automated daily differential and weekly full backups",
      "Continuous WAL archiving with Point-In-Time-Recovery (PITR)",
      "Automated backup integrity testing scripts",
      "Redis memory caching layer with optimized eviction policies"
    ]
  },
  {
    id: "ai-n8n-automation",
    title: "Autonomous Event & Webhook AI Automation Pipeline",
    category: "AI & Automation",
    projectTypeBadge: "Internal Lab Build",
    tagline: "Self-hosted n8n workflow cluster integrating webhooks, CRM sync, and LLM extraction.",
    description: "Built a self-hosted event-driven automation cluster on Docker. Ingests customer leads via webhooks, executes structured data extraction with OpenAI API, and synchronizes data into PostgreSQL and Discord/Slack.",
    metric: "100% Async",
    metricLabel: "Hands-off lead triage & structured parsing",
    tech: ["n8n", "Docker", "Python", "OpenAI API", "PostgreSQL", "Webhooks"],
    imageGradient: "from-purple-600 via-pink-600 to-rose-700",
    features: [
      "Self-hosted Dockerized n8n workflow engine with SSL",
      "Structured LLM parsing and schema validation",
      "Automated webhook verification with HMAC signatures",
      "Instant multi-channel alerts with retry queues"
    ]
  },
  {
    id: "linux-vps-hardening",
    title: "Production Linux Server Hardening & Security Baseline",
    category: "DevOps & Cloud",
    projectTypeBadge: "Security Blueprint",
    tagline: "Zero-trust hardening baseline for Debian/Ubuntu VPS environments.",
    description: "Created a reproducible server hardening blueprint implementing CIS benchmark recommendations: SSH ed25519 key-only authentication, UFW restrictive rules, Fail2ban intrusion prevention, and automatic security patching.",
    metric: "0 Open Flaws",
    metricLabel: "CIS-aligned baseline security standard",
    tech: ["Ubuntu", "UFW", "Fail2ban", "WireGuard", "Nginx", "Systemd"],
    imageGradient: "from-slate-700 via-zinc-800 to-slate-900",
    features: [
      "Automated unattended security upgrades with zero service downtime",
      "Strict UFW firewall and brute-force protection with Fail2ban",
      "Encrypted WireGuard VPN for private server administration",
      "Nginx reverse proxy with SSL A+ rating and security headers"
    ]
  },
  {
    id: "headless-wp-astro",
    title: "Ultra-Fast Headless WordPress & Astro Architecture",
    category: "Web & SaaS",
    projectTypeBadge: "Architecture Blueprint",
    tagline: "Decoupled WordPress CMS with static Astro edge rendering for sub-100ms speeds.",
    description: "Eliminated slow database queries and vulnerability-prone PHP frontends by decoupling WordPress via REST API and pre-rendering the presentation layer into static Astro pages cached on Cloudflare Pages.",
    metric: "Sub-100ms",
    metricLabel: "Global edge delivery via Cloudflare",
    tech: ["WordPress REST API", "Astro", "Tailwind CSS", "Cloudflare Cache Rules"],
    imageGradient: "from-cyan-600 via-blue-600 to-indigo-800",
    features: [
      "Decoupled architecture: WordPress CMS protected behind VPN",
      "Static generation eliminating SQL injection risk on the frontend",
      "Instant global edge invalidation on post publish",
      "Mobile Lighthouse score boosted from 38 to 98"
    ]
  }
];
