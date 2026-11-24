---
title: "Astro vs Next.js for Static Business Sites: An Honest Comparison"
description: "Astro vs Next.js for static business sites: what each framework ships, hosting and content trade-offs, and a decision checklist — no benchmark theatre."
aiSummary: "For a static business site — service pages, a blog, landing pages — Astro ships zero JavaScript by default and adds interactivity only where you mark it, while Next.js ships a React runtime and hydrates components even when the site is exported as static files. That difference drives page weight, hosting flexibility, and maintenance burden. Next.js remains the better choice for app-like sites with authentication, dashboards, or a team already deep in React. This comparison uses no benchmark numbers: it explains where the weight difference comes from and how to measure it on your own pages."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "Web Development"
---

Most framework comparisons are written for web applications. This one is narrower, on purpose: you have a business site (a homepage, service pages, a blog, a few landing pages, a contact form) and you are choosing between Astro and Next.js to build it. The two tools overlap heavily in marketing copy and very little in what they actually deliver to a visitor's browser, and for this class of site that difference is the decision.

Full disclosure: **this site, Brevrix, is built with Astro**, and our [Astro web development service](/services/astro-web-development/) exists because we kept reaching the same conclusion for client brochure and service sites. Treat what follows as first-party experience from a studio that builds in Astro. It is not a neutral benchmark. Where Next.js is the right answer, we say so.

## A note on numbers: this post has none

You will find no Lighthouse scores, no load-time tables, and no "X is 3.2× faster" claims here, and that is deliberate. A benchmark comparing two frameworks on *different* pages measures the pages, not the frameworks. Two builds of the same page differ in images, fonts, embeds, and analytics scripts. Those differences swamp the framework's contribution, and comparison articles rarely control for them.

We can explain *why* one output is structurally heavier than the other, and give you the method to measure it on your own content (below).

## What each framework actually ships

### Astro: HTML first, JavaScript only where you ask

Astro is a static site builder first. You write components (in `.astro` files, or in React, Vue, Svelte, and others) and Astro renders them to plain HTML and CSS at build time. The default JavaScript sent to the browser is **zero**. A page made of Astro components is a document, and it behaves like one.

Interactivity is opt-in, per component, through what Astro calls islands. A component becomes an island when you add a client directive, and you choose *when* it hydrates:

- `client:load`: hydrate immediately on page load (a mobile menu, a search box).
- `client:idle`: hydrate when the browser is idle (things below the fold that can wait).
- `client:visible`: hydrate when the component scrolls into view (a pricing calculator halfway down the page).
- `client:media`: hydrate only when a media query matches (a desktop-only widget).

Everything outside the islands stays static HTML. A typical service page might hydrate one small component and ship a few kilobytes of JavaScript; the rest of the page costs nothing at runtime. Content is a first-class feature: content collections give Markdown and MDX files a typed schema (this blog is one), so a post with a missing title fails the build instead of publishing broken.

### Next.js: a React application that can render statically

Next.js is a React framework for applications that also does static generation well, and its pages are React components. With React Server Components, much of a page renders on the server (or at build time), and Next.js sends the resulting HTML plus the JavaScript needed to make the client components interactive. For a fully static site you use static rendering with `generateStaticParams` for dynamic routes, and you can produce a plain static export (`output: 'export'`) with no Node server at all.

Even in a static export, any component marked `'use client'` ships React and its own code to the browser and hydrates: React runs on the client, attaches event handlers, and reconstructs the component tree over the delivered HTML. Server components reduce how much of the page does this, but the runtime and the hydration pass are part of the architecture, not an add-on. On a marketing page where the only interactivity is a menu toggle, you are paying that cost for very little.

Neither model is a bug. They are answers to different questions: Astro asks "why would this page need JavaScript at all?"; Next.js asks "how do we make a React application render efficiently?" For an app, the second question is the right one. For a brochure site, it is mostly overhead.

## Where the weight difference comes from, and how to check it yourself

The gap between the two outputs on identical content comes from three things:

1. The framework runtime. A hydrated Next.js page includes React, ReactDOM (or their modern equivalents), and the Next.js client runtime before any of *your* code runs. An Astro page with no islands includes no framework code at all.
2. Hydration itself. Hydration is work the visitor's device does after download: parsing and executing the JavaScript, then walking the DOM to attach behaviour. On a fast desktop this is invisible; on a mid-range phone on a slow connection, which is a large share of real business-site traffic, it is the difference between a page that is simply there and a page that is briefly unresponsive.
3. What grows over time. In an app framework, the path of least resistance is another client component. Business sites accumulate carousels, chat widgets, popups, and trackers; in Next.js each addition rides on an already-present runtime and tends to add more client code, while in Astro each addition is a deliberate island you had to mark.

Do not take our word for the size of the gap. Measure it, the same way we would:

- Build the same page both ways. One representative page, your busiest service page, with its real images and fonts, in each framework, deployed somewhere real.
- Read the transfer. Open DevTools → Network on the deployed URL, reload with cache disabled, and compare total transferred JavaScript. Then check the build output itself: both tools report per-route output, and the difference is usually visible before you deploy anything.
- Run Lighthouse on the deployed URLs, on the mobile profile, a few times each, and compare medians. Lighthouse on localhost or on two different pages tells you nothing.

If the gap on *your* page turns out to be small, because your Next.js build is disciplined about client components, believe your measurement over this article.

## The comparison that matters for a business site

Content and blogging. Astro's content collections are built for exactly this: Markdown/MDX with frontmatter schemas, type-checked at build time, with no database and no runtime. Next.js handles Markdown fine too, but it is something you assemble (a library, your own frontmatter parsing, your own routing) rather than a designed feature. For a site whose main ongoing activity is publishing articles, Astro's path is shorter.

Images. Both have real answers. Next.js's `next/image` is mature, but in a pure static export its default optimization needs a custom loader, because there is no server to optimize on request. Astro's built-in image handling optimizes at build time, which fits static hosting naturally.

Forms. A tie: a static site has no backend in either framework, so a contact form posts to a form service, a serverless function, or your CRM either way. Do not let a framework's "server actions" story pull you into running a server for a site that otherwise needs none. That is an operations commitment (patching, uptime, cold starts) bought to save one form endpoint.

SEO control. Both give you full control of titles, meta descriptions, canonical URLs, and structured data, and both generate sitemaps (Astro via its sitemap integration, Next.js via its built-in sitemap support). There is no SEO advantage to either framework itself; there is a large SEO advantage to pages that are fast on cheap phones.

Hosting. This is where the architectures diverge operationally. An Astro build is a folder of files: it deploys identically to Cloudflare Pages, Netlify, S3, nginx, or any static host, and there is nothing to patch, scale, or keep awake. A static-exported Next.js site can also go to static hosts, but the framework's centre of gravity is a Node server or Vercel. Middleware, image optimization, and incremental features assume it, and teams routinely end up on a server runtime for one small feature, then own that server forever. If your hosting plan is "static files on a CDN," Astro never fights it.

Maintenance burden. A static Astro site has a small dependency tree and no runtime; framework upgrades are occasional and low-drama. Next.js sits on the React ecosystem: more dependencies, faster churn, and major-version migrations that are real projects. For an application under active development that cost is the price of the ecosystem. For a marketing site that changes twice a month, it is pure overhead. The site most likely to be neglected is the one that is annoying to update, and neglected sites are a security and credibility problem.

Who can maintain it. Any front-end developer can pick up an Astro site: the components are close to HTML, and the mental model is "templates that build pages." Next.js requires genuine React fluency, including knowing which components should be server and which client, and that hiring pool is priced for application work. If your maintainer is a generalist or a future freelancer, that matters.

## When Next.js is the right choice anyway

Everything above is scoped to static business sites. Step outside that scope and the answer flips, quickly:

- The site is becoming an application. Authentication, user accounts, dashboards, checkout flows, anything where the user logs in and *does* things. That is what Next.js is for, and bolting it onto a static builder is worse than starting there.
- Heavy interactive components dominate the pages. Complex configurators, real-time data, rich editors: when most of the page is application, the runtime cost is already justified and React's ecosystem is the asset, not the overhead.
- You already have the React assets. A design system, a component library, a team fluent in React and already shipping Next.js elsewhere. Consistency across properties can outweigh per-page weight. Rebuilding working components in a second framework to save JavaScript is usually a bad trade.
- One codebase must serve site and app together. If the marketing pages and the product genuinely share components, sessions, and deployment, a single Next.js codebase is a defensible architecture. Just be honest about how much sharing actually happens; in our experience it is usually less than planned.

And one option that is neither: if your current site is a slow WordPress install, the framework debate may be premature. A well-tuned WordPress on proper caching closes much of the real-world gap without a rebuild. That is literally a service ([WordPress performance](/services/wordpress-performance/)), and migration only earns its cost when the maintenance burden or the redesign is the actual problem.

## Decision table

| Site type | Recommendation | Why |
|---|---|---|
| Brochure / service-company site | **Astro** | Mostly static content; zero-JS default, static hosting, low maintenance |
| Content-led site / company blog | **Astro** | Content collections are purpose-built; publishing stays simple |
| Landing pages for campaigns | **Astro** | Speed on cold mobile traffic; pages are cheap to spin up and host |
| Portfolio / studio site | **Astro** | Same profile as a brochure site, usually image-led |
| Site with a logged-in area or dashboard | **Next.js** | Auth and app behaviour are its home ground |
| E-commerce with accounts and checkout logic | **Next.js** (or a dedicated platform) | Application behaviour dominates; static-first stops fitting |
| Marketing site + app sharing one codebase | **Next.js**, consciously | Worth it only if the sharing is real, not aspirational |
| Team is React-only, site is simple | **Next.js is acceptable** | A disciplined static export beats an unfamiliar stack — measure the JS you ship |

## A short decision checklist

Ask these in order; the first decisive answer usually settles it:

1. Will visitors log in and do things, or only read and enquire? Do things → Next.js. Read and enquire → keep going.
2. How much of a typical page is genuinely interactive, meaning it needs application state rather than just a menu toggle? If it is one or two components, that is islands, not an application.
3. Where will it be hosted? If the honest answer is "static files on a CDN," choose the tool whose output *is* static files by default.
4. Who maintains it in year two, and what do they already know? A framework nobody on the team enjoys updating will not be updated.
5. What does the same page weigh in each? Run the measurement from the section above on one real page before committing the whole site.

## Migration note: it is a move, not a rewrite

Teams overestimate switching costs in both directions. A static Next.js site's real assets are its content (Markdown, images, copy), its design (CSS, layout decisions), and its URLs. Moving to Astro means porting templates and components (React components can even run inside Astro as islands during a transition), while content and styling carry over largely intact. There is no application logic to rewrite because, on a static site, there never was much.

The reverse is equally true if an Astro site grows an application. Either way, the work is measured in templates, not in rethinking the site, provided you protect what actually carries value: keep URLs identical or redirect them properly, and move the SEO metadata across page for page. A migration that changes every URL without redirects destroys more value than any framework choice creates.

## FAQ

### Is Astro only for small sites?

No. The static model scales by adding pages, not by adding runtime. Large documentation and content sites run on Astro precisely because build-time rendering does not care how many pages there are. The constraint is not size; it is interactivity. A huge site of readable pages fits Astro; a small site that behaves like an application does not.

### Can a Next.js site be just as fast?

A disciplined one can get close on a simple page: static export, minimal client components, no unnecessary libraries. The difference is the default and the floor: Next.js starts with a runtime you must actively minimise, Astro starts at zero and you add deliberately. Teams that will do the minimising work can choose either; teams that will not should choose the tool whose default is the outcome they want.

### What about WordPress: should we skip both?

Possibly. If the site exists, the content is in WordPress, and the problem is speed or security rather than the platform itself, fixing the WordPress install is often the cheapest correct answer. Migrate when the platform itself is the problem: maintenance burden, a redesign, a team that has moved on.

### Does the framework choice affect SEO rankings directly?

No search engine ranks "Astro" above "Next.js." What affects rankings is what visitors and crawlers experience: fast, stable pages on real devices, correct metadata, and content that answers the query. Framework choice matters only through those effects, which is why the weight and maintenance sections above matter more than any feature list.

## The short version

For a static business site, choose the tool whose default output matches the site: Astro ships HTML and adds JavaScript only where you point at it, hosts anywhere static files live, and stays cheap to maintain. That is why this site runs on it. Choose Next.js when the site is, or is honestly becoming, an application, or when your team's React investment makes it the pragmatic home. Either way, measure one real page both ways before you commit.

Thinking about a build or a migration? Our [Astro web development service](/services/astro-web-development/) covers new static sites and migrations from WordPress or Next.js, with URLs and SEO metadata preserved. [Get in touch](/contact/) with your current site and what you want it to do, and we will tell you if Astro is wrong for it.
