# Capra Studios launch

## Current delivery

This is a finished static marketing website with a local preview and GitHub Pages publishing workflow. It includes custom branding, responsive layouts, finite animation, real portfolio screenshots, search metadata, structured data, sitemap generation, and a direct email inquiry path.

The website's source is delivered through a pull request. Merging to `main` triggers publishing once Pages is configured for GitHub Actions. The build has no package dependencies.

## Business details to settle

- **Contact:** `kris@caprahr.com` is the working address already published on Capra HR. If switching to `hello@caprastudios.ai`, first create and test that mailbox or forwarding address, then replace the email in `index.html`, `privacy.html`, and the build test.
- **Location:** Atlanta, GA, with remote US clients, inferred from Capra HR. No street address is published.
- **Offer:** Clear scope and upfront project quotes. No unapproved dollar pricing or delivery guarantees are published. Add a starting price only after deciding what the entry offer includes.
- **Portfolio:** The projects are described as the founder's ventures, not as unrelated paying clients.

## Buy and connect caprastudios.ai

On September 9, 2026, the registry's [RDAP endpoint](https://rdap.identitydigital.services/rdap/domain/caprastudios.ai) returned `404 / Object not found`. This is a registration-record check, not a registrar availability or purchase guarantee. No domain was purchased and no price was verified.

1. At your domain registrar, confirm exact spelling, availability, initial term, total price, renewal price, and renewal term for **caprastudios.ai**. Register it in the account you control for Capra, LLC.
2. Verify the domain in your GitHub account using the TXT record GitHub provides.
3. In this repository's **Settings → Pages**, add **caprastudios.ai** as the custom domain before changing its DNS.
4. Add these records at your DNS provider:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | bookee2.github.io |

5. Set the GitHub Actions repository variable **SITE_URL** to `https://caprastudios.ai/` and rerun the workflow from `main`. Alternatively update `site.config.json` through a PR. The build updates canonicals, Open Graph URL, structured data, sitemap, robots, and the 404 home link together. Relative asset links already support both URLs.
6. When GitHub's domain check and certificate are ready, enable **Enforce HTTPS**. Verify the apex and `www` resolve to the same canonical website.

GitHub Actions publishing uses the Pages custom-domain setting; a `CNAME` file is not required for this workflow. DNS and certificate availability can take time. See GitHub's official [custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [custom-workflow instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Search launch

- Verify domain ownership in Google Search Console and submit `https://caprastudios.ai/sitemap.xml` after the domain works.
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
