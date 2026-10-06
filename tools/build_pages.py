#!/usr/bin/env python3
"""Generates the long-form SEO pages and sitemap.xml.

    python3 tools/build_pages.py

- Page content lives in tools/content/*.py (one list of page dicts per section).
- Output is plain static HTML written next to the hand-written pages
  (services/, service-areas/, about/, faq/, guides/, guides.html) — commit it.
- The shared footer is also synced into the hand-written top-level pages so
  there is only one copy of it to maintain.
- Every internal link is checked; the build fails on a broken one.
"""
import hashlib
import html
import json
import re
import sys
import textwrap
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from content import about, areas, faq, guides, jobs, services  # noqa: E402

SITE = "https://redtopscoopers.com"
BUSINESS = "Red Top Scoopers LLC"
PHONE = "404-649-4654"
TEL = "+14046494654"
EMAIL = "redtopscoopers@gmail.com"
GA_ID = "G-PLDDZRXMS9"
TODAY = date.today().isoformat()
# Stand-in for "last modified" dates; swapped for a real date that only changes
# when a page's content changes (tracked in tools/page-dates.json).
MODIFIED = "__DATE_MODIFIED__"
DATES_FILE = Path(__file__).resolve().parent / "page-dates.json"
PUBLISHED = "2026-10-05"

AREA_SERVED = [
    "Cartersville, GA", "Rome, GA", "Acworth, GA", "Kennesaw, GA", "Woodstock, GA",
    "Marietta, GA", "Dallas, GA", "Rockmart, GA", "Euharlee, GA", "Emerson, GA",
    "Kingston, GA", "Adairsville, GA", "White, GA", "Taylorsville, GA", "Calhoun, GA",
    "Northwest Georgia", "Metro Atlanta, GA",
]

SOCIALS = [
    ("https://www.facebook.com/RedTopScoopers/", "Red Top Scoopers on Facebook",
     "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"),
    ("https://www.instagram.com/redtopscoopers/", "Red Top Scoopers on Instagram",
     "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"),
    ("https://www.tiktok.com/@redtopscoopers", "Red Top Scoopers on TikTok",
     "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"),
    ("https://share.google/RgslzAj8Ypd5t2DN9", "Red Top Scoopers Google Business Profile and reviews",
     "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"),
]

NAV = [
    ("index.html", "Home"),
    ("services.html", "Services"),
    ("service-locations.html", "Service Areas"),
    ("about.html", "About"),
    ("faq.html", "FAQ"),
    ("contact.html", "Contact"),
]

# Hand-written top-level pages: footer gets synced into these, and they go in the sitemap.
ROOT_PAGES = {
    "index.html": "1.0",
    "services.html": "0.9",
    "service-locations.html": "0.9",
    "contact.html": "0.8",
    "about.html": "0.6",
    "faq.html": "0.6",
}

SECTIONS = {
    "services": dict(module=services, nav="services.html", crumb=("Services", "services.html"),
                     hero="hero-services.jpg", eyebrow="Junk Removal Services", schema="service", priority="0.8"),
    "service-areas": dict(module=areas, nav="service-locations.html", crumb=("Service Areas", "service-locations.html"),
                          hero="hero-locations.jpg", eyebrow="Service Area", schema="area", priority="0.8"),
    "about": dict(module=about, nav="about.html", crumb=("About", "about.html"),
                  hero="about-truck.jpg", eyebrow="About Red Top Scoopers", schema="article", priority="0.6"),
    "faq": dict(module=faq, nav="faq.html", crumb=("FAQ", "faq.html"),
                hero="hero-contact.jpg", eyebrow="Junk Removal FAQ", schema="article", priority="0.6"),
    "guides": dict(module=guides, nav=None, crumb=("Guides", "guides.html"),
                   hero="hero-home.jpg", eyebrow="Junk Removal Guide", schema="article", priority="0.6"),
}


# --------------------------------------------------------------------------- #
# Markdown-ish body format: blank-line separated blocks.
#   ## H2 / ### H3 / "- " bullets / "1. " numbered / "> " callout / paragraph
#   Inline: **bold**, [text](/root/relative/path.html) or [text](https://...)
# --------------------------------------------------------------------------- #
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def inline(text, prefix, links):
    text = html.escape(text, quote=False)
    text = BOLD_RE.sub(r"<strong>\1</strong>", text)

    def link(m):
        label, url = m.group(1), m.group(2)
        if url.startswith("/"):
            links.append(url[1:].split("#")[0])
            return f'<a href="{prefix}{url[1:]}">{label}</a>'
        if url.startswith(("tel:", "sms:", "mailto:")):
            return f'<a href="{url}">{label}</a>'
        return f'<a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>'

    return LINK_RE.sub(link, text)


def md(text, prefix, links):
    out = []
    for block in re.split(r"\n\s*\n", textwrap.dedent(text).strip()):
        lines = [ln.strip() for ln in block.strip().splitlines()]
        first = lines[0]
        if first.startswith("### "):
            out.append(f"<h3>{inline(' '.join(lines)[4:], prefix, links)}</h3>")
        elif first.startswith("## "):
            out.append(f"<h2>{inline(' '.join(lines)[3:], prefix, links)}</h2>")
        elif all(ln.startswith("- ") for ln in lines):
            items = "".join(f"<li>{inline(ln[2:], prefix, links)}</li>" for ln in lines)
            out.append(f"<ul>{items}</ul>")
        elif all(re.match(r"\d+\. ", ln) for ln in lines):
            items = "".join(f"<li>{inline(ln.split('. ', 1)[1], prefix, links)}</li>" for ln in lines)
            out.append(f"<ol>{items}</ol>")
        elif first.startswith("> "):
            body = " ".join(ln[2:] if ln.startswith("> ") else ln for ln in lines)
            out.append(f'<div class="callout"><p>{inline(body, prefix, links)}</p></div>')
        else:
            out.append(f"<p>{inline(' '.join(lines), prefix, links)}</p>")
    return "\n".join(out)


# --------------------------------------------------------------------------- #
# Shared chrome
# --------------------------------------------------------------------------- #
def header(prefix, current):
    links = "\n".join(
        f'        <li><a href="{prefix}{href}"{" aria-current=\"page\"" if href == current else ""}>{label}</a></li>'
        for href, label in NAV
    )
    return f"""<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="{prefix}index.html">
      <img class="brand__logo" src="{prefix}images/logo.png" alt="Red Top Scoopers LLC logo" width="44" height="44">
      <span>
        <span class="brand__name">Red Top Scoopers</span>
        <span class="brand__tagline">Junk Removal</span>
      </span>
    </a>
    <nav class="main-nav" aria-label="Primary">
      <ul class="main-nav__links">
{links}
      </ul>
      <a class="header-call" href="tel:{TEL}">📞 {PHONE}</a>
    </nav>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
  </div>
</header>"""


def footer(prefix):
    recent = (f'          <li><a href="{prefix}recent-jobs.html">Recent Jobs</a></li>\n' if jobs.JOBS else "")
    socials = "\n".join(
        f'          <a href="{url}" target="_blank" rel="noopener noreferrer" aria-label="{label}">\n'
        f'            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="{path}"/></svg>\n'
        f"          </a>"
        for url, label, path in SOCIALS
    )
    svc = "\n".join(f'          <li><a href="{prefix}services/{p["slug"]}.html">{p["short"]}</a></li>'
                    for p in services.PAGES)
    featured = [p for p in areas.PAGES if p.get("featured")]
    area = "\n".join(f'          <li><a href="{prefix}service-areas/{p["slug"]}.html">{p["short"]}</a></li>'
                     for p in featured)
    return f"""<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img class="brand__logo" src="{prefix}images/logo.png" alt="Red Top Scoopers LLC logo" width="60" height="60" style="margin-bottom:0.75rem;">
        <p style="color:#fff; font-family:var(--font-heading); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">Red Top Scoopers LLC</p>
        <p style="font-size:0.9rem;">Junk Removal — Northwest Georgia &amp; Metro Atlanta</p>
        <div class="social-links">
{socials}
        </div>
      </div>
      <div>
        <h4>Contact</h4>
        <div class="footer-contact-line"><a href="tel:{TEL}">📞 Call: {PHONE}</a></div>
        <div class="footer-contact-line"><a href="sms:{TEL}">💬 Text: {PHONE}</a></div>
        <div class="footer-contact-line"><a href="mailto:{EMAIL}">✉️ {EMAIL}</a></div>
        <div class="footer-contact-line">🕐 Open 7 days a week, 7am–7pm</div>
        <h4 style="margin-top:1.5rem;">Learn More</h4>
        <ul class="footer-links">
          <li><a href="{prefix}about/our-story.html">Our Story</a></li>
          <li><a href="{prefix}guides.html">Junk Removal Guides</a></li>
          <li><a href="{prefix}faq.html">FAQ</a></li>
{recent}        </ul>
      </div>
      <div>
        <h4>Services</h4>
        <ul class="footer-links">
{svc}
        </ul>
      </div>
      <div>
        <h4>Service Areas</h4>
        <ul class="footer-links">
{area}
          <li><a href="{prefix}service-locations.html">All Service Areas →</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-current-year>{date.today().year}</span> Red Top Scoopers LLC. All rights reserved. Licensed &amp; Insured.</p>
      <button type="button" class="restricted-tag" data-egg-trigger><span class="restricted-tag__led" aria-hidden="true"></span>🔒 Restricted Area</button>
      <p>Junk Removal proudly serving Cartersville, GA and beyond.</p>
    </div>
  </div>
  <script src="{prefix}js/egg-loader.js" defer></script>
</footer>"""


def abs_url(path):
    return f"{SITE}/" if path == "index.html" else f"{SITE}/{path}"


def head(prefix, path, title, description, schemas):
    url = abs_url(path)
    og = f"{SITE}/images/og-image.jpg"
    t, d = html.escape(title), html.escape(description)
    ld = "\n".join(
        f'<script type="application/ld+json">\n{json.dumps(s, indent=2, ensure_ascii=False)}\n</script>'
        for s in schemas
    )
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BUSINESS}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="{prefix}images/favicon.ico">
<link rel="apple-touch-icon" href="{prefix}images/apple-touch-icon.png">
<link rel="manifest" href="{prefix}site.webmanifest">
<meta name="theme-color" content="#1a1a1a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{prefix}css/styles.css">

<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{GA_ID}');
</script>

{ld}
</head>
<body>
"""


def tail(prefix):
    return f"""
<div class="sticky-cta">
  <div class="sticky-cta__inner">
    <a class="btn btn-call btn-block" href="tel:{TEL}">📞 Call Now</a>
    <a class="btn btn-text btn-block" href="sms:{TEL}">💬 Text Now</a>
  </div>
</div>

<script src="{prefix}js/main.js"></script>
</body>
</html>
"""


# --------------------------------------------------------------------------- #
# Schema
# --------------------------------------------------------------------------- #
def business_schema():
    return {
        "@context": "https://schema.org",
        "@type": "HomeAndConstructionBusiness",
        "@id": f"{SITE}/#business",
        "name": BUSINESS,
        "image": f"{SITE}/images/og-image.jpg",
        "url": SITE,
        "telephone": TEL,
        "email": EMAIL,
        "sameAs": [s[0] for s in SOCIALS],
        "priceRange": "$$",
        "areaServed": AREA_SERVED,
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "07:00",
            "closes": "19:00",
        },
    }


def breadcrumb_schema(crumbs):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i, "name": name, "item": abs_url(href)}
            for i, (name, href) in enumerate(crumbs, 1)
        ],
    }


def page_schema(kind, page, path):
    url = f"{SITE}/{path}"
    if kind == "service":
        return {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": page["short"],
            "serviceType": page["short"],
            "description": page["description"],
            "url": url,
            "provider": {"@id": f"{SITE}/#business"},
            "areaServed": AREA_SERVED,
        }
    if kind == "area":
        return {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": f"Junk Removal in {page['city']}",
            "serviceType": "Junk Removal",
            "description": page["description"],
            "url": url,
            "provider": {"@id": f"{SITE}/#business"},
            "areaServed": {"@type": "City", "name": page["city"]},
        }
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": page["h1"],
        "description": page["description"],
        "image": f"{SITE}/images/og-image.jpg",
        "author": {"@type": "Organization", "name": BUSINESS, "url": SITE},
        "publisher": {"@id": f"{SITE}/#business"},
        "datePublished": page.get("published", PUBLISHED),
        "dateModified": MODIFIED,
        "mainEntityOfPage": url,
    }


def faq_schema(faqs):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in faqs
        ],
    }


# --------------------------------------------------------------------------- #
# Page assembly
# --------------------------------------------------------------------------- #
REGISTRY = {}  # path -> page dict (for related cards)


def related_cards(paths, prefix, links):
    cards = []
    for rel in paths:
        links.append(rel)
        p = REGISTRY[rel]
        icon = (f'<img class="card__icon" src="{prefix}images/{p["icon"]}" alt="" width="56" height="56" loading="lazy">'
                if p.get("icon") else "")
        cards.append(
            f'        <a class="card card--link" href="{prefix}{rel}">\n'
            f"          {icon}\n"
            f'          <h3>{html.escape(p["short"])}</h3>\n'
            f'          <p>{html.escape(p["blurb"])}</p>\n'
            f'          <span class="card-more">Read more →</span>\n'
            f"        </a>"
        )
    return "\n".join(cards)


def job_card(job, prefix, links):
    photos = []
    for photo in job["photos"]:
        file, alt, label = (tuple(photo) + ("",))[:3]
        links.append(f"images/jobs/{file}")
        tag = f'<span class="job-card__label">{html.escape(label)}</span>' if label else ""
        photos.append(f'<figure><img src="{prefix}images/jobs/{file}" alt="{html.escape(alt)}" loading="lazy">{tag}</figure>')
    area = REGISTRY[f"service-areas/junk-removal-{job['city']}-ga.html"]
    svc = REGISTRY[f"services/{job['service']}.html"]
    links += [f"service-areas/junk-removal-{job['city']}-ga.html", f"services/{job['service']}.html"]
    when = date.fromisoformat(job["date"]).strftime("%B %Y")
    return f"""        <article class="card job-card">
          <div class="job-card__photos">{"".join(photos)}</div>
          <div class="job-card__body">
            <p class="job-card__meta"><a href="{prefix}service-areas/junk-removal-{job['city']}-ga.html">{html.escape(area['short'])}</a> · <a href="{prefix}services/{job['service']}.html">{html.escape(svc['short'])}</a> · {when}</p>
            <h3>{html.escape(job['title'])}</h3>
            <p>{html.escape(job['summary'])}</p>
          </div>
        </article>"""


def jobs_section(selected, prefix, links, heading):
    """'Recent jobs' strip for service and area pages; empty when there are none."""
    if not selected:
        return ""
    cards = "\n".join(job_card(j, prefix, links) for j in selected[:3])
    more = (f'\n      <p class="text-center" style="margin-top:2rem;"><a class="btn btn-call" href="{prefix}recent-jobs.html">See All Recent Jobs</a></p>'
            if len(jobs.JOBS) > len(selected[:3]) else "")
    return f"""
  <section class="section">
    <div class="container">
      <h2 class="text-center" style="margin-bottom:2rem;">{html.escape(heading)}</h2>
      <div class="grid grid-3">
{cards}
      </div>{more}
    </div>
  </section>
"""


def sorted_jobs():
    return sorted(jobs.JOBS, key=lambda j: j["date"], reverse=True)


def cta_band(heading, text):
    return f"""  <section class="cta-band">
    <div class="container">
      <h2>{html.escape(heading)}</h2>
      <p>{html.escape(text)}</p>
      <div class="cta-group">
        <a class="btn btn-outline" href="tel:{TEL}">📞 Call {PHONE}</a>
        <a class="btn btn-outline" href="sms:{TEL}">💬 Text {PHONE}</a>
      </div>
    </div>
  </section>"""


def hero(prefix, image, crumbs, eyebrow, h1, lede):
    crumb_items = "".join(
        f'<li><a href="{prefix}{href}">{html.escape(name)}</a></li>' for name, href in crumbs[:-1]
    ) + f'<li aria-current="page">{html.escape(crumbs[-1][0])}</li>'
    return f"""  <section class="hero hero--sub" style="background-image: linear-gradient(135deg, rgba(26,26,26,0.88), rgba(43,43,43,0.88)), url('{prefix}images/{image}');">
    <div class="container hero__inner">
      <nav class="breadcrumb" aria-label="Breadcrumb"><ol>{crumb_items}</ol></nav>
      <span class="eyebrow eyebrow--light">{html.escape(eyebrow)}</span>
      <h1>{html.escape(h1)}</h1>
      <p class="lede">{html.escape(lede)}</p>
      <div class="cta-group">
        <a class="btn btn-call" href="tel:{TEL}">📞 Call {PHONE}</a>
        <a class="btn btn-text" href="sms:{TEL}">💬 Text Us Photos</a>
      </div>
    </div>
  </section>"""


def build_page(section, page):
    cfg = SECTIONS[section]
    path = f"{section}/{page['slug']}.html"
    prefix = "../"
    links = []

    crumbs = [("Home", "index.html"), cfg["crumb"], (page["short"], path)]
    schemas = [business_schema(), breadcrumb_schema(crumbs), page_schema(cfg["schema"], page, path)]
    if page.get("faqs"):
        schemas.append(faq_schema(page["faqs"]))

    body = md(page["body"], prefix, links)
    faq_html = ""
    if page.get("faqs"):
        items = "\n".join(
            f'<div class="faq-item"><h3>{html.escape(q)}</h3><p>{html.escape(a)}</p></div>'
            for q, a in page["faqs"]
        )
        faq_html = f'\n<h2>{html.escape(page.get("faq_heading", "Common Questions"))}</h2>\n{items}'

    if section == "services":
        mine = [j for j in sorted_jobs() if j["service"] == page["slug"]]
        recent = jobs_section(mine, prefix, links, f"Recent {page['short']} Jobs")
    elif section == "service-areas":
        town = page["slug"].removeprefix("junk-removal-").removesuffix("-ga")
        mine = [j for j in sorted_jobs() if j["city"] == town]
        recent = jobs_section(mine, prefix, links, f"Recent Jobs in {page['short']}")
    else:
        recent = ""

    cta = page.get("cta", ("Ready to Get Rid of It?", "Call or text for a free, no-obligation quote — photos help us price it fast."))
    out = (
        head(prefix, path, page["title"], page["description"], schemas)
        + "\n" + header(prefix, cfg["nav"]) + "\n\n<main id=\"main\">\n\n"
        + hero(prefix, page.get("hero", cfg["hero"]), crumbs, page.get("eyebrow", cfg["eyebrow"]), page["h1"], page["lede"])
        + f"""

  <section class="section">
    <div class="container">
      <article class="prose">
{body}{faq_html}
      </article>
    </div>
  </section>
{recent}
  <section class="section section-alt">
    <div class="container">
      <h2 class="text-center" style="margin-bottom:2rem;">Keep Reading</h2>
      <div class="grid grid-3">
{related_cards(page["related"], prefix, links)}
      </div>
    </div>
  </section>

{cta_band(*cta)}

</main>

""" + footer(prefix) + tail(prefix))
    return path, out, links


def build_guides_hub():
    """guides.html — a hub linking every long-form page, grouped by section."""
    prefix = ""
    path = "guides.html"
    links = []
    groups = [
        ("Junk Removal Guides", "Straight talk on clutter, cost, and getting rid of stuff the smart way.", "guides"),
        ("Junk Removal Questions, Answered in Depth", "Every question from our FAQ, expanded with real examples.", "faq"),
        ("About Red Top Scoopers", "Who we are and the standards we hold ourselves to.", "about"),
        ("Services", "Every kind of junk removal we handle.", "services"),
        ("Service Areas", "Towns and cities we haul junk from across Northwest Georgia and Metro Atlanta.", "service-areas"),
    ]
    sections_html = []
    for heading, intro, sec in groups:
        rels = [f"{sec}/{p['slug']}.html" for p in SECTIONS[sec]["module"].PAGES]
        sections_html.append(f"""  <section class="section{' section-alt' if len(sections_html) % 2 else ''}">
    <div class="container">
      <div class="text-center" style="max-width:640px; margin:0 auto 2rem;">
        <h2>{heading}</h2>
        <p>{intro}</p>
      </div>
      <div class="grid grid-3">
{related_cards(rels, prefix, links)}
      </div>
    </div>
  </section>""")

    crumbs = [("Home", "index.html"), ("Guides", path)]
    page = dict(h1="Junk Removal Guides & Resources", description="Guides, in-depth answers, and local info from Red Top Scoopers LLC — junk removal in Cartersville, Northwest Georgia & Metro Atlanta.")
    schemas = [business_schema(), breadcrumb_schema(crumbs)]
    out = (
        head(prefix, path, "Junk Removal Guides & Resources | Red Top Scoopers LLC", page["description"], schemas)
        + "\n" + header(prefix, None) + "\n\n<main id=\"main\">\n\n"
        + hero(prefix, "hero-home.jpg", crumbs, "Guides & Resources", page["h1"],
               "Everything we've written to help you clear out, clean up, and get your space back — from what junk removal costs to why decluttering feels so good.")
        + "\n\n" + "\n\n".join(sections_html) + "\n\n"
        + cta_band("Rather Just Have It Gone?", "Skip the reading — call or text and we'll handle it.")
        + "\n\n</main>\n\n" + footer(prefix) + tail(prefix)
    )
    return path, out, links


def build_recent_jobs():
    """recent-jobs.html — every job, newest first. Only built when jobs exist."""
    prefix, path, links = "", "recent-jobs.html", []
    crumbs = [("Home", "index.html"), ("Recent Jobs", path)]
    description = "Real junk removal jobs by Red Top Scoopers LLC across Cartersville, Bartow County, Northwest Georgia & Metro Atlanta — photos and details."
    cards = "\n".join(job_card(j, prefix, links) for j in sorted_jobs())
    out = (
        head(prefix, path, "Recent Junk Removal Jobs & Photos | Red Top Scoopers LLC", description,
             [business_schema(), breadcrumb_schema(crumbs)])
        + "\n" + header(prefix, None) + "\n\n<main id=\"main\">\n\n"
        + hero(prefix, "hero-home.jpg", crumbs, "Our Work", "Recent Junk Removal Jobs",
               "Real jobs, real photos — garages, estates, furniture, and more, cleared by our crew across Northwest Georgia and Metro Atlanta.")
        + f"""

  <section class="section">
    <div class="container">
      <div class="grid grid-3">
{cards}
      </div>
    </div>
  </section>

""" + cta_band("Want Your Space Back Too?", "Call or text a few photos for an upfront quote.")
        + "\n\n</main>\n\n" + footer(prefix) + tail(prefix)
    )
    return path, out, links


def load_dates():
    return json.loads(DATES_FILE.read_text()) if DATES_FILE.exists() else {}


def stamp(path, content, dates):
    """Return (content with real modified date, lastmod). Date only moves when content changes."""
    digest = hashlib.sha256(content.encode()).hexdigest()[:16]
    prev = dates.get(path)
    when = prev["date"] if prev and prev["hash"] == digest else TODAY
    dates[path] = {"hash": digest, "date": when}
    return content.replace(MODIFIED, when), when


FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.S)


def main():
    for section, cfg in SECTIONS.items():
        for page in cfg["module"].PAGES:
            REGISTRY[f"{section}/{page['slug']}.html"] = page

    outputs = []
    for section, cfg in SECTIONS.items():
        for page in cfg["module"].PAGES:
            outputs.append(build_page(section, page))
    outputs.append(build_guides_hub())
    recent_file = ROOT / "recent-jobs.html"
    if jobs.JOBS:
        outputs.append(build_recent_jobs())
    elif recent_file.exists():
        recent_file.unlink()

    old_dates = load_dates()
    dates = {}
    lastmod = {}

    # Write generated pages
    all_links = []
    for path, content, links in outputs:
        content, lastmod[path] = stamp(path, content, old_dates)
        dates[path] = old_dates[path]
        dest = ROOT / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
        all_links += [(path, ln) for ln in links]

    # Sync footer into hand-written pages
    for name in ROOT_PAGES:
        f = ROOT / name
        src = f.read_text(encoding="utf-8")
        new = FOOTER_RE.sub(lambda _: footer(""), src, count=1)
        if new != src:
            f.write_text(new, encoding="utf-8")
        _, lastmod[name] = stamp(name, new, old_dates)
        dates[name] = old_dates[name]

    # Check internal links
    broken = sorted({(src, ln) for src, ln in all_links if ln and not (ROOT / ln).exists()})
    if broken:
        for src, ln in broken:
            print(f"BROKEN LINK in {src}: {ln}")
        sys.exit(1)

    # Sitemap
    entries = [(p, pr) for p, pr in ROOT_PAGES.items()] + [("guides.html", "0.7")]
    if jobs.JOBS:
        entries.append(("recent-jobs.html", "0.7"))
    for section, cfg in SECTIONS.items():
        entries += [(f"{section}/{p['slug']}.html", cfg["priority"]) for p in cfg["module"].PAGES]
    urls = "\n".join(
        f"  <url>\n    <loc>{abs_url(p)}</loc>\n    <lastmod>{lastmod[p]}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n    <priority>{pr}</priority>\n  </url>"
        for p, pr in entries
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8",
    )

    DATES_FILE.write_text(json.dumps(dict(sorted(dates.items())), indent=1) + "\n", encoding="utf-8")

    words = sum(len(re.sub(r"<[^>]+>", " ", c).split()) for _, c, _ in outputs)
    print(f"Built {len(outputs)} pages (~{words:,} words incl. chrome), synced footer into {len(ROOT_PAGES)} pages, sitemap has {len(entries)} URLs.")


if __name__ == "__main__":
    main()
