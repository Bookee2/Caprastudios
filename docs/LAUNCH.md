# Capra Studios launch

## Current delivery

This is a finished static marketing website with a local preview and GitHub Pages publishing workflow. It includes custom branding, responsive layouts, finite animation, real portfolio screenshots, search metadata, structured data, sitemap generation, and a direct email inquiry path.

The website's source is delivered through a pull request. Merging to `main` triggers publishing once Pages is configured for GitHub Actions. The build has no package dependencies.

## Business details to settle

- **Contact:** `info@caprastudios.co`. Set up its mailbox or forwarding before relying on it.
- **Location:** Atlanta, GA, with remote US clients, inferred from Capra HR. No street address is published.
- **Offer:** Clear scope and upfront project quotes. No unapproved dollar pricing or delivery guarantees are published. Add a starting price only after deciding what the entry offer includes.
- **Portfolio:** The projects are described as the founder's ventures, not as unrelated paying clients.

## The domain: caprastudios.co

Bought by KB at Porkbun on October 2, 2026. The site's canonical address is `https://caprastudios.co/` (`site.config.json`), and the contact address is `info@caprastudios.co`.

1. In this repository's **Settings → Pages**, the custom domain is **caprastudios.co**.
2. At Porkbun, under **DNS** for caprastudios.co, delete the default parking records (the `A` records for `@` pointing at Porkbun's servers and the `www` / `*` `CNAME` to `pixie.porkbun.com`), then add:

   | Type | Host | Answer |
   | --- | --- | --- |
   | A | (blank) | 185.199.108.153 |
   | A | (blank) | 185.199.109.153 |
   | A | (blank) | 185.199.110.153 |
   | A | (blank) | 185.199.111.153 |
   | CNAME | www | bookee2.github.io |

3. Optional but recommended: verify the domain under your GitHub account's **Settings → Pages → Verified domains** with the TXT record GitHub provides, so no one else can claim it on GitHub.
4. When GitHub's DNS check passes and the certificate is issued (minutes to a day), enable **Enforce HTTPS**.
5. Email: the address `info@caprastudios.co` does not receive mail until a mailbox or forwarding is set up. Porkbun's free email forwarding (or a mail host such as Google Workspace or Fastmail) adds the `MX` records it needs.

GitHub Actions publishing uses the Pages custom-domain setting; a `CNAME` file is not required for this workflow. See GitHub's [custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Search launch

- Verify domain ownership in Google Search Console and submit `https://caprastudios.co/sitemap.xml` after the domain works.
- The site includes crawlable copy, descriptive titles, semantic sections, image alternatives, canonical URLs, and ProfessionalService structured data. These are technical foundations, not ranking guarantees.
- The build's `robots.txt` is authoritative on the custom domain. On the default GitHub project URL, crawlers consult the account root's `robots.txt`; submitting the project sitemap is still possible.
- A social share image is not included. The site has text Open Graph metadata and uses a summary card.

## Hosting and ongoing costs

- **Current website:** static hosting only; GitHub Pages serves the HTML, styles, scripts, logos, and images.
- **Blender video:** render locally, export compressed browser video, and serve it as an asset. No Python server is needed.
- **Render or another application host:** only needed if adding a live backend such as server-generated animations, account features, a private API, a database, or server-side form processing. None of those are part of this website.
- **Contact:** the site uses email links. Visitors send their own email; no form submission is simulated.
- **Payments:** no checkout, billing, subscription, or card collection is included.

Future server or payment features should be scoped with hosting costs and platform terms before implementation.
