/* Market Pulse: a static dashboard demo on synthetic data.
   Mounts on #market-pulse, reads window.MARKET_PULSE_DATA and draws everything in the browser.
   No dependencies, no network requests, no storage.
   Sections: format, analytics, charts, market explorer, rules engine ("Ask the data"), page wiring. */
(function () {
  "use strict";

  function mount() {
    const root = document.getElementById("market-pulse");
    if (!root || root.getAttribute("data-mp-ready")) return false;
    const data = window.MARKET_PULSE_DATA;
    if (!data || !data.series || !data.quarters || !data.portfolio) {
      if (!root.querySelector(".mp-data-missing")) {
        const p = document.createElement("p");
        p.className = "mp-notice mp-data-missing";
        p.textContent = "Market Pulse could not find its sample data, so the dashboard is not shown.";
        const wrap = root.querySelector(".mp-wrap") || root;
        wrap.insertBefore(p, wrap.children[1] || null);
      }
      return false;
    }
    root.setAttribute("data-mp-ready", "1");
    start(root, data);
    return true;
  }

  function start(root, D) {
    const $ = (id) => root.querySelector("#mp-" + id);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const reduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    // Motion is off when the visitor's system asks for less of it or the host page's switch is off.
    const calm = () => !!(reduced && reduced.matches) || document.documentElement.classList.contains("motion-off");
    const scrollToNode = (node) => { if (node) node.scrollIntoView({ behavior: calm() ? "instant" : "smooth", block: "start" }); };

    // ================================================================ format
    const fmt = {
      pct: (v, dp = 1) => (v == null || isNaN(v) ? "–" : `${v.toFixed(dp)}%`),
      pp: (v, dp = 1) => (v == null || isNaN(v) ? "–" : `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(dp)} pp`),
      signedPct: (v, dp = 1) => (v == null || isNaN(v) ? "–" : `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(dp)}%`),
      bps: (v) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(Math.round(v))} bps`,
      num(v, dp = 1) {
        const a = Math.abs(v);
        const sign = v < 0 ? "−" : "";
        if (a >= 1e9) return `${sign}${(a / 1e9).toFixed(a >= 1e10 ? 0 : dp)}B`;
        if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(a >= 1e8 ? 0 : dp)}M`;
        if (a >= 1e3) return `${sign}${(a / 1e3).toFixed(a >= 1e5 ? 0 : dp)}K`;
        return `${sign}${a.toFixed(0)}`;
      },
      sf: (v, dp = 1) => `${fmt.num(v, dp)} sf`,
      signedSf: (v, dp = 1) => `${v > 0 ? "+" : ""}${fmt.num(v, dp)} sf`,
      usd: (v, dp = 1) => (v < 0 ? "−$" : "$") + fmt.num(Math.abs(v), dp),
      rent: (v) => `$${v.toFixed(2)}`,
      int: (v) => Math.round(v).toLocaleString("en-US"),
      axisCompact(v) {
        if (v === 0) return "0";
        return fmt.num(v, Math.abs(v) < 1e6 && Math.abs(v) >= 1e3 ? 0 : (Number.isInteger(v / 1e6) ? 0 : 1));
      },
    };
    const qLabel = (q) => q.replace("Q", " Q");

    // ============================================================= analytics
    // Everything the dashboard and the rules engine say is computed here first.
    const FIELDS = ["inventory_sf", "vacancy_pct", "net_absorption_sf", "deliveries_sf",
      "under_construction_sf", "asking_rent_psf", "cap_rate_pct", "sales_volume_usd"];
    const N = D.quarters.length;
    const marketName = (id) => (id === "ALL" ? "All 10 markets" : D.markets.find((m) => m.id === id).name);
    const raw = (market, type) => D.series[`${market}|${type}`];

    // Aggregate across markets: flows and stocks sum, rates are inventory-weighted.
    const cache = new Map();
    function series(market, type) {
      const key = `${market}|${type}`;
      if (cache.has(key)) return cache.get(key);
      let out;
      if (market !== "ALL") {
        out = raw(market, type);
      } else {
        out = Object.fromEntries(FIELDS.map((f) => [f, new Array(N).fill(0)]));
        for (const m of D.markets) {
          const s = raw(m.id, type);
          for (let i = 0; i < N; i++) {
            const inv = s.inventory_sf[i];
            out.inventory_sf[i] += inv;
            out.net_absorption_sf[i] += s.net_absorption_sf[i];
            out.deliveries_sf[i] += s.deliveries_sf[i];
            out.under_construction_sf[i] += s.under_construction_sf[i];
            out.sales_volume_usd[i] += s.sales_volume_usd[i];
            out.vacancy_pct[i] += s.vacancy_pct[i] * inv;
            out.asking_rent_psf[i] += s.asking_rent_psf[i] * inv;
            out.cap_rate_pct[i] += s.cap_rate_pct[i] * inv;
          }
        }
        for (let i = 0; i < N; i++) {
          const inv = out.inventory_sf[i];
          out.vacancy_pct[i] /= inv;
          out.asking_rent_psf[i] /= inv;
          out.cap_rate_pct[i] /= inv;
        }
      }
      cache.set(key, out);
      return out;
    }

    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const mean = (a) => sum(a) / a.length;
    const std = (a) => { const m = mean(a); return Math.sqrt(sum(a.map((x) => (x - m) ** 2)) / Math.max(1, a.length - 1)); };
    const trailing = (arr, t, k = 4) => sum(arr.slice(Math.max(0, t - k + 1), t + 1));
    const rollingT4 = (arr) => arr.map((_, i) => (i < 3 ? null : trailing(arr, i)));

    // The one place each market metric is calculated.
    function kpis(market, type, t = N - 1) {
      const s = series(market, type);
      const tsy = D.treasury_10y_pct;
      const vac = s.vacancy_pct[t];
      const absT4 = trailing(s.net_absorption_sf, t);
      const absPrevT4 = trailing(s.net_absorption_sf, t - 4);
      const delT4 = trailing(s.deliveries_sf, t);
      const salesT4 = trailing(s.sales_volume_usd, t);
      const salesPrevT4 = trailing(s.sales_volume_usd, t - 4);
      const vacantSf = s.inventory_sf[t] * vac / 100;
      return {
        market, type, quarter: D.quarters[t],
        vacancy: vac,
        vacancyYoY: vac - s.vacancy_pct[t - 4],
        vacancyQoQ: vac - s.vacancy_pct[t - 1],
        absorptionT4: absT4,
        absorptionPrevT4: absPrevT4,
        deliveriesT4: delT4,
        rent: s.asking_rent_psf[t],
        rentYoY: (s.asking_rent_psf[t] / s.asking_rent_psf[t - 4] - 1) * 100,
        cap: s.cap_rate_pct[t],
        capYoYbps: (s.cap_rate_pct[t] - s.cap_rate_pct[t - 4]) * 100,
        treasury: tsy[t],
        spreadBps: (s.cap_rate_pct[t] - tsy[t]) * 100,
        spreadYoYbps: ((s.cap_rate_pct[t] - tsy[t]) - (s.cap_rate_pct[t - 4] - tsy[t - 4])) * 100,
        underConstruction: s.under_construction_sf[t],
        ucPctInventory: s.under_construction_sf[t] / s.inventory_sf[t] * 100,
        inventory: s.inventory_sf[t],
        salesT4: salesT4,
        salesYoY: (salesT4 / salesPrevT4 - 1) * 100,
        monthsOfSupply: absT4 > 0 ? vacantSf / (absT4 / 12) : null,
        supplyDemandRatio: absT4 > 0 ? delT4 / absT4 : null,
      };
    }

    // Damped Holt linear trend. Small, transparent and good enough as a
    // baseline; the interval comes from one-step-ahead residuals.
    function forecast(values, h = 4, { alpha = 0.55, beta = 0.25, phi = 0.85 } = {}) {
      let level = values[0];
      let trend = values[1] - values[0];
      const resid = [];
      for (let i = 1; i < values.length; i++) {
        const pred = level + phi * trend;
        resid.push(values[i] - pred);
        const newLevel = alpha * values[i] + (1 - alpha) * pred;
        trend = beta * (newLevel - level) + (1 - beta) * phi * trend;
        level = newLevel;
      }
      const sigma = std(resid.slice(-16));
      const points = [];
      let damp = 0;
      for (let k = 1; k <= h; k++) {
        damp += Math.pow(phi, k);
        const v = level + damp * trend;
        const w = 1.28 * sigma * Math.sqrt(k); // ~80% interval
        points.push({ value: v, lower: v - w, upper: v + w });
      }
      return points;
    }

    function nextQuarters(last, h) {
      let y = +last.slice(0, 4), q = +last.slice(5);
      const out = [];
      for (let k = 0; k < h; k++) { q++; if (q > 4) { q = 1; y++; } out.push(`${y}Q${q}`); }
      return out;
    }

    function vacancyForecast(market, type) {
      const s = series(market, type);
      return { quarters: nextQuarters(D.quarters[N - 1], 4), points: forecast(s.vacancy_pct, 4) };
    }

    // Flags a recent quarter whose vacancy change is > z standard deviations
    // from that market's own history of quarterly changes.
    function anomalies({ types = D.property_types, lookback = 2, z = 2.5 } = {}) {
      const out = [];
      for (const type of types) {
        for (const m of D.markets) {
          const v = raw(m.id, type).vacancy_pct;
          const d = v.slice(1).map((x, i) => x - v[i]); // d[j] is the change into quarter j+1
          const hist = d.slice(0, N - 1 - lookback);     // history excludes the quarters under test
          const mu = mean(hist), sd = std(hist);
          for (let t = N - lookback; t < N; t++) {
            const delta = v[t] - v[t - 1];
            const score = (delta - mu) / (sd || 1);
            if (Math.abs(score) >= z) out.push({ market: m.id, type, quarter: D.quarters[t], delta, z: score });
          }
        }
      }
      return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    }

    function signal(k, anomaly) {
      if (anomaly) return { level: "warning", label: `Unusual: ${fmt.pp(anomaly.delta)} QoQ` };
      if (k.ucPctInventory > 4 && k.vacancyYoY > 0) return { level: "serious", label: "Oversupply risk" };
      if (k.vacancyYoY >= 0.5) return { level: "serious", label: "Softening" };
      if (k.vacancyYoY <= -0.5) return { level: "good", label: "Tightening" };
      return { level: "neutral", label: "Stable" };
    }

    function scorecard(type) {
      const anoms = anomalies({ types: [type] });
      return D.markets.map((m) => {
        const k = kpis(m.id, type);
        const a = anoms.find((x) => x.market === m.id);
        return { ...k, name: m.name, signal: signal(k, a), anomaly: a || null };
      });
    }

    function rankOf(type, market, metric = "vacancy", asc = true) {
      const rows = scorecard(type).slice().sort((a, b) => (asc ? a[metric] - b[metric] : b[metric] - a[metric]));
      return rows.findIndex((r) => r.market === market) + 1;
    }

    function monthsFromAsOf(months) {
      const d = new Date(D.meta.as_of + "T00:00:00Z");
      d.setUTCMonth(d.getUTCMonth() + Math.round(months));
      return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    }

    let portfolioCache = null;
    function portfolio() {
      if (portfolioCache) return portfolioCache;
      const asOf = new Date(D.meta.as_of + "T00:00:00Z");
      const leases = D.portfolio.map((l) => {
        const exp = new Date(l.expiration + "T00:00:00Z");
        const months = (exp - asOf) / (1000 * 60 * 60 * 24 * 30.4375);
        const k = kpis(l.market, l.property_type);
        const mtmPct = (l.market_rent_psf / l.in_place_rent_psf - 1) * 100;
        const mtmAnnual = (l.market_rent_psf - l.in_place_rent_psf) * l.rentable_sf;
        return { ...l, months, years: months / 12, mtmPct, mtmAnnual, marketVacancy: k.vacancy, marketVacancyYoY: k.vacancyYoY, marketName: marketName(l.market) };
      });
      const totalSf = sum(leases.map((l) => l.rentable_sf));
      const maxSf = Math.max(...leases.map((l) => l.rentable_sf));
      for (const l of leases) {
        const urgency = Math.max(0, 1 - l.months / 36);
        const size = Math.sqrt(l.rentable_sf / maxSf);
        const cost = Math.max(0, l.mtmPct) / 20;
        const tight = Math.max(0, (10 - l.marketVacancy) / 10); // tight markets give tenants less room
        l.score = urgency * (0.45 + 0.25 * size + 0.2 * Math.min(1, cost) + 0.1 * tight);
        l.risk = l.months <= 12 ? { level: "critical", label: "≤ 12 months" }
          : l.months <= 24 ? { level: "serious", label: "12–24 months" }
            : l.months <= 36 ? { level: "warning", label: "24–36 months" }
              : { level: "neutral", label: "36+ months" };
      }
      const exp24 = leases.filter((l) => l.months <= 24);
      const walt = sum(leases.map((l) => l.rentable_sf * l.years)) / totalSf;
      const byYear = {};
      for (const l of leases) {
        const y = l.expiration.slice(0, 4);
        byYear[y] = byYear[y] || { Office: 0, Industrial: 0, Retail: 0 };
        byYear[y][l.property_type] += l.rentable_sf;
      }
      portfolioCache = {
        leases,
        totalSf,
        walt,
        pctExpiring24: sum(exp24.map((l) => l.rentable_sf)) / totalSf * 100,
        count24: exp24.length,
        renewalExposure24: sum(exp24.map((l) => Math.max(0, l.mtmAnnual))),
        mtmTotal: sum(leases.map((l) => l.mtmAnnual)),
        annualRent: sum(leases.map((l) => l.in_place_rent_psf * l.rentable_sf)),
        byYear,
        priorities: leases.slice().sort((a, b) => b.score - a.score).slice(0, 5),
      };
      return portfolioCache;
    }

    function leaseAdvice(l) {
      const soft = l.marketVacancy >= 12 || l.marketVacancyYoY >= 0.5;
      const when = l.months <= 12 ? "Start now" : `Start by ${monthsFromAsOf(Math.max(0, l.months - 18))}`;
      if (l.mtmPct > 5 && !soft) {
        return `${when}. The market is tight (${fmt.pct(l.marketVacancy)} vacancy) and asking rent is ${fmt.signedPct(l.mtmPct, 0)} above the current rent. Budget about ${fmt.usd(l.mtmAnnual)}/yr more, or lock in early with a blend-and-extend.`;
      }
      if (soft) {
        return `${when}. Vacancy is ${fmt.pct(l.marketVacancy)} (${fmt.pp(l.marketVacancyYoY)} YoY), which gives the tenant leverage. Run a competitive alternatives search and push for free rent and TI.`;
      }
      return `${when}. The market is balanced and asking rent is ${fmt.signedPct(l.mtmPct, 0)} vs. the current rent. A standard renewal is likely; benchmark against 2–3 comparable properties.`;
    }

    const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Turns computed KPIs into a short narrative. Rules only, no model.
    function summary(market, type) {
      const k = kpis(market, type);
      const nat = kpis("ALL", type);
      const fc = vacancyForecast(market, type);
      const last = fc.points[fc.points.length - 1];
      const place = market === "ALL" ? `${type} across all 10 markets` : `${marketName(market)} ${type.toLowerCase()}`;
      const dir = k.vacancyYoY <= -0.3 ? "tightening" : k.vacancyYoY >= 0.3 ? "softening" : "holding steady";
      const headline = `${capFirst(place)} is ${dir}: vacancy is ${fmt.pct(k.vacancy)}, ${fmt.pp(k.vacancyYoY)} year over year.`;

      const bullets = [];
      const demandBeat = k.absorptionT4 > k.deliveriesT4;
      bullets.push(`Demand: ${fmt.signedSf(k.absorptionT4)} of net absorption over the last four quarters, against ${fmt.sf(k.deliveriesT4)} of new deliveries. ${demandBeat ? "Demand outpaced new supply." : "New supply outpaced demand."}`);
      bullets.push(`Rents: asking rent is ${fmt.rent(k.rent)}/sf, ${fmt.signedPct(k.rentYoY)} YoY${market !== "ALL" ? ` (the ${type.toLowerCase()} average across all 10 markets is ${fmt.signedPct(nat.rentYoY)})` : ""}.`);
      bullets.push(`Capital markets: the cap rate is ${fmt.pct(k.cap, 2)}, ${Math.round(k.spreadBps)} bps over the 10-year Treasury. The spread is ${k.spreadYoYbps >= 0 ? "wider" : "narrower"} by ${Math.abs(Math.round(k.spreadYoYbps))} bps YoY.`);
      const pipe = k.ucPctInventory > 4 ? "a heavy" : k.ucPctInventory > 1.5 ? "a moderate" : "a light";
      bullets.push(`Pipeline: ${fmt.sf(k.underConstruction)} is under construction (${fmt.pct(k.ucPctInventory)} of inventory), ${pipe} pipeline.`);
      bullets.push(`Outlook: the statistical baseline points to ${fmt.pct(last.value)} vacancy by ${qLabel(fc.quarters[3])} (80% range ${fmt.pct(last.lower)}–${fmt.pct(last.upper)}).`);
      if (market !== "ALL") {
        bullets.push(`Rank: #${rankOf(type, market)} of 10 markets on ${type.toLowerCase()} vacancy (1 = lowest vacancy).`);
      }

      const tenantLeverage = k.vacancy > nat.vacancy + 0.5 || k.vacancyYoY > 0.5;
      const reco = [];
      reco.push(tenantLeverage
        ? "For occupiers: tenants have more leverage here. Push for concessions (free rent, TI) and keep flexibility on term."
        : "For occupiers: the market is tight. Start renewals 18–24 months ahead and consider locking in term early.");
      if (k.ucPctInventory > 4) reco.push("For investors: underwrite slower lease-up, because new supply will compete for tenants over the next 6 quarters.");
      else if (k.vacancyYoY < 0 && k.spreadBps > 250) reco.push("For investors: falling vacancy with a wide spread over Treasuries suggests an attractive entry point.");
      else if (k.vacancyYoY > 0.5) reco.push("For investors: price in further softening and focus on assets with strong tenant credit.");
      else reco.push("For investors: fundamentals are steady; returns will depend on asset selection rather than market direction.");

      return { headline, bullets, reco, kpis: k };
    }

    function marketCsv() {
      const rows = [["quarter", "market", "property_type", ...FIELDS, "treasury_10y_pct"]];
      for (const [key, s] of Object.entries(D.series)) {
        const [m, t] = key.split("|");
        D.quarters.forEach((q, i) => rows.push([q, m, t, ...FIELDS.map((f) => s[f][i]), D.treasury_10y_pct[i]]));
      }
      return rows.map((r) => r.join(",")).join("\n");
    }
    function portfolioCsv() {
      const p = portfolio();
      const head = ["lease_id", "market", "property_type", "rentable_sf", "expiration", "months_remaining", "in_place_rent_psf", "market_rent_psf", "mark_to_market_pct", "mark_to_market_annual_usd", "priority_score"];
      const rows = p.leases.map((l) => [l.lease_id, l.market, l.property_type, l.rentable_sf, l.expiration, l.months.toFixed(1), l.in_place_rent_psf, l.market_rent_psf, l.mtmPct.toFixed(1), Math.round(l.mtmAnnual), l.score.toFixed(3)]);
      return [head, ...rows].map((r) => r.join(",")).join("\n");
    }

    // Definitions, written once and shown on the tiles and in the Definitions section.
    // Each line describes what the code above (or the data generator) actually does.
    const DEFS = {
      vacancy: ["Vacancy rate", "Vacant square feet ÷ inventory square feet. Across markets it is weighted by inventory."],
      absorption: ["Net absorption", "Occupied square feet this quarter minus occupied square feet last quarter. Shown as the sum of the last four quarters."],
      rent: ["Asking rent", "Quoted rent in dollars per square foot per year. Across markets it is weighted by inventory."],
      cap: ["Cap rate and spread", "Cap rate in percent, weighted by inventory across markets. The spread is the cap rate minus the 10-year Treasury yield, in basis points."],
      construction: ["Under construction", "Square feet still being built at quarter end, also shown as a share of inventory."],
      sales: ["Sales volume", "Dollar sales summed over the last four quarters, compared with the four quarters before."],
      deliveries: ["Deliveries", "New space completed in the quarter. Inventory grows by this amount."],
      monthsOfSupply: ["Months of supply", "Vacant square feet ÷ (four-quarter net absorption ÷ 12). How long current vacancy would take to lease at the recent pace. Shown as n/a when demand is zero or negative."],
      treasury: ["10-year Treasury", "Based on the published history of the 10-year Treasury yield. It is the one series here that is not invented, and it is not a live rate feed."],
      signal: ["Signal", "Checked in this order: Unusual move, then Oversupply risk (pipeline above 4% of inventory and vacancy rising), then Softening or Tightening (vacancy up or down 0.5 points or more in a year), otherwise Stable."],
      anomaly: ["Unusual move", "A vacancy change in either of the last two quarters that sits 2.5 or more standard deviations from that market's own history of quarterly changes."],
      forecast: ["Vacancy forecast", "A damped Holt trend model, four quarters ahead. The 80% range comes from the model's last 16 one-quarter-ahead errors and widens with each quarter."],
      whatif: ["What-if slider", "Extra (or lost) demand per year, as a share of inventory, lowers (or raises) forecast vacancy by that share, spread evenly across the four quarters."],
      size: ["Portfolio size", "Rentable square feet across all leases. Rent is in-place rent × square feet, per year."],
      walt: ["WALT", "Weighted average lease term: remaining years on each lease, weighted by square feet."],
      expiring: ["Expiring within 24 months", "Square feet on leases with 24 months or less remaining ÷ total square feet."],
      renewal: ["Renewal cost increase", "(Asking rent − in-place rent) × square feet per year, summed over leases expiring within 24 months. Only increases are counted."],
      mtm: ["Mark-to-market", "(Asking rent − in-place rent) × square feet, per year. Positive means a renewal at today's asking rent would cost more."],
      score: ["Exposure score", "Urgency × (0.45 + 0.25 × size + 0.20 × rent gap + 0.10 × market tightness). Urgency falls from 1 today to 0 at 36 months to expiry."],
    };
    const defText = (key) => DEFS[key][1];

    // ================================================================ charts
    // Small SVG chart kit: line (with crosshair and forecast band), columns
    // (grouped or stacked, negative-aware) and sparklines.
    const NS = "http://www.w3.org/2000/svg";
    function svgEl(name, attrs = {}, style = {}) {
      const node = document.createElementNS(NS, name);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      Object.assign(node.style, style);
      return node;
    }
    // Colours are tokens defined on #market-pulse in the stylesheet.
    const tok = (c) => (c && c.indexOf("--") === 0 ? `var(${c})` : c);

    function niceStep(span, count) {
      const rawStep = span / Math.max(1, count);
      const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const norm = rawStep / mag;
      const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
      return step * mag;
    }

    function niceScale(min, max, count = 5, { zero = false } = {}) {
      if (zero) { min = Math.min(0, min); max = Math.max(0, max); }
      if (min === max) { min -= 1; max += 1; }
      const step = niceStep(max - min, count);
      const lo = Math.floor(min / step) * step;
      const hi = Math.ceil(max / step) * step;
      const ticks = [];
      for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.abs(v) < step / 1e6 ? 0 : v);
      return { lo, hi, ticks };
    }

    // The tooltip sits inside the root and is placed relative to it.
    function showTooltip(evt, title, rows) {
      const tt = $("tooltip");
      tt.replaceChildren();
      const t = document.createElement("div");
      t.className = "mp-tt-title";
      t.textContent = title;
      tt.appendChild(t);
      for (const r of rows) {
        const row = document.createElement("div");
        row.className = "mp-tt-row";
        const key = document.createElement("span");
        key.className = "mp-tt-key";
        const i = document.createElement("i");
        i.style.borderColor = r.color;
        if (r.dashed) i.className = "mp-dashed";
        key.append(i, document.createTextNode(r.name));
        const val = document.createElement("span");
        val.className = "mp-tt-val";
        val.textContent = r.value;
        row.append(key, val);
        tt.appendChild(row);
      }
      tt.style.left = "0px";
      tt.style.top = "0px";
      tt.hidden = false;
      const pad = 14;
      const rb = root.getBoundingClientRect();
      const box = tt.getBoundingClientRect();
      const px = evt.clientX - rb.left, py = evt.clientY - rb.top;
      let x = px + pad;
      let y = py - box.height - pad;
      if (x + box.width > rb.width - 8) x = px - box.width - pad;
      if (y < 8 || evt.clientY - box.height - pad < 8) y = py + pad;
      tt.style.left = Math.max(8, Math.min(x, rb.width - box.width - 8)) + "px";
      tt.style.top = y + "px";
    }
    function hideTooltip() { $("tooltip").hidden = true; }

    function focusVisible(node) {
      try { return node.matches(":focus-visible"); } catch (e) { return true; }
    }

    // Renders now and again whenever the container's width changes. Each chart
    // container is one focusable image: the label carries the key figures and
    // the arrow keys step through the points.
    function observe(container, render) {
      container.__mpRender = render;
      render();
      if (!container.__mpRO && typeof ResizeObserver === "function") {
        let w = container.clientWidth;
        container.__mpRO = new ResizeObserver(() => {
          if (Math.abs(container.clientWidth - w) > 2) { w = container.clientWidth; container.__mpRender(); }
        });
        container.__mpRO.observe(container);
      }
      if (!container.__mpKeys) {
        container.__mpKeys = true;
        container.addEventListener("keydown", (e) => {
          const k = container.__mpKb;
          if (!k) return;
          if (e.key === "ArrowLeft") { k.step(-1); e.preventDefault(); }
          else if (e.key === "ArrowRight") { k.step(1); e.preventDefault(); }
          else if (e.key === "Escape") k.hide();
        });
        container.addEventListener("focus", () => { const k = container.__mpKb; if (k && focusVisible(container)) k.show(); });
        container.addEventListener("blur", () => { const k = container.__mpKb; if (k) k.hide(); });
      }
    }

    function describe(container, label) {
      container.setAttribute("role", "img");
      container.setAttribute("aria-label", label);
      container.tabIndex = 0;
    }

    function xTickIndices(labels, width) {
      // Prefer Q1 positions labeled with the year when labels look like 2024Q1.
      const quarterly = labels.every((l) => /^\d{4}Q[1-4]$/.test(l));
      if (quarterly) {
        const q1 = labels.map((l, i) => (l.endsWith("Q1") ? i : -1)).filter((i) => i >= 0);
        const maxTicks = Math.max(2, Math.floor(width / 56));
        const every = Math.ceil(q1.length / maxTicks);
        return { idx: q1.filter((_, k) => k % every === 0), fmt: (l) => l.slice(0, 4) };
      }
      const maxTicks = Math.max(2, Math.floor(width / 64));
      const every = Math.ceil(labels.length / maxTicks);
      return { idx: labels.map((_, i) => i).filter((i) => i % every === 0), fmt: (l) => l };
    }

    // Linked hover: charts that share a link group mirror each other's hovered label.
    function broadcast(src, label) {
      if (!src.__mpLink) return;
      root.querySelectorAll(".mp-chart").forEach((c) => {
        if (c !== src && c.__mpLink === src.__mpLink && c.__mpHighlight) c.__mpHighlight(label);
      });
    }

    // ------------------------------------------------------------------ line
    function lineChart(container, opts) {
      container.__mpLink = opts.link || null;
      container.__mpAnimate = !!opts.animate && !calm();
      describe(container, opts.ariaLabel || "");
      observe(container, () => renderLine(container, opts));
    }

    function renderLine(container, o) {
      const W = container.clientWidth;
      if (W < 120) return; // not laid out yet; the ResizeObserver renders once it has a width
      const H = container.clientHeight || 280;
      const labels = o.labels;
      const n = labels.length;
      const yFmt = o.yFormat || ((v) => String(v));
      const endLabeled = o.series.filter((s) => s.endLabel);
      const m = { t: 12, r: endLabeled.length ? 64 : 12, b: 26, l: 44 };

      const vals = [];
      for (const s of o.series) for (const v of s.values) if (v != null) vals.push(v);
      if (o.band) for (const v of [...o.band.lower, ...o.band.upper]) if (v != null) vals.push(v);
      const sc = niceScale(Math.min(...vals), Math.max(...vals), 5, { zero: !!o.zero });
      const x = (i) => m.l + (n === 1 ? 0 : (i / (n - 1)) * (W - m.l - m.r));
      const y = (v) => m.t + (1 - (v - sc.lo) / (sc.hi - sc.lo)) * (H - m.t - m.b);

      const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });

      if (o.shadeFrom != null) {
        svg.appendChild(svgEl("rect", { x: x(o.shadeFrom), y: m.t, width: x(n - 1) - x(o.shadeFrom), height: H - m.t - m.b }, { fill: "var(--mp-surface-2)" }));
        const t = svgEl("text", { x: x(o.shadeFrom) + 6, y: m.t + 12, class: "mp-axis-text" });
        t.textContent = o.shadeLabel || "Forecast";
        svg.appendChild(t);
      }

      for (const tv of sc.ticks) {
        svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: Math.round(y(tv)) + 0.5, y2: Math.round(y(tv)) + 0.5, class: tv === 0 && sc.lo < 0 ? "mp-baseline" : "mp-gridline" }));
        const t = svgEl("text", { x: m.l - 8, y: y(tv) + 4, "text-anchor": "end", class: "mp-axis-text" });
        t.textContent = yFmt(tv, true);
        svg.appendChild(t);
      }
      const xt = xTickIndices(labels, W - m.l - m.r);
      for (const i of xt.idx) {
        const t = svgEl("text", { x: x(i), y: H - 8, "text-anchor": "middle", class: "mp-axis-text" });
        t.textContent = xt.fmt(labels[i]);
        svg.appendChild(t);
      }

      if (o.band) {
        const pts = [];
        for (let i = 0; i < n; i++) if (o.band.upper[i] != null) pts.push(i);
        if (pts.length) {
          let d = pts.map((i, k) => `${k ? "L" : "M"}${x(i)},${y(o.band.upper[i])}`).join("");
          d += pts.slice().reverse().map((i) => `L${x(i)},${y(o.band.lower[i])}`).join("") + "Z";
          svg.appendChild(svgEl("path", { d, class: "mp-anim-fade" }, { fill: tok(o.band.color), opacity: 0.16 }));
        }
      }

      for (const s of o.series) {
        let d = "";
        let pen = false;
        s.values.forEach((v, i) => {
          if (v == null) { pen = false; return; }
          d += `${pen ? "L" : "M"}${x(i)},${y(v)}`;
          pen = true;
        });
        const attrs = { d, fill: "none", "stroke-width": s.width || 2, "stroke-linejoin": "round", "stroke-linecap": "round", class: s.dashed ? "mp-anim-fade" : "mp-anim-draw" };
        if (s.dashed) attrs["stroke-dasharray"] = "5 4";
        svg.appendChild(svgEl("path", attrs, { stroke: tok(s.color) }));
      }

      // Callouts: a ring on the point and a short label above it.
      for (const a of o.annotations || []) {
        const v = o.series[0].values[a.index];
        if (v == null) continue;
        const cx = x(a.index), cy = y(v);
        const g = svgEl("g", { class: "mp-anim-fade" });
        g.appendChild(svgEl("circle", { cx, cy, r: 7, fill: "none", "stroke-width": 1.5 }, { stroke: "var(--mp-text)" }));
        const above = cy - 34 > m.t;
        const ty = above ? cy - 22 : cy + 30;
        g.appendChild(svgEl("line", { x1: cx, x2: cx, y1: above ? cy - 8 : cy + 8, y2: above ? ty + 4 : ty - 12, "stroke-width": 1 }, { stroke: "var(--mp-text)" }));
        const w = a.text.length * 6.6 + 14;
        const lx = Math.max(m.l, Math.min(W - m.r - w, cx - w / 2));
        g.appendChild(svgEl("rect", { x: lx, y: ty - 13, width: w, height: 19 }, { fill: "var(--mp-text)" }));
        const t = svgEl("text", { x: lx + w / 2, y: ty + 1, "text-anchor": "middle", class: "mp-annotation-text" });
        t.textContent = a.text;
        g.appendChild(t);
        svg.appendChild(g);
      }

      // End markers and selective end labels.
      const placed = [];
      for (const s of o.series) {
        if (!s.endLabel) continue;
        let li = -1;
        for (let i = n - 1; i >= 0; i--) if (s.values[i] != null) { li = i; break; }
        if (li < 0) continue;
        svg.appendChild(svgEl("circle", { cx: x(li), cy: y(s.values[li]), r: 4, "stroke-width": 2 }, { fill: tok(s.color), stroke: "var(--mp-surface-1)" }));
        const ly = y(s.values[li]) + 4;
        if (placed.some((p) => Math.abs(p - ly) < 14)) continue; // converging: legend and tooltip carry it
        placed.push(ly);
        const t = svgEl("text", { x: x(li) + 9, y: ly, class: "mp-end-label" });
        t.textContent = yFmt(s.values[li]);
        svg.appendChild(t);
      }

      // Crosshair layer.
      const cross = svgEl("line", { y1: m.t, y2: H - m.b, class: "mp-crosshair", visibility: "hidden" });
      svg.appendChild(cross);
      const dots = o.series.map((s) => {
        const d = svgEl("circle", { r: 4, "stroke-width": 2, visibility: "hidden" }, { fill: tok(s.color), stroke: "var(--mp-surface-1)" });
        svg.appendChild(d);
        return d;
      });
      const hit = svgEl("rect", { x: m.l - 6, y: 0, width: W - m.l - m.r + 12, height: H, fill: "transparent" });
      svg.appendChild(hit);
      // Value tag shown when another chart drives the hover (linked mode).
      const tag = svgEl("g", { visibility: "hidden" });
      const tagBg = svgEl("rect", { height: 18 }, { fill: "var(--mp-text)" });
      const tagText = svgEl("text", { class: "mp-annotation-text", "text-anchor": "middle" });
      tag.append(tagBg, tagText);
      svg.appendChild(tag);
      let cur = n - 1;
      const place = (i) => {
        cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
        cross.setAttribute("visibility", "visible");
        const rows = [];
        o.series.forEach((s, k) => {
          const v = s.values[i];
          if (v == null) { dots[k].setAttribute("visibility", "hidden"); return; }
          dots[k].setAttribute("cx", x(i)); dots[k].setAttribute("cy", y(v));
          dots[k].setAttribute("visibility", "visible");
          rows.push({ name: s.name, value: yFmt(v), color: tok(s.color), dashed: s.dashed });
        });
        return rows;
      };
      const hideMarks = () => {
        cross.setAttribute("visibility", "hidden");
        dots.forEach((d) => d.setAttribute("visibility", "hidden"));
        tag.setAttribute("visibility", "hidden");
      };
      container.__mpHighlight = (label) => {
        const i = label == null ? -1 : labels.indexOf(label);
        if (i < 0) { hideMarks(); return; }
        place(i);
        const v = o.series[0].values[i];
        if (v == null) { tag.setAttribute("visibility", "hidden"); return; }
        tagText.textContent = yFmt(v);
        const w = tagText.textContent.length * 6.8 + 12;
        const tx = Math.min(W - m.r - w / 2, Math.max(m.l + w / 2, x(i)));
        const ty = Math.max(m.t + 14, y(v) - 16);
        tagBg.setAttribute("x", tx - w / 2); tagBg.setAttribute("y", ty - 13); tagBg.setAttribute("width", w);
        tagText.setAttribute("x", tx); tagText.setAttribute("y", ty);
        tag.setAttribute("visibility", "visible");
      };
      const show = (i, evt) => {
        cur = i;
        tag.setAttribute("visibility", "hidden");
        const rows = place(i);
        broadcast(container, labels[i]);
        if (o.band && o.band.upper[i] != null) {
          rows.push({ name: o.band.name || "Range", value: `${yFmt(o.band.lower[i])} – ${yFmt(o.band.upper[i])}`, color: tok(o.band.color) });
        }
        const box = svg.getBoundingClientRect();
        const first = o.series[0].values[i];
        const e = evt || { clientX: box.left + x(i), clientY: box.top + y(first == null ? sc.lo : first) };
        showTooltip(e, o.tooltipTitle ? o.tooltipTitle(labels[i]) : labels[i], rows);
      };
      const hide = () => {
        hideMarks();
        hideTooltip();
        broadcast(container, null);
      };
      const fromPointer = (evt) => {
        const box = svg.getBoundingClientRect();
        const px = evt.clientX - box.left;
        const i = Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / (W - m.l - m.r)) * (n - 1))));
        show(i, evt);
      };
      hit.addEventListener("pointermove", fromPointer);
      hit.addEventListener("pointerdown", fromPointer);
      hit.addEventListener("pointerleave", (evt) => { if (evt.pointerType === "mouse") hide(); });
      container.__mpKb = {
        show: () => show(cur),
        step: (d) => show(Math.max(0, Math.min(n - 1, cur + d))),
        hide,
      };

      container.replaceChildren(svg);
      if (container.__mpAnimate) {
        container.__mpAnimate = false;
        svg.querySelectorAll(".mp-anim-draw").forEach((p) => {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len} ${len}`;
          p.style.strokeDashoffset = len;
          p.getBoundingClientRect();
          p.style.transition = "stroke-dashoffset 900ms cubic-bezier(.3,.7,.2,1)";
          p.style.strokeDashoffset = 0;
          p.addEventListener("transitionend", () => { p.style.strokeDasharray = ""; }, { once: true });
        });
        svg.classList.add("mp-fade-late");
      }
    }

    // --------------------------------------------------------------- columns
    function columnChart(container, opts) {
      container.__mpLink = opts.link || null;
      container.__mpAnimate = !!opts.animate && !calm();
      describe(container, opts.ariaLabel || "");
      observe(container, () => renderColumns(container, opts));
    }

    // y0 = baseline side, y1 = data end. Square ends.
    function barPath(x, y0, y1, w) {
      const top = Math.min(y0, y1);
      const h = Math.max(Math.abs(y1 - y0), 0.5);
      return `M${x},${top}h${w}v${h}h${-w}Z`;
    }

    function renderColumns(container, o) {
      const W = container.clientWidth;
      if (W < 120) return; // not laid out yet; the ResizeObserver renders once it has a width
      const H = container.clientHeight || 260;
      const labels = o.labels;
      const n = labels.length;
      const yFmt = o.yFormat || ((v) => String(v));
      const m = { t: 14, r: 8, b: 26, l: 48 };
      const S = o.series.length;

      let lo = 0, hi = 0;
      for (let i = 0; i < n; i++) {
        if (o.stacked) {
          let pos = 0, neg = 0;
          for (const s of o.series) { const v = s.values[i] || 0; if (v >= 0) pos += v; else neg += v; }
          hi = Math.max(hi, pos); lo = Math.min(lo, neg);
        } else {
          for (const s of o.series) { const v = s.values[i] || 0; hi = Math.max(hi, v); lo = Math.min(lo, v); }
        }
      }
      const sc = niceScale(lo, hi, 5, { zero: true });
      const y = (v) => m.t + (1 - (v - sc.lo) / (sc.hi - sc.lo)) * (H - m.t - m.b);
      const band = (W - m.l - m.r) / n;
      const groupW = o.stacked ? Math.min(24, band * 0.6) : Math.min(24 * S + 2 * (S - 1), band * 0.72);
      const barW = o.stacked ? groupW : Math.max(2, (groupW - 2 * (S - 1)) / S);
      const bx = (i) => m.l + band * i + (band - groupW) / 2;

      const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });
      for (const tv of sc.ticks) {
        svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: Math.round(y(tv)) + 0.5, y2: Math.round(y(tv)) + 0.5, class: tv === 0 ? "mp-baseline" : "mp-gridline" }));
        const t = svgEl("text", { x: m.l - 8, y: y(tv) + 4, "text-anchor": "end", class: "mp-axis-text" });
        t.textContent = yFmt(tv, true);
        svg.appendChild(t);
      }
      const quarterly = labels.every((l) => /^\d{4}Q[1-4]$/.test(l));
      const every = Math.ceil(n / Math.max(2, Math.floor((W - m.l - m.r) / (quarterly ? 52 : 44))));
      labels.forEach((l, i) => {
        if (i % every !== 0 && i !== n - 1) return;
        if (i === n - 1 && i % every !== 0 && (n - 1) % every < every / 2) return;
        const t = svgEl("text", { x: m.l + band * i + band / 2, y: H - 8, "text-anchor": "middle", class: "mp-axis-text" });
        t.textContent = quarterly ? `${l.slice(4)} '${l.slice(2, 4)}` : l;
        svg.appendChild(t);
      });

      const hl = svgEl("rect", { y: m.t, height: H - m.t - m.b, width: band, visibility: "hidden" }, { fill: "var(--mp-surface-2)" });
      svg.appendChild(hl);
      const markBand = (i) => {
        if (i < 0) { hl.setAttribute("visibility", "hidden"); return; }
        hl.setAttribute("x", m.l + band * i);
        hl.setAttribute("visibility", "visible");
      };
      container.__mpHighlight = (label) => markBand(label == null ? -1 : labels.indexOf(label));
      const groups = [];
      for (let i = 0; i < n; i++) {
        const g = svgEl("g");
        if (o.stacked) {
          let pos = 0, neg = 0;
          const segs = o.series.map((s) => s.values[i] || 0);
          const lastPos = segs.map((v, k) => (v > 0 ? k : -1)).filter((k) => k >= 0).pop();
          o.series.forEach((s, k) => {
            const v = segs[k];
            if (!v) return;
            const base = v >= 0 ? pos : neg;
            const end = base + v;
            if (v >= 0) pos = end; else neg = end;
            const gapTop = v >= 0 ? (base === 0 ? 0 : 1) : 0;
            const y0 = y(base) - (v >= 0 ? gapTop : -gapTop);
            let y1 = y(end) + (v >= 0 && k !== lastPos ? 1 : 0);
            if (Math.abs(y1 - y0) < 0.5) y1 = y0 - 0.5;
            g.appendChild(svgEl("path", { d: barPath(bx(i), y0, y1, barW), class: "mp-bar" }, { fill: tok(s.color), transformOrigin: v >= 0 ? "50% 100%" : "50% 0%", animationDelay: `${i * 18}ms` }));
          });
        } else {
          o.series.forEach((s, k) => {
            const v = s.values[i];
            if (v == null) return;
            g.appendChild(svgEl("path", { d: barPath(bx(i) + k * (barW + 2), y(0), y(v), barW), class: "mp-bar" }, { fill: tok(s.color), transformOrigin: v >= 0 ? "50% 100%" : "50% 0%", animationDelay: `${i * 18}ms` }));
          });
        }
        svg.appendChild(g);
        groups.push(g);
      }

      let cur = n - 1;
      const rowsFor = (i) => {
        const r = o.series.map((s) => ({ name: s.name, value: s.values[i] == null ? "–" : yFmt(s.values[i]), color: tok(s.color) }));
        if (o.stacked && o.totalLabel) {
          const tot = o.series.reduce((a, s) => a + (s.values[i] || 0), 0);
          r.push({ name: o.totalLabel, value: yFmt(tot), color: "transparent" });
        }
        return r;
      };
      const on = (i, evt) => {
        cur = i;
        groups.forEach((g, k) => g.querySelectorAll(".mp-bar").forEach((b) => b.classList.toggle("mp-hover", k === i)));
        const box = svg.getBoundingClientRect();
        const e = evt && evt.clientX != null ? evt : { clientX: box.left + m.l + band * i + band / 2, clientY: box.top + m.t + 20 };
        showTooltip(e, o.tooltipTitle ? o.tooltipTitle(labels[i]) : labels[i], rowsFor(i));
        markBand(i);
        broadcast(container, labels[i]);
      };
      const off = () => {
        svg.querySelectorAll(".mp-bar.mp-hover").forEach((b) => b.classList.remove("mp-hover"));
        hideTooltip();
        markBand(-1);
        broadcast(container, null);
      };
      // One hit band per category, wider than the marks.
      labels.forEach((l, i) => {
        const hit = svgEl("rect", { x: m.l + band * i, y: m.t, width: band, height: H - m.t - m.b, fill: "transparent" });
        hit.addEventListener("pointermove", (evt) => on(i, evt));
        hit.addEventListener("pointerdown", (evt) => on(i, evt));
        hit.addEventListener("pointerleave", (evt) => { if (evt.pointerType === "mouse") off(); });
        svg.appendChild(hit);
      });
      container.__mpKb = {
        show: () => on(cur),
        step: (d) => on(Math.max(0, Math.min(n - 1, cur + d))),
        hide: off,
      };

      container.replaceChildren(svg);
      if (container.__mpAnimate) {
        container.__mpAnimate = false;
        svg.classList.add("mp-grow-bars");
        setTimeout(() => svg.classList.remove("mp-grow-bars"), 1400);
      }
    }

    // ------------------------------------------------------------- sparkline
    function spark(values, { color = "--mp-s1", w = 160, h = 28 } = {}) {
      const svg = svgEl("svg", { class: "mp-spark", viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" });
      const v = values.filter((x) => x != null);
      if (v.length < 2) return svg;
      const lo = Math.min(...v), hi = Math.max(...v);
      const x = (i) => 3 + (i / (values.length - 1)) * (w - 6);
      const y = (val) => 3 + (1 - (val - lo) / (hi - lo || 1)) * (h - 6);
      let d = "", pen = false;
      values.forEach((val, i) => {
        if (val == null) { pen = false; return; }
        d += `${pen ? "L" : "M"}${x(i)},${y(val)}`;
        pen = true;
      });
      svg.appendChild(svgEl("path", { d, fill: "none", "stroke-width": 1.5, "vector-effect": "non-scaling-stroke", "stroke-linejoin": "round" }, { stroke: "var(--mp-muted)" }));
      const last = values.length - 1;
      if (values[last] != null && values[last - 1] != null) {
        svg.appendChild(svgEl("path", { d: `M${x(last - 1)},${y(values[last - 1])}L${x(last)},${y(values[last])}`, fill: "none", "stroke-width": 2, "vector-effect": "non-scaling-stroke" }, { stroke: tok(color) }));
      }
      return svg;
    }

    function legend(container, items) {
      container.replaceChildren();
      for (const it of items) {
        const s = document.createElement("span");
        let k;
        if (it.kind === "rect" || it.kind === "band") {
          k = document.createElement("i");
          k.className = it.kind === "rect" ? "mp-key-rect" : "mp-key-band";
          k.style.background = tok(it.color);
          if (it.kind === "band") k.style.opacity = 0.3;
        } else {
          // Line keys mirror the mark: a short stroke, dashed when the series is.
          k = svgEl("svg", { width: 18, height: 4, viewBox: "0 0 18 4", "aria-hidden": "true", focusable: "false" });
          const attrs = { x1: 1, x2: 17, y1: 2, y2: 2, "stroke-width": 2 };
          if (it.dashed) attrs["stroke-dasharray"] = "4 3";
          k.appendChild(svgEl("line", attrs, { stroke: tok(it.color) }));
        }
        s.append(k, document.createTextNode(it.name));
        container.appendChild(s);
      }
    }

    // ======================================================= market explorer
    // A tile map of the 10 markets coloured by vacancy and a vacancy-vs-rent-growth
    // bubble chart, both driven by one quarter slider with a play button.
    const Explorer = (function () {
      // Rough geographic layout on a 6 x 4 grid (col, row).
      const GRID = { SEA: [0, 0], BOS: [5, 0], DEN: [1, 1], CHI: [3, 1], NYC: [4, 1],
        LAX: [0, 2], PHX: [1, 2], ATL: [3, 2], DFW: [2, 3], MIA: [4, 3] };
      // Sequential blue ramp, light to dark.
      const RAMP = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];

      const ctx = { type: null, market: "ALL", t: 0, onSelect: () => {}, dom: null };
      let timer = null;
      const map = { tiles: new Map() };
      const bub = { dots: new Map(), built: false };

      const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      function rampColor(f) {
        const x = Math.max(0, Math.min(1, f)) * (RAMP.length - 1);
        const i = Math.min(RAMP.length - 2, Math.floor(x));
        const a = hex(RAMP[i]), b = hex(RAMP[i + 1]), k = x - i;
        const c = a.map((v, j) => Math.round(v + (b[j] - v) * k));
        return { css: `rgb(${c.join(",")})`, light: (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 > 0.55 };
      }

      const first = () => 4; // first quarter with a year-over-year comparison
      const last = () => N - 1;
      const label = (i) => qLabel(D.quarters[i]);

      function point(m, t) {
        const s = series(m, ctx.type);
        return {
          vacancy: s.vacancy_pct[t],
          vacYoY: s.vacancy_pct[t] - s.vacancy_pct[t - 4],
          rentYoY: (s.asking_rent_psf[t] / s.asking_rent_psf[t - 4] - 1) * 100,
          inventory: s.inventory_sf[t],
        };
      }

      function domains() {
        const vs = [], rs = [], inv = [];
        for (const m of D.markets) {
          for (let t = first(); t <= last(); t++) {
            const p = point(m.id, t);
            vs.push(p.vacancy); rs.push(p.rentYoY); inv.push(p.inventory);
          }
        }
        return { vMin: Math.min(...vs), vMax: Math.max(...vs), rMin: Math.min(...rs), rMax: Math.max(...rs), invMax: Math.max(...inv) };
      }

      function tooltipFor(evt, m) {
        const p = point(m, ctx.t);
        showTooltip(evt, `${marketName(m)} · ${label(ctx.t)}`, [
          { name: "Vacancy", value: fmt.pct(p.vacancy), color: "transparent" },
          { name: "Change YoY", value: fmt.pp(p.vacYoY), color: "transparent" },
          { name: "Rent growth YoY", value: fmt.signedPct(p.rentYoY), color: "transparent" },
          { name: "Inventory", value: fmt.sf(p.inventory), color: "transparent" },
        ]);
      }

      // ---------------------------------------------------------------- map
      // Real buttons on a CSS grid, in reading order.
      function buildMap() {
        const box = $("ex-map");
        map.tiles.clear();
        const order = D.markets.slice().sort((a, b) => GRID[a.id][1] - GRID[b.id][1] || GRID[a.id][0] - GRID[b.id][0]);
        const nodes = order.map((m) => {
          const [c, r] = GRID[m.id];
          const b = document.createElement("button");
          b.type = "button";
          b.className = "mp-tile";
          b.style.gridColumn = String(c + 1);
          b.style.gridRow = String(r + 1);
          const code = document.createElement("span"); code.className = "mp-tile-code"; code.textContent = m.id;
          const val = document.createElement("span"); val.className = "mp-tile-val";
          b.append(code, val);
          b.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") tooltipFor(e, m.id); });
          b.addEventListener("pointerleave", hideTooltip);
          b.addEventListener("focus", () => { if (focusVisible(b)) { const q = b.getBoundingClientRect(); tooltipFor({ clientX: q.right, clientY: q.top }, m.id); } });
          b.addEventListener("blur", hideTooltip);
          b.addEventListener("click", () => ctx.onSelect(m.id));
          map.tiles.set(m.id, { b, val });
          return b;
        });
        box.replaceChildren(...nodes);
      }

      function updateMap() {
        const d = ctx.dom;
        for (const [m, t] of map.tiles) {
          const p = point(m, ctx.t);
          const c = rampColor((p.vacancy - d.vMin) / (d.vMax - d.vMin));
          t.b.style.backgroundColor = c.css;
          t.b.style.color = c.light ? "#0f1a3d" : "#ffffff";
          t.val.textContent = fmt.pct(p.vacancy);
          const sel = ctx.market === m;
          t.b.classList.toggle("mp-sel", sel);
          t.b.setAttribute("aria-pressed", String(sel));
          t.b.setAttribute("aria-label", `${marketName(m)}: ${fmt.pct(p.vacancy)} ${ctx.type.toLowerCase()} vacancy in ${label(ctx.t)}. Focus the dashboard on this market.`);
        }
      }

      function buildRamp() {
        const d = ctx.dom;
        const lo = document.createElement("span"); lo.textContent = fmt.pct(d.vMin);
        const hi = document.createElement("span"); hi.textContent = fmt.pct(d.vMax);
        const steps = document.createElement("span"); steps.className = "mp-ramp-steps";
        for (const c of RAMP) { const i = document.createElement("i"); i.style.backgroundColor = c; steps.appendChild(i); }
        $("ex-ramp").replaceChildren(lo, steps, hi);
      }

      // ------------------------------------------------------------- bubble
      function buildBubble() {
        const box = $("ex-bubble");
        const W = box.clientWidth, H = box.clientHeight || 320;
        if (W < 120) { bub.built = false; return false; }
        const m = { t: 10, r: 16, b: 34, l: 46 };
        const d = ctx.dom;
        const xs = niceScale(d.vMin, d.vMax, 5);
        const ys = niceScale(d.rMin, d.rMax, 5);
        const x = (v) => m.l + (v - xs.lo) / (xs.hi - xs.lo) * (W - m.l - m.r);
        const y = (v) => m.t + (1 - (v - ys.lo) / (ys.hi - ys.lo)) * (H - m.t - m.b);
        Object.assign(bub, { x, y, m, W, H });
        const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });
        for (const tv of ys.ticks) {
          svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: Math.round(y(tv)) + 0.5, y2: Math.round(y(tv)) + 0.5, class: tv === 0 ? "mp-baseline" : "mp-gridline" }));
          const t = svgEl("text", { x: m.l - 8, y: y(tv) + 4, "text-anchor": "end", class: "mp-axis-text" });
          t.textContent = `${+tv.toFixed(1)}%`;
          svg.appendChild(t);
        }
        const everyX = Math.ceil(xs.ticks.length / Math.max(2, Math.floor((W - m.l - m.r) / 48)));
        xs.ticks.forEach((tv, i) => {
          if (i % everyX !== 0) return;
          const t = svgEl("text", { x: x(tv), y: H - 18, "text-anchor": "middle", class: "mp-axis-text" });
          t.textContent = `${+tv.toFixed(1)}%`;
          svg.appendChild(t);
        });
        const xt = svgEl("text", { x: W - m.r, y: H - 3, "text-anchor": "end", class: "mp-axis-title" });
        xt.textContent = "Vacancy rate →";
        const yt = svgEl("text", { x: m.l + 4, y: m.t + 12, class: "mp-axis-title" });
        yt.textContent = "↑ Rent growth YoY";
        const q1 = svgEl("text", { x: m.l + 4, y: m.t + 28, class: "mp-quadrant" });
        q1.textContent = "Landlord-favorable";
        const q2 = svgEl("text", { x: W - m.r - 4, y: H - m.b - 8, "text-anchor": "end", class: "mp-quadrant" });
        q2.textContent = "Tenant-favorable";
        svg.append(xt, yt, q1, q2);

        bub.vline = svgEl("line", { y1: m.t, y2: H - m.b, class: "mp-avg-line" });
        bub.hline = svgEl("line", { x1: m.l, x2: W - m.r, class: "mp-avg-line" });
        bub.trail = svgEl("path", { fill: "none", "stroke-width": 1.5, "stroke-linejoin": "round", class: "mp-trail" });
        svg.append(bub.vline, bub.hline, bub.trail);

        bub.dots.clear();
        const order = D.markets.slice().sort((a, b) => point(b.id, last()).inventory - point(a.id, last()).inventory);
        for (const mk of order) { // biggest first so small bubbles sit on top
          const g = svgEl("g", { class: "mp-bub" });
          const c = svgEl("circle", { r: 6, "stroke-width": 2, class: "mp-bub-dot" });
          const text = svgEl("text", { class: "mp-bub-label", y: 4 });
          text.textContent = mk.id;
          g.append(c, text);
          // Pointer shortcut only. The tile map, the scorecard and the Market menu do the same from the keyboard.
          g.addEventListener("pointermove", (e) => tooltipFor(e, mk.id));
          g.addEventListener("pointerdown", (e) => tooltipFor(e, mk.id));
          g.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTooltip(); });
          g.addEventListener("click", () => ctx.onSelect(mk.id));
          svg.appendChild(g);
          bub.dots.set(mk.id, { g, c, label: text });
        }
        box.replaceChildren(svg);
        bub.built = true;
        // Turn on movement only after the first placement, so bubbles don't fly in from the corner.
        requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add("mp-ready")));
        return true;
      }

      function updateBubble() {
        if (!bub.built) return;
        const { x, y } = bub;
        const d = ctx.dom;
        const all = point("ALL", ctx.t);
        bub.vline.setAttribute("x1", x(all.vacancy)); bub.vline.setAttribute("x2", x(all.vacancy));
        bub.hline.setAttribute("y1", y(all.rentYoY)); bub.hline.setAttribute("y2", y(all.rentYoY));
        for (const [m, o] of bub.dots) {
          const p = point(m, ctx.t);
          const r = 5 + 13 * Math.sqrt(p.inventory / d.invMax);
          const sel = ctx.market === m;
          o.g.style.transform = `translate(${x(p.vacancy)}px, ${y(p.rentYoY)}px)`;
          o.c.setAttribute("r", r.toFixed(1));
          o.c.style.fill = tok(sel ? "--mp-s2" : "--mp-s1");
          o.c.style.fillOpacity = sel ? 1 : 0.72;
          o.label.setAttribute("x", (r + 4).toFixed(1));
          o.label.classList.toggle("mp-sel", sel);
          if (sel) o.g.parentNode.appendChild(o.g); // draw the selected market on top
        }
        placeLabels();
        if (ctx.market !== "ALL") {
          const pts = [];
          for (let t = first(); t <= ctx.t; t++) { const p = point(ctx.market, t); pts.push(`${x(p.vacancy)},${y(p.rentYoY)}`); }
          bub.trail.setAttribute("d", pts.length > 1 ? "M" + pts.join("L") : "");
          bub.trail.style.stroke = tok("--mp-s2");
        } else {
          bub.trail.setAttribute("d", "");
        }
      }

      // Show a market code only where it doesn't collide with one already
      // placed. The selected market is placed first, then larger markets.
      function placeLabels() {
        const boxes = [];
        const order = [...bub.dots.keys()].sort((a, b) => (b === ctx.market) - (a === ctx.market) || point(b, ctx.t).inventory - point(a, ctx.t).inventory);
        for (const m of order) {
          const o = bub.dots.get(m);
          const p = point(m, ctx.t);
          const r = +o.c.getAttribute("r");
          const bx = bub.x(p.vacancy) + r + 4, by = bub.y(p.rentYoY) - 6;
          const box = { x0: bx, x1: bx + m.length * 7.5, y0: by, y1: by + 12 };
          const hit = boxes.some((q) => box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0) || box.x1 > bub.W;
          o.label.style.opacity = hit ? 0 : 1;
          if (!hit) boxes.push(box);
        }
      }

      // The bubble chart's text alternative, rewritten for each quarter.
      function describeBubble() {
        const rows = D.markets.map((m) => ({ name: m.name, ...point(m.id, ctx.t) }));
        const byVac = rows.slice().sort((a, b) => a.vacancy - b.vacancy);
        const byRent = rows.slice().sort((a, b) => b.rentYoY - a.rentYoY);
        const all = point("ALL", ctx.t);
        const box = $("ex-bubble");
        box.setAttribute("role", "img");
        box.setAttribute("aria-label", `Vacancy against rent growth for 10 markets, ${ctx.type.toLowerCase()}, ${label(ctx.t)}. `
          + `Lowest vacancy: ${byVac[0].name} at ${fmt.pct(byVac[0].vacancy)}. Highest vacancy: ${byVac[byVac.length - 1].name} at ${fmt.pct(byVac[byVac.length - 1].vacancy)}. `
          + `Fastest rent growth: ${byRent[0].name} at ${fmt.signedPct(byRent[0].rentYoY)}. Slowest: ${byRent[byRent.length - 1].name} at ${fmt.signedPct(byRent[byRent.length - 1].rentYoY)}. `
          + `All-market average: ${fmt.pct(all.vacancy)} vacancy and ${fmt.signedPct(all.rentYoY)} rent growth.`);
      }

      // ----------------------------------------------------------- controls
      function update() {
        const sl = $("ex-slider");
        sl.value = String(ctx.t);
        sl.setAttribute("aria-valuetext", label(ctx.t));
        $("ex-quarter").textContent = label(ctx.t);
        updateMap();
        updateBubble();
        describeBubble();
      }

      function setT(t) { ctx.t = Math.max(first(), Math.min(last(), t)); update(); }

      function stop() {
        if (timer) clearInterval(timer);
        timer = null;
        $("ex-play").classList.remove("mp-playing");
        $("ex-play").setAttribute("aria-label", "Play the time-lapse");
      }
      function play() {
        if (calm()) return;
        if (ctx.t >= last()) setT(first());
        $("ex-play").classList.add("mp-playing");
        $("ex-play").setAttribute("aria-label", "Pause the time-lapse");
        timer = setInterval(() => { if (calm() || ctx.t >= last()) stop(); else setT(ctx.t + 1); }, 420);
      }

      function rebuild() {
        ctx.dom = domains();
        buildMap();
        buildRamp();
        buildBubble();
        update();
      }

      function init({ onSelect }) {
        ctx.onSelect = onSelect;
        ctx.t = last();
        const sl = $("ex-slider");
        sl.min = String(first()); sl.max = String(last()); sl.value = String(last());
        sl.addEventListener("input", () => { stop(); setT(+sl.value); });
        $("ex-play").addEventListener("click", () => (timer ? stop() : play()));
        if (typeof ResizeObserver === "function") {
          let w = $("ex-bubble").clientWidth;
          new ResizeObserver(() => {
            const nw = $("ex-bubble").clientWidth;
            if (Math.abs(nw - w) > 2 && ctx.type) { w = nw; if (buildBubble()) updateBubble(); }
          }).observe($("ex-bubble"));
        }
      }

      function render({ type, market }) {
        const typeChanged = type !== ctx.type;
        ctx.type = type;
        ctx.market = market;
        $("ex-sub").textContent = `${type}. Press play or drag the slider to watch the markets move from ${label(first())} to ${label(last())}. Choose a market to focus the dashboard on it.`;
        if (typeChanged || !map.tiles.size) rebuild(); else update();
      }

      return { init, render, stop };
    })();

    // ========================================================== rules engine
    // "Ask the data": a small intent parser that answers from the computed KPIs.
    // Deterministic, runs here in the page, and can only answer what its rules cover.
    const Rules = (function () {
      const MARKET_ALIASES = [
        ["NYC", ["new york", "nyc", "manhattan", "ny"]],
        ["LAX", ["los angeles", "l.a.", "la", "socal"]],
        ["CHI", ["chicago", "chi"]],
        ["DFW", ["dallas", "fort worth", "dfw", "dallas-fort worth"]],
        ["ATL", ["atlanta", "atl"]],
        ["PHX", ["phoenix", "phx"]],
        ["SEA", ["seattle", "sea"]],
        ["BOS", ["boston", "bos"]],
        ["MIA", ["miami", "south florida", "mia"]],
        ["DEN", ["denver", "den"]],
        ["ALL", ["all markets", "national", "nationally", "overall", "u.s.", "us market", "across markets", "all 10"]],
      ];
      const TYPE_ALIASES = [
        ["Office", ["office", "offices"]],
        ["Industrial", ["industrial", "warehouse", "logistics", "distribution"]],
        ["Retail", ["retail", "shopping", "store"]],
      ];
      const METRICS = {
        vacancy: { words: ["vacan", "empty", "availability"], label: "vacancy", field: "vacancy", fmt: (v) => fmt.pct(v), asc: true },
        rent: { words: ["rent", "asking", "pricing", "price per"], label: "asking rent", field: "rent", fmt: (v) => `${fmt.rent(v)}/sf`, asc: false },
        rentGrowth: { words: ["rent growth", "rents grow", "rent increase", "rents rising"], label: "rent growth YoY", field: "rentYoY", fmt: (v) => fmt.signedPct(v), asc: false },
        cap: { words: ["cap rate", "cap", "yield", "valuation"], label: "cap rate", field: "cap", fmt: (v) => fmt.pct(v, 2), asc: false },
        absorption: { words: ["absorption", "demand", "leasing", "absorb"], label: "net absorption (T4Q)", field: "absorptionT4", fmt: (v) => fmt.signedSf(v), asc: false },
        supply: { words: ["construction", "pipeline", "supply", "deliver", "development", "new build"], label: "under construction (% of inventory)", field: "ucPctInventory", fmt: (v) => fmt.pct(v), asc: false },
        sales: { words: ["sales", "volume", "transaction", "investment", "deal"], label: "sales volume (T4Q)", field: "salesT4", fmt: (v) => fmt.usd(v), asc: false },
      };

      function findAll(q, aliases) {
        const hits = [];
        for (const [id, words] of aliases) {
          for (const w of words) {
            const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`);
            const m = q.match(re);
            if (m) { hits.push({ id, pos: m.index }); break; }
          }
        }
        return hits.sort((a, b) => a.pos - b.pos).map((h) => h.id);
      }

      function findMetric(q) {
        // Longest phrase first so "rent growth" beats "rent".
        const order = ["rentGrowth", "cap", "absorption", "supply", "sales", "vacancy", "rent"];
        return order.find((k) => METRICS[k].words.some((w) => q.includes(w))) || null;
      }

      const has = (q, ...words) => words.some((w) => q.includes(w));
      const place = (m, t) => (m === "ALL" ? `${t} (all 10 markets)` : `${marketName(m)} ${t.toLowerCase()}`);
      const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
      const b = (s) => `<strong>${esc(s)}</strong>`;

      function answer(question, state) {
        const q = question.toLowerCase().trim();
        const markets = findAll(q, MARKET_ALIASES);
        const types = findAll(q, TYPE_ALIASES);
        const type = types[0] || state.type;
        const market = markets[0] || null;
        const metricKey = findMetric(q);
        const apply = {};
        if (types[0]) apply.type = types[0];

        // Portfolio and leases
        if (/\bleases?\b/.test(q) || has(q, "portfolio", "expir", "renewal", "walt", "prioritize", "prioritise", "rollover")) {
          const p = portfolio();
          const top = p.priorities.slice(0, 3).map((l) =>
            `${b(`${l.lease_id} · ${l.marketName} ${l.property_type.toLowerCase()}`)}, ${fmt.sf(l.rentable_sf, 0)}, expires in ${Math.round(l.months)} months. ${esc(leaseAdvice(l))}`);
          return {
            html: `The sample portfolio has a WALT of ${b(p.walt.toFixed(1) + " years")}. ${b(fmt.pct(p.pctExpiring24, 0))} of its square footage expires within 24 months (${p.count24} leases). Renewing those leases at today's asking rents would add ${b(fmt.usd(p.renewalExposure24))} a year. Top priorities:${ul(top)}The page has moved to the portfolio view.`,
            jump: "portfolio",
          };
        }

        // Anomalies
        if (has(q, "unusual", "anomal", "outlier", "surpris", "stand out", "stands out", "weird", "red flag")) {
          const list = anomalies();
          if (!list.length) return { html: "No market moved more than 2.5 standard deviations from its own history in the last two quarters." };
          const items = list.map((a) => `${b(place(a.market, a.type))}: vacancy moved ${esc(fmt.pp(a.delta))} in ${esc(qLabel(a.quarter))}, which is ${Math.abs(a.z).toFixed(1)}σ from its usual quarterly change.`);
          const first = list[0];
          return {
            html: `${list.length} unusual move${list.length > 1 ? "s" : ""} in the last two quarters (|z| ≥ 2.5 vs. each market's own history):${ul(items)}The dashboard now shows the largest one.`,
            apply: { market: first.market, type: first.type },
          };
        }

        // Forecast
        if (has(q, "forecast", "predict", "outlook", "next year", "expect", "projection", "going to")) {
          const m = market || state.market;
          const fc = vacancyForecast(m, type);
          const k = kpis(m, type);
          const rows = fc.points.map((p, i) => `${esc(qLabel(fc.quarters[i]))}: ${b(fmt.pct(p.value))} <span class="mp-muted">(${fmt.pct(p.lower)}–${fmt.pct(p.upper)})</span>`);
          const end = fc.points[3].value;
          return {
            html: `Vacancy forecast for ${b(place(m, type))}, currently ${fmt.pct(k.vacancy)}:${ul(rows)}The baseline is ${end < k.vacancy - 0.2 ? "trending down" : end > k.vacancy + 0.2 ? "trending up" : "roughly flat"}. Ranges are 80% intervals from a damped Holt trend model, a transparent statistical baseline rather than a market call.`,
            apply: { ...apply, market: m },
          };
        }

        // Compare two or more markets
        if (markets.length >= 2 || has(q, "compare", " vs", "versus")) {
          const ms = markets.length >= 2 ? markets : [state.market === "ALL" ? "NYC" : state.market, "ALL"];
          const metricKeys = metricKey ? [metricKey] : ["vacancy", "rent", "rentGrowth", "cap", "absorption"];
          const ks = ms.map((m) => kpis(m, type));
          const head = `<tr><td></td>${ms.map((m) => `<th scope="col">${esc(m === "ALL" ? "All markets" : marketName(m))}</th>`).join("")}</tr>`;
          const body = metricKeys.map((mk) => `<tr><th scope="row" class="mp-left">${esc(METRICS[mk].label)}</th>${ks.map((k) => `<td>${esc(METRICS[mk].fmt(k[METRICS[mk].field]))}</td>`).join("")}</tr>`).join("");
          const vk = ks.slice().sort((x, y) => x.vacancy - y.vacancy);
          return {
            apply: { ...apply, market: ms[0] },
            html: `${esc(type)} comparison, ${esc(qLabel(ks[0].quarter))}:<div class="mp-table-wrap mp-msg-table"><table class="mp-table">${head}${body}</table></div><p>${b(vk[0].market === "ALL" ? "All markets" : marketName(vk[0].market))} has the lower vacancy, at ${fmt.pct(vk[0].vacancy)}.</p>`,
          };
        }

        // Rankings
        if (has(q, "highest", "lowest", "most", "least", "best", "worst", "top", "bottom", "rank", "which market", "where")) {
          const mk = metricKey || "vacancy";
          const M = METRICS[mk];
          const wantLow = has(q, "lowest", "least", "bottom", "weakest") || (has(q, "best", "tightest", "strongest") && mk === "vacancy");
          const rows = scorecard(type).slice().sort((x, y) => (wantLow ? x[M.field] - y[M.field] : y[M.field] - x[M.field]));
          const top = rows.slice(0, 3).map((r, i) => `${i + 1}. ${b(r.name)}: ${esc(M.fmt(r[M.field]))}`);
          return {
            html: `${wantLow ? "Lowest" : "Highest"} ${esc(type.toLowerCase())} ${esc(M.label)}, ${esc(qLabel(rows[0].quarter))}:${ul(top)}At the other end: ${b(rows[rows.length - 1].name)} (${esc(M.fmt(rows[rows.length - 1][M.field]))}). The dashboard now shows ${esc(rows[0].name)}.`,
            apply: { ...apply, market: rows[0].market },
          };
        }

        // Show / focus
        if (has(q, "show", "focus", "switch", "go to", "filter", "open", "view") && (market || types[0])) {
          const m = market || state.market;
          const s = summary(m, type);
          return { html: `Showing ${b(place(m, type))}. ${esc(s.headline)}`, apply: { ...apply, market: m } };
        }

        // Single metric, single market
        if (metricKey && (market || types[0])) {
          const m = market || state.market;
          const k = kpis(m, type);
          const M = METRICS[metricKey];
          const extra = {
            vacancy: `${fmt.pp(k.vacancyYoY)} YoY and ${fmt.pp(k.vacancyQoQ)} QoQ`,
            rent: `${fmt.signedPct(k.rentYoY)} YoY`,
            rentGrowth: `asking rent now ${fmt.rent(k.rent)}/sf`,
            cap: `${fmt.bps(k.capYoYbps)} YoY, ${Math.round(k.spreadBps)} bps over the 10-year Treasury`,
            absorption: `vs. ${fmt.sf(k.deliveriesT4)} delivered over the same period`,
            supply: `${fmt.sf(k.underConstruction)} under construction`,
            sales: `${fmt.signedPct(k.salesYoY)} vs. the prior four quarters`,
          }[metricKey];
          return { html: `${b(place(m, type))} ${esc(M.label)} is ${b(M.fmt(k[M.field]))} (${esc(extra)}) as of ${esc(qLabel(k.quarter))}.`, apply: { ...apply, market: m } };
        }

        // Summary of a place
        if (market || types[0] || has(q, "summar", "overview", "brief", "how is", "how's", "how are", "tell me")) {
          const m = market || state.market;
          const s = summary(m, type);
          return { html: `${b(s.headline)}${ul(s.bullets.map(esc))}${esc(s.reco[0])}`, apply: { ...apply, market: m } };
        }

        return {
          html: `That question is outside the rules written for this demo. It can answer:${ul([
            "rankings: <em>Which market has the highest industrial vacancy?</em>",
            "comparisons: <em>Compare Dallas and Atlanta office</em>",
            "forecasts: <em>Forecast vacancy for Phoenix industrial</em>",
            "anomalies: <em>What's unusual this quarter?</em>",
            "the portfolio: <em>Which leases should we prioritize?</em>",
          ])}`,
        };
      }

      return { answer };
    })();

    // =========================================================== page wiring
    const state = { type: "Office", market: "ALL", range: 20, scenario: 0 };
    const sortState = { key: "vacancy", asc: true };
    const placeLabel = () => (state.market === "ALL" ? `${state.type}, all 10 markets` : `${marketName(state.market)} ${state.type.toLowerCase()}`);

    // --------------------------------------------------------------- filters
    function initFilters() {
      const seg = $("f-type");
      for (const t of D.property_types) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("role", "radio");
        btn.textContent = t;
        btn.dataset.t = t;
        btn.addEventListener("click", () => setState({ type: t }));
        btn.addEventListener("keydown", (e) => {
          const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
          const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
          if (!fwd && !back) return;
          const i = D.property_types.indexOf(state.type);
          const next = D.property_types[(i + (fwd ? 1 : D.property_types.length - 1)) % D.property_types.length];
          setState({ type: next });
          seg.querySelector(`[data-t="${next}"]`).focus();
          e.preventDefault();
        });
        seg.appendChild(btn);
      }
      const sel = $("f-market");
      sel.add(new Option("All 10 markets", "ALL"));
      for (const m of D.markets) sel.add(new Option(m.name, m.id));
      sel.addEventListener("change", () => setState({ market: sel.value }));
      $("f-range").addEventListener("change", (e) => setState({ range: +e.target.value }));
      $("asof").textContent = `Data through ${qLabel(D.quarters[N - 1])} · synthetic sample`;
    }

    function syncFilters() {
      $("f-market").value = state.market;
      $("f-range").value = String(state.range);
      for (const btn of $("f-type").children) {
        const on = btn.dataset.t === state.type;
        btn.setAttribute("aria-checked", String(on));
        btn.tabIndex = on ? 0 : -1;
      }
    }

    function setState(patch) {
      const changed = Object.keys(patch).some((k) => patch[k] !== undefined && patch[k] !== state[k]);
      Object.assign(state, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
      if (changed) renderMarket();
    }

    // ------------------------------------------------------------------ KPIs
    function tile({ label, value, delta, deltaClass, deltaNote, note, sparkValues, hero, def }) {
      const card = document.createElement("div");
      card.className = "mp-card mp-kpi" + (hero ? " mp-kpi-hero" : "");
      card.setAttribute("role", "group");
      card.setAttribute("aria-label", label);
      const l = document.createElement("div"); l.className = "mp-kpi-label"; l.textContent = label;
      const v = document.createElement("div"); v.className = "mp-kpi-value"; v.textContent = value;
      card.append(l, v);
      if (delta) {
        const d = document.createElement("div"); d.className = "mp-kpi-delta";
        const s = document.createElement("span"); s.className = deltaClass || "mp-flat"; s.textContent = delta;
        d.append(s, document.createTextNode(" " + (deltaNote || "")));
        card.appendChild(d);
      }
      if (note) { const n = document.createElement("div"); n.className = "mp-kpi-note"; n.textContent = note; card.appendChild(n); }
      if (sparkValues) card.appendChild(spark(sparkValues));
      if (def) {
        const p = document.createElement("p"); p.className = "mp-kpi-def";
        const h = document.createElement("span"); h.className = "mp-def-label"; h.textContent = "How this number is defined";
        p.append(h, document.createTextNode(" " + defText(def)));
        card.appendChild(p);
      }
      return card;
    }

    const rangeSlice = (arr) => arr.slice(-state.range);

    function renderKpis() {
      const k = kpis(state.market, state.type);
      const s = series(state.market, state.type);
      const absT4 = rollingT4(s.net_absorption_sf);
      const salesT4 = rollingT4(s.sales_volume_usd);
      const dir = (v, upGood, eps = 0.05) => (Math.abs(v) < eps ? "mp-flat" : (v > 0) === upGood ? "mp-up-good" : "mp-up-bad");
      $("kpis").replaceChildren(
        tile({ hero: true, def: "vacancy", label: "Vacancy rate", value: fmt.pct(k.vacancy), delta: fmt.pp(k.vacancyYoY), deltaClass: dir(k.vacancyYoY, false), deltaNote: "vs. a year ago", sparkValues: rangeSlice(s.vacancy_pct) }),
        tile({ def: "absorption", label: "Net absorption, last 4 quarters", value: fmt.signedSf(k.absorptionT4), delta: fmt.signedSf(k.absorptionT4 - k.absorptionPrevT4), deltaClass: dir(k.absorptionT4 - k.absorptionPrevT4, true, 1), deltaNote: "vs. the prior 4 quarters", sparkValues: rangeSlice(absT4) }),
        tile({ def: "rent", label: "Asking rent ($/sf/yr)", value: fmt.rent(k.rent), delta: fmt.signedPct(k.rentYoY), deltaNote: "YoY", sparkValues: rangeSlice(s.asking_rent_psf) }),
        tile({ def: "cap", label: "Cap rate", value: fmt.pct(k.cap, 2), delta: fmt.bps(k.capYoYbps), deltaNote: "YoY", note: `${Math.round(k.spreadBps)} bps over the 10-year Treasury`, sparkValues: rangeSlice(s.cap_rate_pct) }),
        tile({ def: "construction", label: "Under construction", value: fmt.sf(k.underConstruction), note: `${fmt.pct(k.ucPctInventory)} of ${fmt.sf(k.inventory, 0)} inventory`, sparkValues: rangeSlice(s.under_construction_sf) }),
        tile({ def: "sales", label: "Sales volume, last 4 quarters", value: fmt.usd(k.salesT4), delta: fmt.signedPct(k.salesYoY), deltaNote: "vs. the prior 4 quarters", sparkValues: rangeSlice(salesT4) }),
      );
    }

    // --------------------------------------------------------------- summary
    function renderSummary() {
      const s = summary(state.market, state.type);
      $("summary-body").innerHTML = `<p class="mp-headline">${esc(s.headline)}</p><ul>${s.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><div class="mp-reco">${s.reco.map((x) => `<p>${esc(x)}</p>`).join("")}</div>`;
    }

    // ---------------------------------------------------------------- charts
    function renderVacancy(animate) {
      const qs = D.quarters;
      const s = series(state.market, state.type);
      const R = state.range;
      const labels = qs.slice(-R);
      const fc = vacancyForecast(state.market, state.type);
      const allLabels = [...labels, ...fc.quarters];
      const pad = (arr) => [...arr, ...fc.quarters.map(() => null)];
      const lastIdx = labels.length - 1;
      const actual = pad(s.vacancy_pct.slice(-R));
      const ahead = (f) => allLabels.map((_, i) => (i === lastIdx ? actual[lastIdx] : i > lastIdx ? f(fc.points[i - lastIdx - 1], i - lastIdx) : null));
      const fcLine = ahead((p) => p.value);
      const lower = ahead((p) => p.lower);
      const upper = ahead((p) => p.upper);
      const vSeries = [{ name: placeLabel(), values: actual, color: "--mp-s1", endLabel: false }];
      if (state.market !== "ALL") vSeries.push({ name: `${state.type}, all 10 markets`, values: pad(series("ALL", state.type).vacancy_pct.slice(-R)), color: "--mp-benchmark", width: 1.5, endLabel: false });
      vSeries.push({ name: "Baseline forecast", values: fcLine, color: "--mp-s1", dashed: true, endLabel: true });

      // What-if: extra (or lost) annual demand as a share of inventory lowers
      // (or raises) vacancy by that share, spread evenly across the quarters.
      const x = state.scenario;
      const inv = s.inventory_sf[qs.length - 1];
      let scenarioEnd = null;
      if (x !== 0) {
        const sc = ahead((p, h) => p.value - (x / 4) * h);
        scenarioEnd = sc[sc.length - 1];
        vSeries.push({ name: "What-if scenario", values: sc, color: "--mp-s2", dashed: true, endLabel: true });
      }
      const scenarioText = x === 0 ? "Baseline (no change)"
        : `${x > 0 ? "+" : "−"}${Math.abs(x).toFixed(2)}% of inventory (${fmt.signedSf(inv * x / 100)}/yr)`;
      $("scenario-out").textContent = scenarioText;
      $("scenario").setAttribute("aria-valuetext", scenarioText);

      const flagged = state.market === "ALL" ? [] : anomalies({ types: [state.type] })
        .filter((a) => a.market === state.market && labels.includes(a.quarter));
      const annotations = flagged.map((a) => ({ index: labels.indexOf(a.quarter), text: `Unusual move ${fmt.pp(a.delta)}` }));

      const end = fc.points[3];
      const shown = s.vacancy_pct.slice(-R);
      const now = s.vacancy_pct[qs.length - 1];
      const ariaLabel = `Vacancy rate for ${placeLabel()}, ${qLabel(labels[0])} to ${qLabel(labels[lastIdx])}, with a four-quarter forecast. `
        + `${fmt.pct(shown[0])} at the start, ${fmt.pct(now)} now, lowest ${fmt.pct(Math.min(...shown))}, highest ${fmt.pct(Math.max(...shown))}. `
        + `Baseline forecast ${fmt.pct(end.value)} by ${qLabel(fc.quarters[3])}, 80% range ${fmt.pct(end.lower)} to ${fmt.pct(end.upper)}.`
        + (scenarioEnd != null ? ` What-if scenario ${fmt.pct(scenarioEnd)}.` : "")
        + flagged.map((a) => ` Unusual move of ${fmt.pp(a.delta)} flagged in ${qLabel(a.quarter)}.`).join("")
        + " Arrow keys step through the quarters.";

      lineChart($("chart-vacancy"), {
        labels: allLabels, series: vSeries, band: { lower, upper, color: "--mp-s1", name: "80% range" },
        yFormat: (v, axis) => (axis ? `${+v.toFixed(1)}%` : fmt.pct(v)), shadeFrom: lastIdx, shadeLabel: "Forecast",
        tooltipTitle: qLabel, ariaLabel, annotations, animate, link: "quarters",
      });
      const legendItems = [{ name: placeLabel(), color: "--mp-s1" }];
      if (state.market !== "ALL") legendItems.push({ name: "All 10 markets", color: "--mp-benchmark" });
      legendItems.push({ name: "Baseline forecast", color: "--mp-s1", dashed: true }, { name: "80% range", color: "--mp-s1", kind: "band" });
      if (x !== 0) legendItems.push({ name: "What-if scenario", color: "--mp-s2", dashed: true });
      legend($("vac-legend"), legendItems);
      $("vac-sub").textContent = `${placeLabel()}: ${fmt.pct(now)} now. Baseline ${fmt.pct(end.value)} by ${qLabel(fc.quarters[3])}`
        + (scenarioEnd != null ? `; ${fmt.pct(scenarioEnd)} in the what-if scenario.` : ".");
    }

    function renderCharts(animate = true) {
      const qs = D.quarters;
      const s = series(state.market, state.type);
      const R = state.range;
      const labels = qs.slice(-R);
      const k = kpis(state.market, state.type);
      renderVacancy(animate);

      columnChart($("chart-supply"), {
        labels,
        series: [
          { name: "Net absorption", values: s.net_absorption_sf.slice(-R), color: "--mp-s1" },
          { name: "Deliveries", values: s.deliveries_sf.slice(-R), color: "--mp-s2" },
        ],
        yFormat: (v, axis) => (axis ? fmt.axisCompact(v) : fmt.signedSf(v)), tooltipTitle: qLabel,
        ariaLabel: `Net absorption and deliveries per quarter for ${placeLabel()}, ${qLabel(labels[0])} to ${qLabel(labels[labels.length - 1])}. `
          + `Latest quarter: ${fmt.signedSf(s.net_absorption_sf[qs.length - 1])} absorbed and ${fmt.sf(s.deliveries_sf[qs.length - 1])} delivered. `
          + `Last four quarters: ${fmt.signedSf(k.absorptionT4)} absorbed against ${fmt.sf(k.deliveriesT4)} delivered. Arrow keys step through the quarters.`,
        animate, link: "quarters",
      });
      legend($("sd-legend"), [{ name: "Net absorption", color: "--mp-s1", kind: "rect" }, { name: "Deliveries", color: "--mp-s2", kind: "rect" }]);

      const spreadNote = `${Math.round(k.spreadBps)} bps, ${k.spreadYoYbps >= 0 ? "wider" : "narrower"} by ${Math.abs(Math.round(k.spreadYoYbps))} bps YoY`;
      lineChart($("chart-cap"), {
        labels,
        series: [
          { name: "Cap rate", values: s.cap_rate_pct.slice(-R), color: "--mp-s1", endLabel: true },
          { name: "10-year Treasury", values: D.treasury_10y_pct.slice(-R), color: "--mp-s2", endLabel: true },
        ],
        yFormat: (v, axis) => (axis ? `${+v.toFixed(1)}%` : fmt.pct(v, 2)), tooltipTitle: qLabel,
        ariaLabel: `Cap rate and 10-year Treasury yield for ${placeLabel()}, ${qLabel(labels[0])} to ${qLabel(labels[labels.length - 1])}. `
          + `Latest: cap rate ${fmt.pct(k.cap, 2)}, Treasury ${fmt.pct(k.treasury, 2)}, spread ${spreadNote}. Arrow keys step through the quarters.`,
        animate, link: "quarters",
      });
      legend($("cap-legend"), [{ name: "Cap rate", color: "--mp-s1" }, { name: "10-year Treasury", color: "--mp-s2" }]);
      $("cap-sub").textContent = `Spread is ${spreadNote}`;
    }

    // ------------------------------------------------------------- scorecard
    const badge = (sig) => `<span class="mp-badge mp-${sig.level}">${sig.level !== "neutral" ? '<span class="mp-dot" aria-hidden="true"></span>' : ""}${esc(sig.label)}</span>`;

    const SCORE_COLS = [
      { key: "name", label: "Market", left: true, get: (r) => r.name },
      // The signal sits beside the market name so the flags stay in view when the table scrolls sideways.
      { key: "signal", label: "Signal", left: true, get: (r) => ({ warning: 0, serious: 1, good: 2, neutral: 3 }[r.signal.level]), render: (r) => badge(r.signal) },
      { key: "vacancy", label: "Vacancy", get: (r) => r.vacancy, render: (r, max) => `<span class="mp-minibar"><span>${fmt.pct(r.vacancy)}</span><span class="mp-track" aria-hidden="true"><span class="mp-fill" style="width:${(r.vacancy / max * 100).toFixed(1)}%"></span></span></span>` },
      { key: "vacancyYoY", label: "YoY change", get: (r) => r.vacancyYoY, render: (r) => `<span class="${r.vacancyYoY <= -0.05 ? "mp-delta-good" : r.vacancyYoY >= 0.05 ? "mp-delta-bad" : ""}">${fmt.pp(r.vacancyYoY)}</span>` },
      { key: "absorptionT4", label: "Net absorption (4Q)", head: "Net absorption<br>(4Q)", get: (r) => r.absorptionT4, render: (r) => fmt.signedSf(r.absorptionT4) },
      { key: "ucPctInventory", label: "Under constr. (% inv.)", head: "Under constr.<br>(% inv.)", get: (r) => r.ucPctInventory, render: (r) => fmt.pct(r.ucPctInventory) },
      { key: "rent", label: "Asking rent", get: (r) => r.rent, render: (r) => fmt.rent(r.rent) },
      { key: "rentYoY", label: "Rent YoY", get: (r) => r.rentYoY, render: (r) => fmt.signedPct(r.rentYoY) },
      { key: "cap", label: "Cap rate", get: (r) => r.cap, render: (r) => fmt.pct(r.cap, 2) },
      { key: "monthsOfSupply", label: "Months of supply", head: "Months<br>of supply", get: (r) => (r.monthsOfSupply == null ? Infinity : r.monthsOfSupply), render: (r) => (r.monthsOfSupply == null ? "n/a" : r.monthsOfSupply >= 120 ? "120+" : Math.round(r.monthsOfSupply)) },
    ];

    function renderScorecard() {
      const t = $("scorecard");
      // Keep keyboard focus on the same control after the table is redrawn.
      const active = document.activeElement;
      let refocus = null;
      if (active && t.contains(active)) {
        if (active.classList.contains("mp-sort")) refocus = `.mp-sort[data-k="${active.dataset.k}"]`;
        else if (active.classList.contains("mp-rowbtn")) refocus = `.mp-rowbtn[data-m="${active.dataset.m}"]`;
      }
      const rows = scorecard(state.type);
      const col = SCORE_COLS.find((c) => c.key === sortState.key);
      rows.sort((a, b) => {
        const x = col.get(a), y = col.get(b);
        const c = typeof x === "string" ? x.localeCompare(y) : (x === y ? 0 : x - y);
        return sortState.asc ? c : -c;
      });
      const max = Math.max(...rows.map((r) => r.vacancy));
      const all = { ...kpis("ALL", state.type), name: "All 10 markets" };
      all.signal = { level: "neutral", label: "Benchmark" };
      const head = `<thead><tr>${SCORE_COLS.map((c) => {
        const on = sortState.key === c.key;
        return `<th class="${c.left ? "mp-left" : ""}" scope="col" aria-sort="${on ? (sortState.asc ? "ascending" : "descending") : "none"}"><button type="button" class="mp-sort" data-k="${c.key}"><span>${c.head || esc(c.label)}</span><span class="mp-arrow" aria-hidden="true">${on ? (sortState.asc ? "▲" : "▼") : ""}</span></button></th>`;
      }).join("")}</tr></thead>`;
      const tr = (r, id) => `<tr data-m="${id}" class="${state.market === id ? "mp-selected" : ""}">${SCORE_COLS.map((c) => {
        if (c.key === "name") return `<th scope="row" class="mp-left"><button type="button" class="mp-rowbtn" data-m="${id}" aria-pressed="${state.market === id}">${esc(r.name)}</button></th>`;
        return `<td class="${c.left ? "mp-left" : ""}">${c.render ? c.render(r, max) : esc(c.get(r))}</td>`;
      }).join("")}</tr>`;
      t.innerHTML = `<caption class="mp-sr-only">Market scorecard, ${esc(state.type.toLowerCase())}, ${esc(qLabel(rows[0].quarter))}. Sorted by ${esc(col.label)}, ${sortState.asc ? "ascending" : "descending"}.</caption>`
        + head + `<tbody>${rows.map((r) => tr(r, r.market)).join("")}</tbody><tfoot>${tr(all, "ALL")}</tfoot>`;
      if (refocus) { const f = t.querySelector(refocus); if (f) f.focus({ preventScroll: true }); }
      $("score-sub").textContent = `${state.type}, ${qLabel(rows[0].quarter)}. Choose a market to focus the dashboard on it. Choose a column heading to sort.`;
    }

    function initScorecard() {
      $("scorecard").addEventListener("click", (e) => {
        const sortBtn = e.target.closest(".mp-sort");
        if (sortBtn) {
          const k = sortBtn.dataset.k;
          sortState.asc = sortState.key === k ? !sortState.asc : (k === "name" || k === "vacancy" || k === "signal");
          sortState.key = k;
          renderScorecard();
          return;
        }
        const row = e.target.closest("tr[data-m]");
        if (row) setState({ market: row.dataset.m });
      });
    }

    // ---------------------------------------------- snapshot and highlights
    function renderSnapshot() {
      $("hero-stats").replaceChildren(...D.property_types.map((t) => {
        const k = kpis("ALL", t);
        const d = document.createElement("div");
        d.className = "mp-snap-stat";
        const l = document.createElement("div"); l.className = "mp-hs-label"; l.textContent = `${t} vacancy`;
        const v = document.createElement("div"); v.className = "mp-hs-value"; v.textContent = fmt.pct(k.vacancy);
        const n = document.createElement("div");
        const dir = Math.abs(k.vacancyYoY) < 0.05 ? "flat" : k.vacancyYoY < 0 ? "good" : "bad";
        n.className = `mp-hs-delta mp-${dir}`;
        const mark = document.createElement("span"); mark.setAttribute("aria-hidden", "true");
        mark.textContent = dir === "flat" ? "■" : k.vacancyYoY < 0 ? "▼" : "▲";
        const words = document.createElement("span"); words.className = "mp-sr-only";
        words.textContent = dir === "good" ? "Vacancy falling, market tightening:" : dir === "bad" ? "Vacancy rising, market softening:" : "Little change:";
        n.append(mark, words, document.createTextNode(` ${fmt.pp(k.vacancyYoY).replace(/^[+−±]/, "")} YoY`));
        d.append(l, v, n, spark(series("ALL", t).vacancy_pct.slice(-12)));
        return d;
      }));
      $("hs-caption").textContent = `Vacancy snapshot · all 10 markets · ${qLabel(D.quarters[N - 1])}`;
    }

    // Highlights strip. Each item is computed from the data, and choosing one
    // focuses the dashboard on it.
    function tickerItems() {
      const items = [{ label: "Sample data", text: "The market and lease figures here are synthetic. The 10-year Treasury line is based on the published rate." }];
      for (const a of anomalies()) {
        items.push({ label: "Anomaly", text: `${marketName(a.market)} ${a.type.toLowerCase()} vacancy ${fmt.pp(a.delta)} in ${qLabel(a.quarter)}`, apply: { market: a.market, type: a.type } });
      }
      for (const t of D.property_types) {
        const fc = vacancyForecast("ALL", t);
        items.push({ label: "Forecast", text: `${t} vacancy ${fmt.pct(fc.points[3].value)} by ${qLabel(fc.quarters[3])}`, apply: { market: "ALL", type: t } });
      }
      for (const t of D.property_types) {
        const best = scorecard(t).sort((a, b) => b.rentYoY - a.rentYoY)[0];
        items.push({ label: "Rent growth", text: `${best.name} leads ${t.toLowerCase()} at ${fmt.signedPct(best.rentYoY)} YoY`, apply: { market: best.market, type: t } });
      }
      const ind = kpis("ALL", "Industrial");
      items.push({ label: "Capital markets", text: `Industrial cap rates ${Math.round(ind.spreadBps)} bps over Treasuries`, apply: { market: "ALL", type: "Industrial" } });
      const supply = scorecard("Industrial").sort((a, b) => b.ucPctInventory - a.ucPctInventory)[0];
      items.push({ label: "Pipeline", text: `${supply.name} industrial: ${fmt.pct(supply.ucPctInventory)} of inventory under construction`, apply: { market: supply.market, type: "Industrial" } });
      const p = portfolio();
      items.push({ label: "Portfolio", text: `${fmt.pct(p.pctExpiring24, 0)} of sample leases expire within 24 months`, jump: "portfolio" });
      return items;
    }

    function renderTicker() {
      const items = tickerItems();
      const makeSet = (hidden) => {
        const set = document.createElement("div");
        set.className = "mp-ticker-set";
        if (hidden) set.setAttribute("aria-hidden", "true");
        for (const it of items) {
          // Items that refilter the dashboard are buttons; the rest are plain text.
          const action = !!(it.apply || it.jump);
          const node = document.createElement(action ? "button" : "span");
          node.className = "mp-ticker-item";
          const tag = document.createElement("b"); tag.textContent = it.label;
          const text = document.createElement("span"); text.className = "mp-t-text"; text.textContent = it.text;
          node.append(tag, text);
          if (action) {
            node.type = "button";
            if (hidden) node.tabIndex = -1;
            node.addEventListener("click", () => {
              if (it.apply) { setState(it.apply); scrollToNode($("market")); }
              if (it.jump) scrollToNode($(it.jump));
            });
          }
          set.appendChild(node);
        }
        return set;
      };
      const track = $("ticker");
      track.replaceChildren(makeSet(false), makeSet(true));
      // Constant reading speed (~55 px/s) whatever the content length.
      requestAnimationFrame(() => track.style.setProperty("--mp-ticker-dur", `${Math.max(20, Math.round(track.scrollWidth / 2 / 55))}s`));
      const band = $("ticker-band");
      const toggle = $("ticker-toggle");
      toggle.addEventListener("click", () => {
        const paused = band.classList.toggle("mp-paused");
        toggle.setAttribute("aria-pressed", String(paused));
        toggle.setAttribute("aria-label", paused ? "Play the highlights ticker" : "Pause the highlights ticker");
      });
    }

    function renderMarket() {
      syncFilters();
      const shown = document.createElement("b");
      shown.textContent = placeLabel();
      $("subtitle").replaceChildren(document.createTextNode("Dashboard is showing: "), shown);
      renderKpis();
      renderSummary();
      renderCharts();
      renderScorecard();
      Explorer.render({ type: state.type, market: state.market });
    }

    // ------------------------------------------------------------- portfolio
    function renderPortfolio() {
      const p = portfolio();
      $("pf-kpis").replaceChildren(
        tile({ def: "size", label: "Portfolio size", value: fmt.sf(p.totalSf), note: `${p.leases.length} leases · ${fmt.usd(p.annualRent)}/yr in rent` }),
        tile({ def: "walt", label: "Weighted avg. lease term (WALT)", value: `${p.walt.toFixed(1)} yrs`, note: "Remaining term, weighted by square feet" }),
        tile({ def: "expiring", label: "Expiring within 24 months", value: fmt.pct(p.pctExpiring24, 0), note: `${p.count24} leases, by square feet` }),
        tile({ def: "renewal", label: "Renewal cost increase, next 24 months", value: `${fmt.usd(p.renewalExposure24)}/yr`, note: "If renewed at today's asking rent" }),
      );

      const years = Object.keys(p.byYear).sort();
      const asOfYear = D.meta.as_of.slice(0, 4);
      const yearLabel = (y) => (y === asOfYear ? `${y} H2` : y);
      const types = ["Office", "Industrial", "Retail"];
      const total = (y) => types.reduce((a, t) => a + p.byYear[y][t], 0);
      const peak = years.slice().sort((a, b) => total(b) - total(a))[0];
      columnChart($("chart-expiry"), {
        labels: years.map(yearLabel),
        series: types.map((t, i) => ({ name: t, values: years.map((y) => p.byYear[y][t]), color: `--mp-s${i + 1}` })),
        stacked: true, totalLabel: "Total",
        yFormat: (v, axis) => (axis ? fmt.axisCompact(v) : fmt.sf(v)),
        ariaLabel: `Square feet expiring by year, stacked by property type. ${years.map((y) => `${yearLabel(y)}: ${fmt.sf(total(y))}`).join("; ")}. The largest year is ${yearLabel(peak)}. Arrow keys step through the years.`,
      });
      legend($("pf-legend"), types.map((t, i) => ({ name: t, color: `--mp-s${i + 1}`, kind: "rect" })));

      const monthYear = (iso) => new Date(iso + "T00:00:00Z").toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      $("pf-actions").innerHTML = p.priorities.map((l) =>
        `<li><div><div class="mp-a-title">${esc(l.lease_id)} · ${esc(l.marketName)} ${esc(l.property_type.toLowerCase())}, ${fmt.sf(l.rentable_sf, 0)}, expires ${esc(monthYear(l.expiration))}</div><div class="mp-a-body">${esc(leaseAdvice(l))}</div></div></li>`).join("");

      const leases = p.leases.slice().sort((a, b) => a.months - b.months);
      const head = ["Lease", "Market", "Type", "Size (sf)", "Expires", "Months<br>left", "In-place<br>rent", "Market<br>rent", "Mark-to-<br>market", "Annual<br>impact", "Market<br>vacancy", "Urgency"];
      $("leases").innerHTML = `<caption class="mp-sr-only">Lease schedule for the fictional occupier, soonest expiry first.</caption><thead><tr>${head.map((h, i) => `<th scope="col" class="${i < 3 || i === 11 ? "mp-left" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${leases.map((l) => `<tr>
        <th scope="row" class="mp-left">${esc(l.lease_id)}</th><td class="mp-left">${esc(l.marketName)}</td><td class="mp-left">${esc(l.property_type)}</td>
        <td>${fmt.int(l.rentable_sf)}</td><td>${esc(l.expiration.slice(0, 7))}</td><td>${Math.round(l.months)}</td>
        <td>${fmt.rent(l.in_place_rent_psf)}</td><td>${fmt.rent(l.market_rent_psf)}</td>
        <td class="${l.mtmPct > 1 ? "mp-delta-bad" : l.mtmPct < -1 ? "mp-delta-good" : ""}">${fmt.signedPct(l.mtmPct)}</td>
        <td>${l.mtmAnnual >= 0 ? "+" : ""}${fmt.usd(l.mtmAnnual)}</td><td>${fmt.pct(l.marketVacancy)}</td>
        <td class="mp-left">${badge(l.risk)}</td></tr>`).join("")}</tbody>`;
    }

    // ----------------------------------------------------------- definitions
    function renderDefs() {
      const order = ["vacancy", "absorption", "deliveries", "construction", "monthsOfSupply", "rent", "cap", "treasury", "sales",
        "signal", "anomaly", "forecast", "whatif", "walt", "expiring", "mtm", "renewal", "score"];
      $("defs").replaceChildren(...order.map((key) => {
        const pair = document.createElement("div"); pair.className = "mp-def";
        const dt = document.createElement("dt"); dt.textContent = DEFS[key][0];
        const dd = document.createElement("dd"); dd.textContent = DEFS[key][1];
        pair.append(dt, dd);
        return pair;
      }));
    }

    // ------------------------------------------------------------------ chat
    function addMsg(role, html, source) {
      const m = document.createElement("div");
      m.className = `mp-msg mp-${role}`;
      if (role === "user") {
        const who = document.createElement("span"); who.className = "mp-sr-only"; who.textContent = "You asked: ";
        m.append(who, document.createTextNode(html));
      } else {
        m.innerHTML = html + (source ? `<span class="mp-src">${esc(source)}</span>` : "");
      }
      const log = $("chat-log");
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }

    function ask(q) {
      const text = String(q || "").trim().slice(0, 300);
      if (!text) return;
      addMsg("user", text);
      const res = Rules.answer(text, { ...state });
      addMsg("bot", res.html, "Rules engine · computed in this page from the sample data");
      if (res.apply) setState(res.apply);
      if (res.jump) scrollToNode($(res.jump));
    }

    function initChat() {
      $("chips").querySelectorAll(".mp-chip").forEach((c) => c.addEventListener("click", () => ask(c.textContent)));
      $("chat-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const input = $("chat-input");
        const v = input.value;
        input.value = "";
        ask(v);
      });
      addMsg("bot", "Ask about vacancy, rents, cap rates, supply, anomalies or the lease portfolio. Answers are computed from the sample data, and the dashboard updates to match.", "");
    }

    // -------------------------------------------------------------- downloads
    function download(name, text) {
      const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.hidden = true;
      root.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // ------------------------------------------------------------------ boot
    initFilters();
    renderDefs();
    initChat();
    initScorecard();
    Explorer.init({ onSelect: (m) => setState({ market: m }) });
    $("scenario").addEventListener("input", (e) => { state.scenario = +e.target.value; renderVacancy(false); });
    renderSnapshot();
    renderTicker();
    renderMarket();
    renderPortfolio();
    $("dl-market").addEventListener("click", () => download("market-pulse-sample-markets.csv", marketCsv()));
    $("dl-portfolio").addEventListener("click", () => download("market-pulse-sample-leases.csv", portfolioCsv()));
    window.addEventListener("scroll", hideTooltip, { passive: true });
    // A tap outside a chart or tile puts the tooltip away on touch screens.
    root.addEventListener("pointerdown", (e) => { if (!e.target.closest(".mp-chart, .mp-tile")) hideTooltip(); });
    // Stop the time-lapse when motion is switched off, by the system or by the host page.
    const settle = () => { if (calm()) Explorer.stop(); };
    if (reduced && reduced.addEventListener) reduced.addEventListener("change", settle);
    window.addEventListener("capra:motion", settle);
  }

  // The host can call MarketPulse.mount() again if it adds the fragment to the page later.
  window.MarketPulse = { mount: mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
