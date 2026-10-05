"""About pages -> about/<slug>.html (Our Story + one page per value)

NOTE: our-story is written only from facts already on the site. Add real founder
names, the year you started, and the story behind the name before relying on it.
"""

PAGES = [
    dict(
        slug="our-story",
        short="Our Story",
        blurb="How a Cartersville crew set out to make junk removal fast, fair, and easy to book.",
        title="Our Story | Red Top Scoopers LLC, Cartersville Junk Removal",
        description="The story of Red Top Scoopers LLC — a locally owned, licensed & insured junk removal company from Cartersville, GA serving Northwest Georgia & Metro Atlanta.",
        h1="Our Story: A Cartersville Crew With a Simple Idea",
        lede="Junk removal should be fast, fair, and easy to book. That idea is the whole reason Red Top Scoopers exists.",
        body="""
## It Started Right Here in Cartersville

Red Top Scoopers LLC is a hometown business. We started in Cartersville, Georgia, in the heart of Bartow County, a few miles from the shores of Lake Allatoona and the red clay hills that give this part of the state its character. We weren't a franchise that picked a dot on a map. We were locals who kept seeing the same problem over and over, and we decided to fix it.

The problem was simple: **getting rid of junk was way harder than it should be.**

## The Problem We Kept Running Into

Think about the last time you needed to get rid of something big: a couch, an old fridge, a garage full of stuff after a move. Your options probably looked something like this:

- **Do it yourself.** Borrow or rent a truck, recruit a friend with a strong back, load it, drive to the landfill, wait in line, pay the fee, unload it, and return the truck. There goes your Saturday. We wrote a whole guide on [why that trip is worse than it sounds](/guides/skip-the-landfill-trip.html).
- **Try to sell or give it away.** List it, answer messages, get stood up, and eventually realize nobody wants a 2008 sectional. More on that in [sell, donate, or haul it away?](/guides/sell-donate-or-haul-it-away.html)
- **Call a big national company.** Wait on hold, fill out an online form, get a vague price range, and hope the number on the invoice matches what you were told.

None of those felt right to us. Folks around here deserved something better: a local crew you could call or text directly, get a straight price from, and trust to show up and handle everything.

## So We Built the Junk Removal Company We'd Want to Hire

From day one, we built Red Top Scoopers around a few simple rules:

1. **Call or text and talk to a real person.** No call centers, no quote forms, no bots. Just call or text [404-649-4654](tel:+14046494654), and you're talking to the crew that's actually coming out.
2. **Give an honest price before we start.** We quote by the job, upfront. The price we agree on is the price you pay. That's our [upfront pricing promise](/about/upfront-pricing.html).
3. **Do all the lifting.** You point; we carry. Nothing has to be dragged to the curb. See [why you don't need to move anything](/faq/do-i-need-to-move-items-to-the-curb.html).
4. **Treat every home like our own grandmother's house.** Careful carrying, no scuffed walls, and a broom-swept floor when we leave. That's [respect for your property](/about/respect-for-your-property.html).
5. **Keep good stuff out of the landfill.** If it can be donated or recycled, we try. That's our [donate and recycle first](/about/donate-and-recycle.html) commitment.
6. **Be legit.** Fully [licensed and insured](/about/licensed-and-insured.html), every job, no exceptions.

## Why "Scoopers"?

Because that's what we do. We show up, scoop up everything you don't want, and leave you with your space back. A garage you can park in again. A spare room that's actually a spare room. A rental ready for the next tenant. A parent's house ready for the next chapter.

## More Than Hauling Junk

The longer we do this, the more we realize our job isn't really about junk. It's about what happens **after** the junk is gone.

We've seen a widow finally walk through her late husband's workshop again once the clutter was cleared. We've seen landlords get a property back on the market a week sooner. We've seen families exhale when a house full of a loved one's belongings was handled with care instead of chaos. And we've seen people say, standing in an empty garage, "I didn't realize how much that was weighing on me."

That last one stuck with us so much that we wrote a guide on it: [how decluttering affects your mental health](/guides/decluttering-and-mental-health.html). Clearing out a space really can lift a weight that has nothing to do with pounds.

## Growing Across Northwest Georgia

We started in Cartersville, and as word got around, so did our trucks. Today we serve all of Bartow County, including [Adairsville](/service-areas/junk-removal-adairsville-ga.html), [Kingston](/service-areas/junk-removal-kingston-ga.html), [Euharlee](/service-areas/junk-removal-euharlee-ga.html), [Emerson](/service-areas/junk-removal-emerson-ga.html), [White](/service-areas/junk-removal-white-ga.html), and [Taylorsville](/service-areas/junk-removal-taylorsville-ga.html). We also cover [Rome](/service-areas/junk-removal-rome-ga.html), [Calhoun](/service-areas/junk-removal-calhoun-ga.html), [Rockmart](/service-areas/junk-removal-rockmart-ga.html), and [Dallas](/service-areas/junk-removal-dallas-ga.html), and down I-75 into Metro Atlanta: [Acworth](/service-areas/junk-removal-acworth-ga.html), [Kennesaw](/service-areas/junk-removal-kennesaw-ga.html), [Woodstock](/service-areas/junk-removal-woodstock-ga.html), and [Marietta](/service-areas/junk-removal-marietta-ga.html).

We've grown, but the rules haven't changed. Same phone number. Same upfront pricing. Same crew mentality.

## What We Haul

Today we handle everything from a single mattress to a full estate:

- [Residential junk removal](/services/residential-junk-removal.html)
- [Furniture removal](/services/furniture-removal.html)
- [Appliance removal](/services/appliance-removal.html)
- [Garage, attic, and basement cleanouts](/services/garage-attic-basement-cleanouts.html)
- [Estate and foreclosure cleanouts](/services/estate-foreclosure-cleanouts.html)
- [Construction and renovation debris](/services/construction-debris-removal.html)
- [Yard waste and storm debris](/services/yard-waste-storm-debris-removal.html)
- [Hoarding and heavy clutter cleanup](/services/hoarding-cleanup.html)
- [Commercial and office cleanouts](/services/commercial-office-cleanouts.html)

## Come Be Part of the Story

Every job we do adds to this story. If you've got a garage you can't park in, a room you avoid, or a property that needs to be cleared, call or text us. We'd love to help you get your space back.
""",
        cta=("Let's Write the Next Chapter Together", "Call or text the Red Top Scoopers crew directly — no call centers, ever."),
        related=["about/upfront-pricing.html", "about/respect-for-your-property.html", "guides/decluttering-and-mental-health.html"],
    ),
    dict(
        slug="licensed-and-insured",
        short="Licensed & Insured",
        blurb="Why hiring a licensed, insured junk removal company protects you — and how we do it.",
        title="Licensed & Insured Junk Removal | Red Top Scoopers LLC",
        description="Red Top Scoopers LLC is a fully licensed & insured junk removal company in Cartersville, GA. Learn why that matters and what it protects you from.",
        h1="Licensed & Insured: Protection on Every Job",
        lede="When a crew is carrying heavy furniture through your home, you want to know who's responsible if something goes wrong. With us, that answer is clear.",
        body="""
## Why "Licensed & Insured" Isn't Just a Slogan

Every junk removal company says it. Not every one means it. Junk removal is physical, heavy work done inside people's homes and businesses. Refrigerators get carried down stairs. Sectionals get pivoted through doorways. Debris gets loaded onto trucks parked in driveways. Most of the time, all of that goes smoothly. But "most of the time" isn't a guarantee, and how a company is set up decides who's on the hook when something goes sideways.

Red Top Scoopers LLC is a **registered Georgia limited liability company** that operates **fully licensed and insured** on every job. Here's what that means for you.

## What "Licensed" Means

A licensed business is registered and legally permitted to operate. In practice, it means:

- **We're a real business you can look up.** We're not a guy with a truck and a Craigslist ad who might vanish tomorrow.
- **We operate under the rules** that apply to businesses in our area.
- **We're accountable.** If there's ever a problem, there's a business entity, a name, a phone number, and a reputation on the line.

## What "Insured" Means

Insurance is the part that actually protects you financially. When a junk removal company carries proper insurance:

- **If your property gets damaged** during the job, like a gouged floor, a cracked door frame, or a dented garage door, there's coverage to make it right. You're not stuck chasing an uninsured hauler for money.
- **You're not left exposed** if something goes wrong on your property. When an uninsured crew works on your property, the risk can end up landing on the property owner.

We hope you never need any of that. We take a lot of care to make sure you don't. Read about [how we respect your property](/about/respect-for-your-property.html). But it's there, every job, because you shouldn't have to gamble.

## The Real Risk of Hiring Cheap and Uninsured

There's always someone offering to haul junk for less. Sometimes that works out. But here's what can go wrong with an unlicensed, uninsured hauler:

- **Damage with no recourse.** If they break something, you may be on your own.
- **Illegal dumping.** Some low-cost haulers save money by dumping loads on back roads or in vacant lots. When illegally dumped junk can be traced back to you, it can become your problem.
- **No-shows and disappearing acts.** No business behind the truck means no accountability.

We go deeper on how to protect yourself in our FAQ guide: [how to check whether a junk removal company is licensed and insured](/faq/are-you-licensed-and-insured.html).

## Why It Matters for Businesses and Property Managers

If you manage commercial property, rentals, or job sites, you likely already require vendors to be licensed and insured. We regularly work with property managers, landlords, contractors, and businesses. See [commercial junk removal](/services/commercial-office-cleanouts.html), [construction debris removal](/services/construction-debris-removal.html), and [foreclosure cleanouts](/services/estate-foreclosure-cleanouts.html).

## Part of a Bigger Commitment

Being licensed and insured is one of the four core values we built this company on, along with [upfront pricing](/about/upfront-pricing.html), [respect for your property](/about/respect-for-your-property.html), and [donating and recycling first](/about/donate-and-recycle.html). Read the full [Red Top Scoopers story](/about/our-story.html) to see where these values came from.
""",
        related=["faq/are-you-licensed-and-insured.html", "about/respect-for-your-property.html", "about/our-story.html"],
    ),
    dict(
        slug="upfront-pricing",
        short="Upfront Pricing",
        blurb="We quote by the job before we start — no hourly meter, no surprise fees later.",
        title="Upfront Junk Removal Pricing, No Hidden Fees | Red Top Scoopers",
        description="Red Top Scoopers gives upfront, by-the-job junk removal quotes in Cartersville & Metro Atlanta — no hourly billing, no hidden fees. Text photos to 404-649-4654.",
        h1="Upfront Pricing: The Price We Quote Is the Price You Pay",
        lede="No hourly meter. No mystery fees on the invoice. You get a straight price before we lift a single thing.",
        body="""
## The Problem With How Junk Removal Is Often Priced

Ask a few junk removal companies what they charge and you'll hear some version of "it depends." That's true. Pricing really does depend on what you've got. But "it depends" too often turns into an invoice that looks nothing like the number you heard on the phone. Fuel surcharges, labor fees, stair fees, and "heavy item" charges appear out of nowhere after the work is done, when you're in no position to say no.

We think that's backwards. At Red Top Scoopers, **you get the price before we start, and that's the price you pay.**

## How Our Upfront Pricing Works

1. **Tell us what you've got.** Call or text [404-649-4654](sms:+14046494654). Photos are the fastest way. A few pictures of the pile, the room, or the items tell us almost everything we need.
2. **We give you a quote.** We'll give you a straight price based on what we see and what you tell us about access.
3. **You decide.** No pressure. If the price works, we get you on the schedule. If it doesn't, no hard feelings.
4. **We confirm on-site before we start.** When we arrive, we'll take a quick look to make sure the job matches what we quoted. If it does, which is most of the time, we get to work at that price.
5. **If something's different, we talk first.** If there's significantly more than described, we tell you **before** we start loading, and you decide what to do. We never surprise you after the fact.

## What Goes Into a Junk Removal Price

We don't post fixed prices online because no two jobs are the same. Here's what actually drives the price:

- **Volume.** How much space your items take up in the truck. This is the biggest factor.
- **Weight.** Dense materials like concrete, dirt, shingles, and tile cost more to dispose of than the same volume of furniture.
- **Access.** A recliner on a ground-floor porch is easier than a sleeper sofa from a third-floor walk-up.
- **Item type.** Some items, like certain appliances, have specific disposal requirements.
- **Disposal costs.** Landfill and transfer station fees are built into your quote, not added later.

For a deeper dive with examples, read [how much does junk removal cost?](/faq/how-much-does-junk-removal-cost.html)

## Why We Don't Charge by the Hour

Hourly billing rewards slow work. It also makes it impossible for you to know what you'll pay until the job's done. **By-the-job pricing** puts the incentive in the right place. We're motivated to work efficiently and carefully, and you know your total upfront.

## Fair Doesn't Mean Cheapest

We won't always be the lowest number you find. A guy with a pickup and no insurance can undercut anyone. What we offer is a fair price from a [licensed and insured](/about/licensed-and-insured.html) crew that [treats your home with respect](/about/respect-for-your-property.html), [donates what it can](/about/donate-and-recycle.html), and charges exactly what it said it would.

## Compare It to Doing It Yourself

When you add up truck rental, gas, landfill fees, and your time, DIY junk removal often costs more than people expect. See our breakdown in [skip the landfill trip](/guides/skip-the-landfill-trip.html).
""",
        related=["faq/how-much-does-junk-removal-cost.html", "guides/skip-the-landfill-trip.html", "about/licensed-and-insured.html"],
    ),
    dict(
        slug="respect-for-your-property",
        short="Respect for Your Property",
        blurb="Careful loading, protected floors and walls, and a broom-swept finish on every job.",
        title="Respect for Your Property | Careful Junk Removal | Red Top Scoopers",
        description="Red Top Scoopers treats every home like our own — careful carrying, protected floors & walls, broom-swept cleanup. Junk removal in Cartersville & Metro Atlanta.",
        h1="Respect for Your Property: We Treat Your Home Like Ours",
        lede="Getting junk out shouldn't mean scuffed walls, gouged floors, or a mess left behind. Careful work is part of the job, not an extra.",
        body="""
## Hauling Junk Without Damaging the House

It's an easy thing to overlook until it happens. A crew in a hurry drags a dresser down the hallway, and now there's a stripe on the wall. A fridge gets wheeled across hardwood without protection. A couch leg catches the door frame. The junk is gone, but you've got a repair bill.

At Red Top Scoopers, careful work isn't an upgrade. **It's how every job is done.**

## What Respect for Your Property Looks Like

### We Plan the Path Out

Before moving anything big, our crew looks at the route: doorways, turns, stairwells, railings, and the path to the truck. Thirty seconds of planning prevents most damage.

### We Carry, Not Drag

Heavy items get lifted and carried, or moved on appropriate equipment. We don't drag them across floors.

### We Break It Down When It Helps

Removing legs, cushions, drawers, or doors from furniture can make the difference between a clean exit and a gouged door frame. If something can safely come apart, we take it apart.

### We Watch the Details

Banisters, door frames, light fixtures, low ceilings, landscaping beds, and freshly painted walls all get attention. We'll move a potted plant rather than squeeze past it.

### We Clean Up

When the junk is gone, we sweep the area where it was. You're left with a clean, usable space, not dust bunnies and debris. See [do I need to move items to the curb?](/faq/do-i-need-to-move-items-to-the-curb.html) for what full-service means.

## Respect Goes Beyond Walls and Floors

Respecting your property also means respecting **your stuff** and **your situation**.

- **We only take what you tell us to take.** If you're unsure about something, we set it aside instead of guessing.
- **We watch for valuables.** During [estate cleanouts](/services/estate-foreclosure-cleanouts.html) and [hoarding cleanups](/services/hoarding-cleanup.html), cash, jewelry, photos, and documents often turn up. We hand them to you.
- **We keep it discreet.** What we see in your home stays between us.
- **We're respectful of your neighbors.** We park considerately, keep noise reasonable, and don't block driveways longer than necessary.
- **We respect your time.** We show up when we say we will and keep you posted if anything changes.

## And If Something Does Go Wrong?

Accidents are rare, but we're realistic. That's exactly why we're [licensed and insured](/about/licensed-and-insured.html). If something gets damaged, we own it and make it right.

## Why It Matters to Us

We're a local company, and our reputation lives in our neighbors' living rooms. Every home we leave in great shape is a referral. Every scuffed wall would be a story told at the next cookout. Read more about [how we got started](/about/our-story.html) and what we stand for.
""",
        related=["about/licensed-and-insured.html", "services/estate-foreclosure-cleanouts.html", "faq/do-i-need-to-move-items-to-the-curb.html"],
    ),
    dict(
        slug="donate-and-recycle",
        short="Donate & Recycle First",
        blurb="Whenever possible, usable items get donated or recycled instead of dumped.",
        title="Eco-Friendly Junk Removal: Donate & Recycle | Red Top Scoopers",
        description="Red Top Scoopers donates and recycles usable furniture, appliances & household items whenever possible. Eco-conscious junk removal in Cartersville & Metro Atlanta.",
        h1="Donate & Recycle First: Keeping Good Stuff Out of the Landfill",
        lede="A lot of what people call junk still has life left in it. Whenever possible, we make sure it goes to someone who can use it.",
        body="""
## Junk to You Can Be Treasure to Someone Else

A dining set you've outgrown might be exactly what a young family needs. A working washer that doesn't match your new dryer still washes clothes. A box of kitchenware, linens, kids' books, or tools can be a big help to someone starting over. Sending all of that to a landfill is a waste, both of the item and of landfill space that doesn't come back.

That's why **donate and recycle first** is one of our four core values.

## How It Works on a Typical Job

1. **We load everything you want gone.** You don't have to sort, though if you already know what should be donated, tell us.
2. **We separate what's usable.** Furniture, household goods, clothing, and other items in good condition get set aside.
3. **Donations go to local organizations** that accept them, whenever possible.
4. **Recyclables get recycled.** Metal, appliances, cardboard, and certain electronics go to recycling and scrap facilities when they can.
5. **Only what's left goes to the landfill.** True junk that can't be reused or recycled gets disposed of properly, never dumped illegally.

## What Commonly Gets Donated

- Furniture in good condition: dressers, tables, chairs, bookshelves, and bed frames
- Kitchenware, dishes, and small appliances that work
- Clothing, shoes, linens, and blankets
- Books, toys, and games
- Tools and hardware
- Office furniture that's still usable, often welcomed by schools, churches, and nonprofits

## What Commonly Gets Recycled

- **Appliances.** Refrigerators, washers, dryers, and water heaters are mostly steel. See [appliance removal](/services/appliance-removal.html).
- **Scrap metal.** Bed frames, metal shelving, grills, and bikes
- **Cardboard** from moving boxes and packaging
- **Certain electronics**
- **Clean yard waste**, which can often be composted or mulched. See [yard waste removal](/services/yard-waste-storm-debris-removal.html).

## Being Honest About Limits

We want to be straightforward. **Not everything can be donated.** Donation centers have their own rules. Many won't accept upholstered furniture with stains, tears, or pet hair. Most won't take used mattresses. Particleboard furniture often doesn't survive a move. Outdated electronics have little reuse value. And some days, local donation centers are simply full.

So we say **"whenever possible,"** and we mean it. We make a real effort, but we won't pretend that every item finds a second home. What we will promise is that nothing we haul gets dumped illegally on a back road.

## Why Not Just Donate It Yourself?

You absolutely can, and if you have the time and a vehicle, it's great. But many people find that the donation drop-off becomes another errand that never happens. The bags sit in the trunk for weeks. The dresser won't fit in the car. Then the donation center turns away half of it anyway. Our guide on [whether to sell, donate, or haul it away](/guides/sell-donate-or-haul-it-away.html) walks through when each option makes sense.

## Part of Who We Are

Donating and recycling first is part of a bigger set of commitments: [upfront pricing](/about/upfront-pricing.html), [respect for your property](/about/respect-for-your-property.html), and being [licensed and insured](/about/licensed-and-insured.html). Read [our story](/about/our-story.html) to see where it all comes from.
""",
        related=["guides/sell-donate-or-haul-it-away.html", "services/appliance-removal.html", "about/our-story.html"],
    ),
]
