# Market Pulse demo

A commercial real estate analytics dashboard that runs entirely in the page, on synthetic data. It is an embeddable component for the Capra Studios site: one HTML fragment, one stylesheet and two scripts.

## Provenance

Ported on 2026-11-17 from the CRE Market Pulse demo, a static dashboard with its own analytics, chart kit and rules-based insight engine. The analytics, the forecast, the anomaly test, the lease scoring and the question rules are the original code, moved into one script. The sample data is the original file with its two description strings reworded; every number is unchanged.

## What the dashboard contains

- A header with the product name, the line "A Capra demo on synthetic data. Not real market figures." and a vacancy snapshot for the three property types.
- A highlights strip of flags computed from the data (anomalies, forecasts, rent growth, pipeline, portfolio). Choosing one refilters the dashboard.
- Filters: time range, property type, market.
- Six KPI tiles (vacancy, net absorption, asking rent, cap rate with its spread to the 10-year Treasury, under construction, sales volume). Each tile carries a "How this number is defined" line.
- A rules-written summary of the current selection.
- "Ask the data": plain-English questions answered by rules in the browser. An answer also refilters the dashboard. Five example questions are offered as buttons.
- Vacancy chart with a four-quarter forecast, an 80% range and a what-if slider.
- Demand against new supply, and cap rate against the 10-year Treasury.
- Market explorer: a tile map and a bubble chart driven by one quarter slider, with a play button.
- A sortable scorecard of 10 markets with a signal for each (unusual move, oversupply risk, softening, tightening, stable).
- Lease rollover risk for a fictional occupier's 26 leases: four tiles, expiries by year, five priority actions and the full lease schedule.
- A definitions section that lists every metric once.

## Files

| File | What it is |
| --- | --- |
| `demo.html` | The HTML fragment. One root element, `<div id="market-pulse" class="mp">`. No doctype, head or body, no top-level page heading (headings start at `h2`), no images, no inline event handlers. |
| `market-pulse.css` | All styles. Every selector starts with `#market-pulse`, so nothing reaches the host page. It sets its own dark background and text colour and looks the same on a light or dark host. |
| `market-pulse-data.js` | The synthetic dataset, assigned to `window.MARKET_PULSE_DATA`. 10 markets, 3 property types, 34 quarters (2018 Q1 to 2026 Q2), and 26 leases. |
| `market-pulse.js` | One self-contained script: number formatting, analytics, SVG charts, the market explorer, the question rules and the page wiring. No dependencies. |
| `README.md` | This file. |

There is no `vendor/` folder. The original drew its charts with its own small SVG code, and that code is what ships here.

## How to include it

Three tags, plus the fragment. Paths are from a page at the site root.

In the page `<head>`:

```html
<link rel="stylesheet" href="assets/demos/market-pulse/market-pulse.css">
```

Where the dashboard should appear, paste the whole contents of `demo.html` (for example inside the page's `.shell` container, under the page's own heading).

Before `</body>`, or in the head with `defer`, in this order:

```html
<script src="assets/demos/market-pulse/market-pulse-data.js" defer></script>
<script src="assets/demos/market-pulse/market-pulse.js" defer></script>
```

Notes for the host page:

- The script mounts on `#market-pulse` once the document is parsed. If the page adds the fragment later with script, call `window.MarketPulse.mount()` afterwards.
- It uses the two font families the site already loads, Red Hat Text and Red Hat Display. It loads no fonts of its own.
- Every id and class inside the fragment starts with `mp-`. The fragment's own links are in-page anchors to ids inside it (`#mp-market`, `#mp-portfolio`, `#mp-definitions`).
- Layout follows the width of `#market-pulse` itself, so it can sit in a full-width band or a narrower column. It works from about 300 px wide. Wide tables scroll inside their own wrappers.
- It honours `prefers-reduced-motion` and the site's `html.motion-off` class, and listens for the site's `capra:motion` event. With motion off there are no transitions, the highlights strip stops and becomes a plain scrolling row, and the time-lapse play button is hidden (the quarter slider still works).
- It makes no network requests and uses no cookies or browser storage. The two "Download CSV" buttons build their files in the browser.

## What was removed from the original

- Every mention of the company the original was prepared for, the "prepared for" byline and the author name.
- The access screen in front of the dashboard and its saved unlock state.
- The optional hosted language model: its settings dialog and key field, the "rewrite the summary" button, the calls to a server and to an outside model service, and the code that built the model prompt. "Ask the data" and the summary now always use the rules engine, and say so.
- The request that loaded the data file, and the check for a companion server.
- The section describing the original's cloud hosting, its production notes and its database view listing.
- The page furniture a host page already has: sticky top bar, marketing hero, footer, favicon and meta tags, and the outside web font.
- The light and dark theme switch and its saved setting. The component keeps one dark look.
- The buttons that exported a chart as an image.
- Rounded corners.

## Where behaviour differs from the original

- KPI tiles sit three across (two, then one, as the container narrows) so each can carry its definition.
- Definitions say only what the code or the data generator does. Two claims in the original's list were dropped because nothing implements them: the rent quoting basis by property type, and cap rate as income divided by price.
- Scorecard: column headings and market names are real buttons, keyboard focus stays put after a sort, and the Signal column sits next to the market name so the flags stay in view when the table scrolls sideways. Three long headings break onto two lines.
- The tile map is ten real buttons on a grid rather than drawn shapes.
- Each chart is one focusable image whose label carries the key figures. Left and right arrows step through the points and Escape closes the readout. The bubble chart is pointer-only; the tile map, the scorecard and the Market menu do the same job from the keyboard.
- Chart readouts are positioned inside the component rather than against the window.
- Five example questions instead of six. "Where is rent growth strongest in retail?" is no longer a button but still works when typed.
- The rules engine's wording was made impersonal ("The dashboard now shows…"), its fallback reply names what it can answer, and it accepts the spelling "prioritise". Typed questions are cut at 300 characters.
- Quarter labels on the column chart read "Q3 '21" rather than "3 '21".
- With motion off, jumps to another section are instant rather than smooth.
- Downloaded files are named `market-pulse-sample-markets.csv` and `market-pulse-sample-leases.csv`.

## About the data

- Market and lease figures come from a seeded generator and are invented. The market names are real places.
- The 10-year Treasury series was typed into the generator as an "illustrative" quarterly path. Its earlier quarters sit close to the published history of that rate, so it is the one series that is not plainly invented. The dashboard says so plainly: the line is based on the published history of the rate, is the one series that is not invented, and is not a live feed (Kris's call, 17 November 2026). Replace it with a made-up path if the page must contain no real-world figures at all.
- Dates are fixed: the data runs to 2026 Q2 and lease terms are measured from 2026-06-30, so the dashboard does not drift with the calendar.

## Browser support

Current Chrome, Edge, Firefox and Safari. The layout relies on CSS container queries (2023 and later browsers). In an older browser the component still mounts but keeps its widest layout.
