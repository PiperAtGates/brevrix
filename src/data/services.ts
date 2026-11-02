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
    slug: "cloud-devops-infrastructure",
    title: "Enterprise DevOps, Kubernetes & Cloud Infrastructure",
    badge: "High Demand",
    shortDesc: "Production-grade Linux administration, Kubernetes clusters, GitOps CI/CD pipelines, and high-availability database architecture.",
    longDesc: "We design, deploy, and troubleshoot mission-critical infrastructure across Development, UAT, and Production environments. From Docker containerization and Kubernetes (k8s/k3s) orchestration to automated ArgoCD/Jenkins pipelines and database tuning.",
    iconName: "Cloud",
    techStack: ["Kubernetes (k8s/k3s)", "Docker", "Helm", "ArgoCD", "Jenkins", "GitLab CI", "Linux (Ubuntu/RHEL)", "AWS", "Nginx", "Kong", "Harbor", "Trivy"],
    deliverables: [
      { title: "Container & K8s Orchestration", desc: "Production-ready Docker & Kubernetes (k8s/k3s/Helm) cluster setup." },
      { title: "Automated CI/CD & GitOps", desc: "Zero-downtime pipelines with Jenkins, GitLab CI, ArgoCD, and Trivy security scanning." },
      { title: "API Gateway & IAM Security", desc: "Enterprise authentication with Keycloak, Kong API Gateway, and Harbor registry." },
      { title: "Monitoring & Incident Support", desc: "Log analysis, bottleneck resolution, and 24/7 production infrastructure reliability." }
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
    slug: "web-development",
    title: "Modern Web & WordPress Engineering",
    badge: "Most Popular",
    shortDesc: "Ultra-fast Astro static websites, custom WordPress platforms, and responsive business portals built for speed and conversion.",
    longDesc: "Whether you need a blazing-fast Jamstack marketing site deployed on Cloudflare Edge or a custom, easy-to-manage WordPress business platform, we deliver clean code, sub-second load times, and seamless client handoff.",
    iconName: "Code2",
    techStack: ["Astro", "WordPress", "HTML5/CSS3", "Tailwind CSS", "JavaScript", "PHP", "MySQL", "Cloudflare Pages"],
    deliverables: [
      { title: "Custom Website Architecture", desc: "Fully responsive, modern UI tailored to your brand identity." },
      { title: "CMS & Admin Integration", desc: "Easy content management via WordPress or Git-based headless CMS." },
      { title: "Edge Deployment & SSL", desc: "Global CDN hosting setup on Cloudflare or Linux VPS." },
      { title: "Documentation & Training", desc: "Organized project handover and administrative walkthroughs." }
    ],
    startingPrice: "$450",
    turnaroundTime: "1 - 2 Weeks",
    highlightStats: {
      label: "Average Lighthouse Score",
      value: "99/100"
    }
  },
  {
    id: "db-messaging",
    slug: "database-messaging-architecture",
    title: "Database Operations & Streaming Systems",
    badge: "Enterprise Ready",
    shortDesc: "High-performance database deployment, caching layers, and real-time event streaming for data-intensive applications.",
    longDesc: "Eliminate database bottlenecks and scaling failures. We configure, optimize, and maintain relational and analytical data stores alongside high-throughput messaging queues for modern distributed systems.",
    iconName: "Database",
    techStack: ["PostgreSQL", "MySQL", "Redis", "ClickHouse", "Apache Kafka", "RabbitMQ", "Linux", "Bash Scripting"],
    deliverables: [
      { title: "Database Setup & Tuning", desc: "Optimized configurations for PostgreSQL, MySQL, and ClickHouse analytics." },
      { title: "Caching & Queue Architecture", desc: "Redis caching layers and Kafka/RabbitMQ asynchronous message brokers." },
      { title: "Backup & Disaster Recovery", desc: "Automated snapshot scripts, replication, and safe restoration workflows." },
      { title: "Health Audits & Log Analysis", desc: "Deep troubleshooting for slow queries and connection leaks." }
    ],
    startingPrice: "$500",
    turnaroundTime: "3 - 7 Days",
    highlightStats: {
      label: "Query Latency Reduction",
      value: "-70%"
    }
  },
  {
    id: "ai-automation",
    slug: "ai-ml-automation",
    title: "AI, Computer Vision & Workflow Automation",
    badge: "Cutting-Edge",
    shortDesc: "Custom Python automation scripts, real-time computer vision models (YOLO/OpenCV), and intelligent business workflows.",
    longDesc: "Leverage practical machine learning and workflow automation to eliminate repetitive work. From custom PyTorch/YOLO object detection deployments to n8n business process automation and Python scripting.",
    iconName: "Sparkles",
    techStack: ["Python", "PyTorch", "YOLOv5/v8", "OpenCV", "n8n", "Bash", "Linux Deployment", "REST APIs"],
    deliverables: [
      { title: "Custom ML Model Deployment", desc: "Real-time inference pipelines using Python, PyTorch, and OpenCV." },
      { title: "Process & Task Automation", desc: "Automated data pipelines, server scripts, and webhook integrations." },
      { title: "Containerized AI Services", desc: "Dockerized model endpoints ready for production scaling." },
      { title: "Clear Technical Documentation", desc: "Full operational guides and maintainable codebase." }
    ],
    startingPrice: "$800",
    turnaroundTime: "1 - 3 Weeks",
    highlightStats: {
      label: "Manual Work Reduced",
      value: "80%"
    }
  },
  {
    id: "digital-marketing-seo",
    slug: "digital-marketing-seo",
    title: "Digital Marketing, Technical SEO & AI Search (GEO)",
    badge: "100/100 Lighthouse",
    shortDesc: "Rank on both Google and AI Answer Engines (ChatGPT, Perplexity) with technical SEO, speed optimization, and targeted outreach.",
    longDesc: "Modern traffic requires optimizing for both traditional search engines and AI assistants. We combine Core Web Vitals remediation, structured JSON-LD entity schemas, email marketing campaigns, and content strategy.",
    iconName: "Zap",
    techStack: ["Technical SEO", "GEO / llms.txt", "Schema.org", "Core Web Vitals", "Email Marketing", "Google Search Console", "Analytics"],
    deliverables: [
      { title: "Technical SEO & GEO Audit", desc: "Full optimization for Google crawlers and AI answer engines." },
      { title: "Speed & Core Web Vitals Fix", desc: "Asset compression, caching, and script optimization for 95+ scores." },
      { title: "Structured Data Implementation", desc: "Rich JSON-LD schemas for services, articles, and FAQs." },
      { title: "Campaign & Content Coordination", desc: "Structured performance tracking and marketing execution." }
    ],
    startingPrice: "$350",
    turnaroundTime: "3 - 7 Days",
    highlightStats: {
      label: "Organic Visibility Boost",
      value: "+65%"
    }
  },
  {
    id: "business-ops",
    slug: "business-operations-reporting",
    title: "Virtual Project Coordination & Financial Documentation",
    badge: "Reliable Ops",
    shortDesc: "Structured project management, financial record keeping, advanced spreadsheet organization, and administrative support.",
    longDesc: "Keep your technical projects and business accounts organized. Backed by formal accounting expertise, we handle bookkeeping records, spreadsheet reporting, project documentation, and client coordination.",
    iconName: "FileSpreadsheet",
    techStack: ["Microsoft Excel", "Google Sheets", "Bookkeeping", "Financial Reporting", "Project Documentation", "Client Operations"],
    deliverables: [
      { title: "Financial Record Organization", desc: "Accurate bookkeeping, expense tracking, and structured ledgers." },
      { title: "Custom Spreadsheet Models", desc: "Automated formulas, clean data tables, and executive summary reports." },
      { title: "Project & Client Coordination", desc: "Requirement tracking, deadline management, and status reporting." },
      { title: "SOP & Documentation Setup", desc: "Organized digital filing systems and operational templates." }
    ],
    startingPrice: "$250",
    turnaroundTime: "Ongoing / Flexible",
    highlightStats: {
      label: "Data Accuracy Rate",
      value: "100%"
    }
  }
];
