# Premium hero depth

## Standing preference

For hero-led marketing websites, **layering is part of the baseline, not an optional polish pass**. A beautiful full-screen photograph with one parallax transform and some text fades can still feel flat. Design a memorable spatial relationship in the hero from the beginning, rather than waiting to be asked for more depth.

This preference applies to the hero, not to every section of every website. Preserve the requested brand, content, framework, and functionality. Honor explicit static or simpler directions. Working surfaces such as dashboards do not need an invented marketing hero.

## Plan the depth before generating assets

- Plan the hero back to front before generating assets. For a rich opening scene, start with about five candidate planes, such as a far plate, distant atmosphere, midground or subject, near ground, and foreground detail. Keep only the planes that help the composition.
- List each plane with a relative depth from far to near and its intended motion, size, or focus. Check that the middle has a visible step between the far backdrop and foreground. Spread the motion and scale cues across that range, and keep planes that share a physical anchor moving together.
- Give the visitor a clear visual payoff during a short scroll sequence. For example: the camera moves into a scene, the headline recedes behind a subject, a second narrative beat appears, and the scene settles into the next section.
- Choose the sequence for the brand. The Sonder mountains, red dress, five planes, second headline, and gallery-frame exit are an example, not a mandatory template.
- Layering must change perceived depth. Several stacked elements moving as one image do not meet this preference. Use visibly different translation or scale rates, occlusion, and near/far relationships.
- Keep the initial composition compelling and the full headline readable. Do not sacrifice comprehension just to prove that a subject can cover text.

## Prepare real compositing assets

Use supplied photography or authorized image-generation tools. For a photographic scene:

1. Create a clean background plate with the extracted subject removed and the space behind it rebuilt. Otherwise the moving cutout exposes a duplicate person or an empty hole.
2. Isolate the subject and relevant foreground into genuine alpha cutouts. Inspect the alpha channel; a generated checkerboard or white backdrop is not transparency.
3. Preserve framing, scale, lighting, color, and camera perspective. Separately generated layers often need measured alignment even when the prompt requested identical placement.
4. Keep shared contact points anchored. A person should remain on the rock, a product on its plinth, and a wheel on the road. Shared translation and a common contact-point pivot can support different layer scales without making the subject float.
5. Inspect cutout edges against contrasting backgrounds and through the motion. Remove matte halos, jagged edges, clipped fabric, and foreground seams using the permitted asset workflow. Retain originals and optimize delivery files without losing alpha.

Atmosphere can occupy both a rear and a front plane when it supports the scene. It should create separation, not obscure the subject or wash out the whole image.

## Choreograph restrained motion

- Use one coherent camera idea and purposeful transitions. Premium means controlled movement and good timing, not constant movement everywhere.
- Native sticky scrolling with independently transformed planes can provide depth without WebGL or a generated video. Choose heavier tools only when they improve the requested experience.
- Keep essential copy and calls to action as semantic HTML. Establish deliberate layer order for typography, subject, foreground, and atmosphere.
- Prefer composited transforms and opacity, a shared scroll progress value, and requestAnimationFrame updates. Avoid rendering the whole page again on every scroll tick.
- Subtle pointer response is optional. It must not be the only way to experience the hero. Never capture or lock the desktop cursor for this effect.
- Pause offscreen ambient work. Honor reduced-motion preferences and provide a usable static composition without extra pinned scroll space or hidden essential content.
- Load the required scene assets together before switching from a complete poster fallback. Avoid partial scenes, flashes, ghost subjects, or a broken hero when a layer fails.

## Art-direct mobile separately

Do not merely shrink the desktop composition. Adjust crop, subject position, contact-point pivot, type size, layer order, travel, and scroll duration as needed. Typography may sit above the subject on mobile even when it passes behind the subject on desktop. Preserve depth without hiding the headline, pushing the subject offscreen, or causing horizontal overflow.

## Acceptance

Use the verification tools and permissions applicable to the build. Inspect the actual opening, an intermediate scroll position, the final hero transition, and the mobile composition. Check:

- Distinct layers visibly move at different rates, with clear separation between the far, middle, and near planes.
- No duplicate subjects, holes, cutout halos, floating contact points, or abrupt seams appear.
- The opening headline is readable, and the scroll produces a clear change in what the visitor sees or understands.
- The scene resolves cleanly into the next section.
- Mobile and motion-off states remain complete and usable.
- Assets load, and controls still work.

A successful build or transform unit test alone does not prove the visual effect is good. If visual verification could not be performed, state that limit instead of claiming it was checked.

## Approved example: Sonder Studio

On September 4, 2026, the original single-image hero was judged premium but lacking layers and wow factor. The approved revision has separate mountains, rear clouds, woman and red dress, volcanic ground, and foreground mist; different depth rates; a shared foot anchor; typography behind the subject; a second scroll beat; and a gallery-frame transition.

Local implementation, when available: `OtherWorlds/sonder-studio/` in the author’s optional example workspace. See `components/SceneHero.tsx`, `lib/scene-motion.ts`, and `VERIFICATION.md` for the worked example. The principles above are self-contained; this path is optional reference material.


## Further approved examples

The [ten-site rebuild](approved-collection.md) extends these principles to
products, community, software, advisory, hospitality, objects, and editorial
experiences. Read it for rendering choices and the complete delivery gate.
