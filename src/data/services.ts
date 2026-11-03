export interface ServiceDeliverable {
  title: string;
  desc: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  badge: string;
  shortDesc: string;
  longDesc: string;
  iconName: string;
  techStack: string[];
  deliverables: ServiceDeliverable[];
  startingPrice: string;
  turnaroundTime: string;
  highlightStats: {
    label: string;
    value: string;
  };
}

export const servicesData: ServiceItem[] = [
  {
    id: "cloud-devops",
    slug: "kubernetes-devops",
    title: "Kubernetes & Cloud DevOps Engineering",
    badge: "Principal Practice",
    shortDesc: "Production-grade Linux administration, Kubernetes clusters, ArgoCD GitOps pipelines, and high-availability cloud architecture.",
    longDesc: "We design, deploy, and troubleshoot mission-critical infrastructure across Development, Staging, and Production environments. From Docker containerization and Kubernetes (k8s/k3s) orchestration to automated ArgoCD/GitLab CI pipelines and automated security scanning with Trivy.",
    iconName: "Cloud",
    techStack: ["Kubernetes (k8s/k3s)", "Docker", "Helm", "ArgoCD", "GitLab CI", "GitHub Actions", "Linux (Ubuntu/Debian)", "Kong", "Harbor", "Trivy"],
    deliverables: [
      { title: "Container & K8s Orchestration", desc: "Production-ready Docker & Kubernetes (k8s/k3s/Helm) cluster setup." },
      { title: "Automated CI/CD & GitOps", desc: "Zero-downtime pipelines with ArgoCD, GitLab CI, and Trivy security scanning." },
      { title: "API Gateway & Ingress Security", desc: "Ingress-NGINX, Kong API Gateway, and automated cert-manager TLS certificates." },
      { title: "Cluster Monitoring & Alerting", desc: "Prometheus, Grafana, and automated alerts for memory and pod health." }
    ],
    startingPrice: "$650",
    turnaroundTime: "3 - 10 Days",
    highlightStats: {
      label: "Production Uptime",
      value: "99.99%"
    }
  },
  {
    id: "web-dev",
    slug: "astro-web-development",
    title: "Ultra-Fast Astro & Headless Web Development",
    badge: "100/100 Speed",
    shortDesc: "Sub-second Astro static platforms, responsive modern web apps, and headless CMS architectures built for maximum conversion.",
    longDesc: "Jamstack and edge-rendered web platforms deployed across 300+ Cloudflare global PoPs. Zero client-side JavaScript bloat on static routes, instant navigation, and verified 100/100 Core Web Vitals.",
    iconName: "Code2",
    techStack: ["Astro", "Tailwind CSS", "TypeScript", "React", "Cloudflare Pages", "HTML5/CSS3"],
    deliverables: [
      { title: "Custom Web Platform Architecture", desc: "Clean TypeScript and Astro code achieving 100/100 Lighthouse score." },
      { title: "Cloudflare Edge Deployment", desc: "Global edge caching, TLS 1.3, and custom domain routing." },
      { title: "Headless CMS Integration", desc: "Effortless content authoring with headless WordPress or Git-based CMS." },
      { title: "Full Code & IP Handover", desc: "Organized GitHub repository transfer and 30-day bug warranty." }
    ],
    startingPrice: "$450",
    turnaroundTime: "1 - 2 Weeks",
    highlightStats: {
      label: "Average Lighthouse Score",
      value: "100/100"
    }
  },
  {
    id: "wp-performance",
    slug: "wordpress-performance",
    title: "WordPress Speed Optimization & Hardening",
    badge: "Conversion Driver",
    shortDesc: "Eliminate slow TTFB, bloated database queries, and plugin drag. Boost WordPress mobile speed from 30s into the 90s.",
    longDesc: "We audit and remediate slow WordPress installations. Database indexing, Object Caching with Redis, Cloudflare Edge Cache rules that never break wp-admin, asset minification, and security hardening against automated brute-force attempts.",
    iconName: "Zap",
    techStack: ["WordPress", "Redis Object Cache", "PHP-FPM", "MySQL", "Cloudflare Cache Rules", "Nginx"],
    deliverables: [
      { title: "Deep TTFB & Database Audit", desc: "Identification and cleanup of bloated wp_options transients and rogue queries." },
      { title: "Edge Caching Integration", desc: "Cloudflare APO / Cache Rules configured to serve HTML directly from edge nodes." },
      { title: "Redis Persistent Object Cache", desc: "In-memory query caching to eliminate repeated MySQL overhead." },
      { title: "Security Hardening", desc: "XML-RPC disabled, login rate limits, and two-factor authentication." }
    ],
    startingPrice: "$350",
    turnaroundTime: "2 - 5 Days",
    highlightStats: {
      label: "Speed Gain",
      value: "Up to 3x Faster"
    }
  },
  {
    id: "linux-server",
    slug: "linux-server-management",
    title: "Linux Server Hardening & VPS Management",
    badge: "Zero-Trust",
    shortDesc: "Production Linux VPS setup, strict SSH hardening, UFW firewall policies, Fail2ban, and automated snapshot backups.",
    longDesc: "Protect your cloud servers from automated bot scans and compromise. We implement CIS benchmark recommendations: SSH ed25519 key-only authentication, UFW restrictive rules, Fail2ban intrusion prevention, and automatic security patching.",
    iconName: "Cloud",
    techStack: ["Ubuntu", "Debian", "UFW", "Fail2ban", "WireGuard", "Nginx", "Systemd", "Bash"],
    deliverables: [
      { title: "SSH & Firewall Hardening", desc: "Port changing, root login disabled, ed25519 keys, and restrictive UFW rules." },
      { title: "Intrusion Prevention (Fail2ban)", desc: "Automated IP banning for malicious login attempts and suspicious probes." },
      { title: "Reverse Proxy & TLS 1.3", desc: "Nginx configuration with strict security headers (HSTS, CSP, X-Frame)." },
      { title: "Automated Off-Site Backups", desc: "Daily encrypted snapshot rotation to S3-compatible cloud storage." }
    ],
    startingPrice: "$300",
    turnaroundTime: "2 - 4 Days",
    highlightStats: {
      label: "Security Baseline",
      value: "CIS Benchmark"
    }
  },
  {
    id: "db-messaging",
    slug: "database-operations",
    title: "PostgreSQL & Database Disaster Recovery",
    badge: "High Assurance",
    shortDesc: "High-performance database deployment, pgBackRest automated backups, Point-In-Time-Recovery, and Redis caching.",
    longDesc: "Eliminate database bottlenecks and catastrophic data loss risks. We configure, optimize, and maintain relational and analytical data stores with automated disaster recovery protocols.",
    iconName: "Database",
    techStack: ["PostgreSQL", "pgBackRest", "MySQL", "Redis", "ClickHouse", "Bash Scripting", "Linux"],
    deliverables: [
      { title: "PostgreSQL & Redis Setup", desc: "Tuned memory allocation, connection pooling (PgBouncer), and indexing." },
      { title: "pgBackRest Disaster Recovery", desc: "Continuous WAL archiving and verified Point-In-Time-Recovery (PITR)." },
      { title: "Automated Restore Verification", desc: "Scheduled recovery drill scripts to prove backups are actually restorable." },
      { title: "Health Audits & Query Tuning", desc: "Deep troubleshooting for slow queries, locking issues, and connection leaks." }
    ],
    startingPrice: "$500",
    turnaroundTime: "3 - 7 Days",
    highlightStats: {
      label: "RTO Target",
      value: "< 15 min"
    }
  },
  {
    id: "ai-automation",
    slug: "ai-automation",
    title: "AI Workflows & Event-Driven Automation",
    badge: "Efficiency Multiplier",
    shortDesc: "Self-hosted n8n workflow clusters, custom Python automation scripts, and LLM webhook pipelines to eliminate repetitive operational work.",
    longDesc: "Leverage self-hosted workflow automation and practical AI models to streamline client intake, data synchronization, document extraction, and alert triage without paying recurring Zapier subscriptions.",
    iconName: "Sparkles",
    techStack: ["n8n", "Docker", "Python", "OpenAI API", "PostgreSQL", "Webhooks", "REST APIs"],
    deliverables: [
      { title: "Self-Hosted n8n Cluster", desc: "Dockerized n8n deployment with SSL, persistent PostgreSQL, and webhook listeners." },
      { title: "Structured LLM Extraction", desc: "Automated parsing of emails, tickets, or documents into structured JSON." },
      { title: "Multi-Platform Webhook Sync", desc: "Reliable event synchronization between Stripe, CRM, Slack, and internal DBs." },
      { title: "Full Code & Workflow Export", desc: "100% self-hosted ownership with zero third-party recurring automation fees." }
    ],
    startingPrice: "$600",
    turnaroundTime: "1 - 2 Weeks",
    highlightStats: {
      label: "Manual Work Reduced",
      value: "80%"
    }
  }
];
