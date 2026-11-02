export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  projectType: string;
}

export const testimonialsData: TestimonialItem[] = [
  {
    id: "alex-chen",
    name: "Alex Chen",
    role: "Co-Founder & CEO",
    company: "Zenith Flow (Y-Combinator W24)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    content: "Working with Brivrix was one of the best technical decisions we made this year. Not only did they deliver our full-stack MVP 4 days ahead of schedule, but the code architecture was so clean that our seed investors specifically praised the technical diligence.",
    rating: 5,
    projectType: "Full-Stack Web & Cloud Deployment"
  },
  {
    id: "elena-rostova",
    name: "Elena Rostova",
    role: "Head of Product",
    company: "Pulse Treasury",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    content: "The attention to detail in the Figma design system and the translation into code was unbelievable. We saw a 68% jump in our checkout conversions within three weeks of rolling out the new design. Truly world-class craftsmanship.",
    rating: 5,
    projectType: "UI/UX & Design Systems"
  },
  {
    id: "marcus-vance",
    name: "Marcus Vance",
    role: "CTO & VP Engineering",
    company: "HyperCloud Media",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    content: "We needed someone who understood modern Edge deployments on Cloudflare Pages and Linux edge infrastructure at a deep level. Brevrix handled the migration seamlessly with zero downtime, and our global TTFB dropped under 40 milliseconds worldwide.",
    rating: 5,
    projectType: "DevOps & Edge Infrastructure"
  },
  {
    id: "sarah-lindqvist",
    name: "Sarah Lindqvist",
    role: "Managing Director",
    company: "Novak Athletics",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    content: "From communication on Slack to sprint deliverables, the professionalism was 10/10. Every commit had clean tests, and our mobile site speed jumped from 48 to 100 on Google Lighthouse.",
    rating: 5,
    projectType: "Headless E-Commerce & Astro"
  }
];

