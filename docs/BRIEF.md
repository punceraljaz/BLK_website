# BRIEF — BLK Remodelling: package funnel hero

`Self-authored from a full client interview conducted in chat, not a live interview session. All decisions below are the client's own stated words or explicit choices made in a follow-up question round; nothing here is invented preference.`

## 1. Vibe

Three to five words: **editorial, premium, fullscreen, restrained.**

Client's own words: "I want to have an editorial effect or feel to it so I want the picture that will be animated by the scroll to be fullscreen that will add a nice premium effect to it." No named references were given; the aesthetic family is authored from that sentence as premium-minimal with an editorial (photography-forward, restrained-type) lean, not the cream-and-brass artisan default.

## 2. The scroll journey (client's own sequence)

BLK Remodelling (Ras Al Khaimah, UAE) sells four packages and explicitly wants the site to funnel most customers toward the fourth:

1. **Pure Furnishing** — the company furnishes an apartment that arrives completely empty.
2. **Basic Airbnb** — furniture plus appliances.
3. **Complete Airbnb** — everything down to cutlery, sheets and toilet paper, ready to rent from day one.
4. **Complete Renovation** — full teardown and reconfiguration: enlarge a bedroom, add or remove walls, repurpose a room. Flagship, most profitable, the business wants most leads to land here.

Client's original image was a single room morphing through all four states. On review, the only two real photos supplied turned out to be **two different units** (different flooring, different wall treatment), so a literal same-pixel-space morph would visibly break at the cut. Client chose, explicitly, to rebuild this as **four distinct, styled scenes sharing one design language** rather than force a continuity the assets cannot support, with real vs AI-generated/placeholder imagery to be reconciled later (client's words: "lets first do this and then later on we can do the kie.ai way and generate those missing stages").

## 3. Energy curve

Calm and plausible at the open, rising steadily, peaking hard at package 4 (the reconfiguration), which is also the close — the business's stated commercial priority sets the shape of the whole page.

## 4. Feeling curve (per act, emotion then cause)

```
1  Recognition   an empty shell, tile floor, bare walls — "this is where every unit starts"
2  Confidence     the same idea, now lived-in — furniture, appliances, a functioning home
3  Ease            a quiet assembled grid of what "complete" actually includes — no photo, no pitch, just the list arriving
4  Ambition (PEAK) a floorplan draws itself, then a wall visibly slides to a new position — the room becomes a different room
```

No two adjacent acts share a feeling. Act 3 is deliberately the quietest, most administrative beat on the page (an included-items list, not a claim) so act 4 has silence to arrive from.

## 5. The peak

> "the floorplan draws itself, then a wall slides across the page and the whole room is a different shape"

Lives in Act 4 (Complete Renovation). Gets the largest `data-sc-span`, the only genuinely bespoke asset on the page (the hand-built SVG floorplan), and the loudest CTA treatment, because Act 4 is also the page's close — hero-only scope, no further sections yet.

## 6. The one thing no other site does (signature move seed)

A scroll-driven architectural floorplan that draws its own walls, then redraws one of them into a new position as the visitor scrolls through the renovation package — the literal service (reconfiguring a room) enacted as the interaction, not illustrated by a stock photo.

## 7. Aesthetic range

Premium-minimal, editorial lean. Not brutalist, not maximalist, not playful. Explicitly avoiding the cream-and-brass artisan default (taste.md): palette is warm charcoal / stone ink with a single clay-terracotta accent, not brass/gold.

## 8. One unbroken world or distinct scenes

**Distinct scenes** — explicit client decision (see §2). Same copy-panel convention, same scrim/type system, same accent carried across all four, `drift` interpolates the page ground smoothly between acts so the *page* still reads as one continuous place even though the *photographic content* per act is honestly different.

## 9. Assets

- Act 1 ground: client's own photo, empty studio apartment (RAK unit), tile floor — real.
- Act 2 ground: client's own photo, a furnished studio (different unit) — real, used as the representative "furnished" reference per client's explicit approval.
- Act 3: no photo. Built as a typographic/iconographic inclusion list (`flow`+`in`), not a stock photo (licensing) and not a fake photo pretending to be real.
- Act 4: no photo. Built as a bespoke line-drawn SVG floorplan (the signature move) — architecturally honest to a service that has no "after" photo yet since nothing has been built.
- No `KIE_AI_API_KEY` available this session. AI-generated imagery for Acts 3–4 is a known, planned future swap, not attempted here.

## 10. Tell-someone sentence

**"It's the site where you scroll from an empty apartment to a fully-booked Airbnb, and then watch the floorplan itself redraw as a wall slides over for the renovation package."**

## 11. Authored silence

Act 3 is intentionally quiet and non-photographic — this is deliberate contrast before the peak, not missing content. Noted here so the verification pass does not flag it as dead scroll.
