# The Capra SEO standard

Every website Capra builds launches search-ready. This is the standard, and on Capra's own site `scripts/seo.mjs` enforces it: the build fails, and nothing publishes, if an indexable page misses any of the checked items.

## Checked by the build (every indexable page)

| Item | Rule | Why |
| --- | --- | --- |
| Title | 15–65 characters, unique, leads with what the page offers, ends with the brand | It is the headline in search results |
| Meta description | 70–165 characters, unique, written for a person | Usually the snippet under the headline |
| Canonical | Absolute URL of the page on the live domain | One address per page, no duplicates |
| `<html lang>` | Set | Language targeting and accessibility |
| Open Graph | `og:title`, `og:description`, `og:url`, `og:type`, `og:image` (1200×627 or 1200×630, file must exist), `og:image:alt` | Link previews on LinkedIn, iMessage, Slack, Facebook |
| Twitter card | `summary_large_image` | Large previews on X |
| Icons | Favicon and 180×180 `apple-touch-icon` | Tabs, bookmarks, home screens, some search results |
| Headings | Exactly one `<h1>` | A clear topic per page |
| Images | Every `<img>` has `alt` (empty only when decorative) | Image search and screen readers |
| Structured data | Valid JSON-LD on the homepage and every service or case-study page | Rich results and an accurate business profile |
| Indexing | No `noindex` on a page listed as indexable | Pages we want found can be found |

## Set up in the build

- `sitemap.xml` lists every indexable page with `<lastmod>` from the last commit that touched it (the deploy checks out full history for this).
- `robots.txt` allows crawling and points to the sitemap.
- The canonical domain comes from one config value, so moving domains rewrites every canonical, `og:url`, structured data and sitemap entry together.

## Structured data to include

- **Homepage:** `ProfessionalService` (or the right `LocalBusiness` subtype) with name, URL, logo, image, email, city/region address, area served, services offered (`OfferCatalog`), plus a `WebSite` entry. Add `sameAs` links to real social profiles once they exist; never invent them.
- **Service pages:** `Service` with provider, plus `BreadcrumbList`.
- **Case studies:** `CreativeWork` with creator, plus `BreadcrumbList`.
- Only state facts that are true and visible on the page. No fake reviews, ratings or prices.

## Done by hand at launch (per client)

1. Verify the domain in **Google Search Console** (a DNS TXT record at the registrar covers every subdomain and protocol) and submit `sitemap.xml`.
2. Do the same in **Bing Webmaster Tools**. It can import from Search Console.
3. Create or claim the **Google Business Profile** if the client serves a local area. Keep the name, city and contact details identical to the site.
4. Check the redirects: http goes to https, www goes to the bare domain (or the reverse), and an unknown path returns a real 404.
5. Paste each page into a link-preview checker (LinkedIn Post Inspector, or a message to yourself) to see the share image.
6. Run Google's Rich Results Test on the homepage and one service page.
7. Run PageSpeed Insights on the homepage on mobile. Fix anything red in Largest Contentful Paint or layout shift before launch.

## What we tell clients

This standard makes a site eligible and easy to understand for search engines and link previews. Rankings depend on content, competition and time, so we don't promise positions. Ongoing content, local reviews and backlinks are separate work.
