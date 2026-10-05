"""Recent jobs — real jobs only, with real photos (and the customer's OK to post them).

Each job shows up automatically on:
  - its city page      (service-areas/junk-removal-<city>-ga.html)
  - its service page   (services/<service>.html)
  - recent-jobs.html   (built only once this list has at least one job)

How to add one:
  1. Save photos into images/jobs/ (JPG, about 1200px wide — resize on export).
     Avoid showing house numbers, license plates, or people's faces.
  2. Copy the example below, uncomment it, and fill it in.
  3. Run: python3 tools/build_pages.py

Fields:
  date     "YYYY-MM-DD"
  city     the town part of a service-area slug: cartersville, rome, acworth, kennesaw,
           woodstock, marietta, dallas, rockmart, euharlee, emerson, kingston,
           adairsville, white, taylorsville, calhoun
  service  a service slug: residential-junk-removal, furniture-removal, appliance-removal,
           garage-attic-basement-cleanouts, estate-foreclosure-cleanouts,
           construction-debris-removal, yard-waste-storm-debris-removal,
           hoarding-cleanup, commercial-office-cleanouts
  title    short headline, e.g. "Two-Car Garage Cleanout"
  summary  1–3 sentences: what it was, how much, anything notable (stairs, donations, deadline)
  photos   list of (filename in images/jobs/, alt text, optional label like "Before"/"After")
"""

JOBS = [
    # dict(
    #     date="2026-10-12",
    #     city="acworth",
    #     service="garage-attic-basement-cleanouts",
    #     title="Two-Car Garage Cleanout",
    #     summary="Ten years of boxes, two old bikes, and a dead chest freezer — about two truckloads. "
    #             "The bikes and a set of shelves went to donation, and the homeowner parked inside that night.",
    #     photos=[
    #         ("acworth-garage-before.jpg", "Cluttered two-car garage in Acworth before cleanout", "Before"),
    #         ("acworth-garage-after.jpg", "Same Acworth garage swept and empty after cleanout", "After"),
    #     ],
    # ),
]
