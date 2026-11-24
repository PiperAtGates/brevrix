---
title: "WordPress on Cloudflare: Cache Rules That Speed Up Your Site Without Breaking wp-admin"
description: "WordPress Cloudflare cache rules: bypass wp-admin and logged-in users, cache HTML for anonymous visitors, and set long TTLs for static assets — safely."
aiSummary: "Most WordPress sites on Cloudflare cache either too little or too much. The safe setup uses Cloudflare Cache Rules in a strict order: bypass the cache for logged-in cookies and wp-admin/login/WooCommerce paths first, then mark HTML eligible for edge caching for anonymous visitors with a cache key that ignores marketing parameters, and give static assets long edge and browser TTLs. Verify with cf-cache-status headers before trusting it, and purge on publish so new content is not stuck behind stale HTML."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "Web Performance"
---

Put a default WordPress site behind Cloudflare and one of two things usually happens. Either the cache barely engages — Cloudflare serves your static files from the edge, but every page view still travels back to your origin for the HTML, so the site feels exactly as slow as before. Or someone adds a "cache everything" rule, traffic spikes look great for a day, and then a logged-in customer sees another customer's account page, the checkout misbehaves, or an editor's changes never appear. Both outcomes come from the same root cause: the rules were written without separating *who* the request is for.

WordPress is two sites in one. Anonymous visitors read public pages that are identical for everyone — those are safe to cache aggressively. Logged-in users, editors, and shoppers get personalised pages that must never be stored or shared. A working Cloudflare setup is mostly the discipline of keeping those two apart, in the right order.

This guide builds that setup with Cloudflare's current **Cache Rules** (Caching → Cache Rules in the dashboard), not legacy Page Rules. Page Rules still work on older accounts, but Cache Rules are where Cloudflare is investing, they support richer expressions, and they will outlive any Page Rule you write today.

One principle before the rules themselves: **Cache Rules are evaluated top to bottom, and order is part of the configuration.** The bypass rules must sit above the caching rules. If "cache everything" is evaluated first, the bypass below it never gets a chance to protect anyone.

## Rule 1: Bypass the cache for logged-in and shopping cookies

This is the most important rule on the site, and it goes first. WordPress tells you a request is personalised through its cookies: anyone with a `wordpress_logged_in_` cookie is authenticated, WooCommerce sets `woocommerce_` cookies for carts and sessions, and commenters get `comment_author_` cookies. If any of those are present, Cloudflare must not serve a cached copy and must not store the response.

**When incoming requests match:**

```text
(http.cookie contains "wordpress_logged_in")
or (http.cookie contains "comment_author")
or (http.cookie contains "woocommerce_")
```

**Then:** Cache eligibility → **Bypass cache**.

A note on matching: a broad `http.cookie contains "wp-"` also works and catches plugin cookies, but it can over-bypass — some analytics and consent plugins set harmless `wp-` prefixed cookies for every visitor, which would quietly disable caching site-wide. Start with the specific cookies above, then check your own site's cookie list (browser dev tools → Application → Cookies) and add anything that genuinely indicates a session.

## Rule 2: Bypass wp-admin, login, and WooCommerce account paths

Cookies cover most personalised traffic, but admin and account paths should bypass on URL alone — belt and braces, because a misconfigured plugin or an edge case in cookie handling should never result in an admin screen being cached.

**When incoming requests match:**

```text
(starts_with(http.request.uri.path, "/wp-admin"))
or (http.request.uri.path eq "/wp-login.php")
or (starts_with(http.request.uri.path, "/cart"))
or (starts_with(http.request.uri.path, "/checkout"))
or (starts_with(http.request.uri.path, "/my-account"))
```

**Then:** Cache eligibility → **Bypass cache**.

Adjust the WooCommerce paths if your store uses different slugs — check WooCommerce → Settings → Advanced → Page setup. If you run a membership or LMS plugin, add its account and dashboard paths here too. Anything that renders per-user content belongs in this rule or Rule 1, no exceptions.

## Rule 3: Cache HTML for everyone else

Only now — after the two bypass rules — do you tell Cloudflare to cache pages. By default, Cloudflare does **not** cache HTML; it caches a list of static file extensions and passes everything else through. This rule is what changes that, and it is where the actual speed comes from, because the HTML document is what determines your time to first byte.

**When incoming requests match:**

```text
(http.request.method eq "GET")
```

**Then:**

- Cache eligibility → **Eligible for cache**
- Edge TTL → **Use cache-control header if present, bypass cache if not** if your theme or a performance plugin already emits sane headers; otherwise set a fixed edge TTL. For a typical brochure or content site, 2–4 hours is a reasonable starting point; for a news-style site publishing many times a day, 30–60 minutes. (Purging on publish, covered below, matters more than the exact number.)
- Browser TTL → **Respect existing headers** or a short fixed value such as 4 hours. A long browser TTL on HTML means returning visitors may not even revalidate; keep it modest.

Do not add your hostname to this expression unless you run several sites on one zone — on a single-site zone it matches everything that survived Rules 1 and 2, which is exactly the intent.

## Rule 4: Fix the cache key so marketing links stop fragmenting the cache

By default, the full query string is part of the cache key. That means `yoursite.com/pricing/?utm_source=facebook` and `yoursite.com/pricing/?utm_source=newsletter` are two separate cache entries for the same page — and the second visitor from each campaign gets a slow origin fetch. Worse, every unique `fbclid` click identifier creates a fresh entry that will never be requested again.

In the same Rule 3 (or a dedicated rule directly beneath it), open the **Cache key** settings and exclude the parameters that never change the page content:

```text
utm_source, utm_medium, utm_campaign, utm_term, utm_content,
fbclid, gclid, msclkid, mc_cid, mc_eid
```

**Do not switch the query string handling to "ignore all."** WordPress uses query strings for real things: search (`?s=`), WooCommerce product filters and sorting, pagination on some setups, and plugin features. Ignoring the entire query string serves the unfiltered page to someone who asked for a filtered one. Exclude the marketing list; keep everything else in the key.

## Rule 5: Long TTLs for static assets

Uploads, theme files, and plugin assets change rarely and are already cached by Cloudflare's defaults — this rule exists to hold them at the edge much longer and let browsers keep them too.

**When incoming requests match:**

```text
(starts_with(http.request.uri.path, "/wp-content/uploads"))
or (http.request.uri.path.extension in {"css" "js" "png" "jpg" "jpeg" "gif" "webp" "svg" "ico" "woff" "woff2" "ttf"})
```

**Then:**

- Cache eligibility → **Eligible for cache**
- Edge TTL → **1 month** (override origin)
- Browser TTL → **1 month** (override origin)

Long TTLs are only safe because WordPress and most asset tools version their files — `style.css?ver=6.4` or a hashed filename changes when the file changes, producing a new URL that misses the old cache entry. If you hand-edit a CSS file *without* changing its name or version, a month-long TTL will hide your change from visitors; bump the version or purge that URL.

## What not to cache

A few WordPress surfaces should stay out of the edge cache even for anonymous visitors:

- **Site search** — results are generated per query and age badly. Bypass with `(http.request.uri.query contains "s=")`. (They are also fragmented by the query string, so caching them buys almost nothing.)
- **`/wp-json/`** — the REST API. Most of it is consumed by the block editor, apps, and integrations that expect fresh responses. The default posture is bypass. The exception: a headless or heavily API-driven front end reading *public* GET endpoints can cache selected routes briefly — do that as a separate, narrowly-scoped rule, not by caching the whole API.
- **Feeds (`/feed/`)** — your call. RSS readers poll infrequently and a short edge TTL (15–30 minutes) takes real load off the origin on feed-heavy sites. If your feed must reflect edits instantly, bypass it. Either way, decide deliberately rather than inheriting whatever the generic rule does.
- **Anything behind a form POST** — already safe: Cloudflare only caches GET/HEAD requests, and Rule 3 is restricted to GET anyway.

## Full-page caching vs Cloudflare APO

If you research this topic you will meet **Automatic Platform Optimization (APO)**, Cloudflare's paid WordPress add-on ($5/month on otherwise free plans). It is worth understanding what you are paying for rather than treating it as magic.

APO does roughly what Rules 1–5 above do, automatically: it caches HTML at the edge for anonymous visitors, uses the WordPress cookies to bypass personalised requests, and pairs with a companion plugin that purges the edge cache when content changes. Its genuine advantages are convenience and polish — it handles the cookie logic for you and keeps cache behaviour in step with WordPress.

The honest comparison:

- **The free rule set is enough** if your site is a brochure site, blog, or modest WooCommerce store, you are comfortable maintaining five rules, and you install a purge-on-publish plugin (below). You are not leaving meaningful speed on the table — both approaches serve the same cached HTML from the same edge network.
- **APO is worth the $5** if the site earns money per visit (a busy store, an ad-driven publication), if nobody on the team wants to own cache rules, or if you keep breaking the manual setup with new plugins that introduce new cookies and paths. You are paying for reduced maintenance, not a different class of performance.

Either way, measure instead of assuming. The test is the response header, not a feeling:

```bash
curl -sI https://yoursite.com/ | grep -i cf-cache-status
```

Run it twice. The first request may be a `MISS`; the second should be a `HIT` for an anonymous page. Compare time to first byte before and after with `curl -o /dev/null -s -w "%{time_starttransfer}\n" https://yoursite.com/` from a couple of networks. If the header says `HIT` and TTFB dropped, the cache is doing its job — whoever's rules produced it.

## Verification: prove it before you trust it

Cache misconfigurations fail silently — the site looks fine to you, in your browser, logged in as admin. Verify from the outside:

1. **Anonymous HIT.** In a private window (or with `curl`, as above), load a public page twice and confirm `cf-cache-status: HIT` on the second request.
2. **Logged-in bypass.** Log in in a normal browser window, reload a public page, and check the header in dev tools → Network: it must read `BYPASS` or `DYNAMIC`, never `HIT`. Then confirm the admin bar renders and the content matches your account — you should never see a cached anonymous version of a page while logged in, and a logged-out visitor must never see yours.
3. **Two-browser test.** Open the same page logged in (browser A) and logged out (browser B, private window). The pages should differ exactly where they should — admin bar, account links, cart count — and nowhere else.
4. **Set-Cookie check.** A cached response must not carry another visitor's session cookie. On your anonymous `curl -sI` request, confirm there is no `Set-Cookie` for `wordpress_logged_in` or WooCommerce session cookies in the *cached* response. If a plugin sets cookies on every page view, Cloudflare may refuse to cache or, worse, the cookie gets served to everyone — fix the plugin behaviour or add that cookie to Rule 1.
5. **WooCommerce flow.** Add to cart, view cart, reach checkout (in test mode if live). Every step should bypass, and the cart count should be correct in both browsers.

## Common mistakes

- **Caching `admin-ajax.php`.** WordPress routes a large share of dynamic frontend behaviour — live search, filters, cart fragments — through `/wp-admin/admin-ajax.php`. It falls under the `/wp-admin` bypass in Rule 2 for a reason. Exempting it because "the frontend needs it fast" produces stale carts and broken filters.
- **Ignoring all query strings.** Covered in Rule 4: it feels like a bigger cache win and quietly breaks search, sorting, and filtering. Exclude marketing parameters by name instead.
- **Rule order.** A "cache everything" rule placed *above* the cookie and admin bypasses defeats them. After any change in the dashboard, re-check the order and re-run the verification steps — Cloudflare will not warn you.
- **Publishing into a stale cache.** With HTML cached for hours, a new post or a price change is invisible until the TTL expires. Install a Cloudflare-aware purge plugin (or your performance plugin's Cloudflare integration) that purges the affected URLs — ideally the whole edge cache for small sites — on publish and update. This single integration is what makes longer edge TTLs safe.

## FAQ

### Will these rules break WooCommerce checkout?

Not if Rules 1 and 2 stay above Rule 3. Checkout, cart, and account pages bypass by path, and any request carrying WooCommerce session cookies bypasses by cookie. Verify with the two-browser test and a full test checkout before considering it done — "the rules look right" is not verification.

### Do I still need a WordPress caching plugin?

Yes, but for a different layer. Cloudflare caches at the edge for visitors; a plugin (or server-level page cache) generates the page efficiently at the origin on a cache miss and handles things Cloudflare cannot — object cache, database transients, minification. The layers complement each other; neither replaces the other.

### Why is my page still a MISS after several loads?

Common causes: the response sets a cookie (see the Set-Cookie check), the origin sends `Cache-Control: no-cache` or `private` and your edge TTL is set to respect origin headers, you are logged in or carrying a commenter cookie in that browser, or the URL has a query parameter that is not excluded, making every visit a unique key. The `cf-cache-status` header plus a look at the response's `Cache-Control` and `Set-Cookie` headers will identify which.

### Should I migrate my old Page Rules instead of starting fresh?

If your Page Rules work and are verified, they keep working — but write any *new* behaviour as Cache Rules, and migrate deliberately when you touch the setup, re-testing order and bypasses afterwards. Running both systems long-term with overlapping intent is how contradictory configurations happen.

## The short version

Bypass by cookie, bypass by admin and account path, then cache HTML for anonymous GET requests with marketing parameters excluded from the key, long TTLs on versioned static assets, a purge on every publish, and header checks to prove all of it. That is the whole system — whether you maintain it as free Cache Rules or pay for APO to maintain it for you.

If your WordPress site is slow and you are not sure which layer is responsible — origin, theme, or cache — our [WordPress performance service](/services/wordpress-performance/) starts with measuring exactly that before changing anything. Sites that have outgrown WordPress entirely sometimes land better on a static architecture; that trade-off is what our [Astro web development service](/services/astro-web-development/) exists for. Either way, [get in touch](/contact/) and describe the site you have.
