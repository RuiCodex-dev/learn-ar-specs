---
status: approved
---

# Design brief: WordRoom

## The one spatial moment
You're standing at the kitchen counter, maybe waiting for water to boil. Six everyday objects sit in front of you, each with a small floating Dutch label — article in colour, noun in white. You read them, then hit Quiz and the room becomes the test: "Waar is de ketel?" You look along the counter, pinch the right one, and the place itself teaches you the word.

## Why it belongs on glasses
- Uses: draws in the world, leaves your body free
- Why it's better than the phone or laptop version: A word list on a phone teaches a word apart from the thing it names. On glasses the Dutch word lives on the object, so the place becomes the memory — the method of loci. Your hands stay free to cook or move around, and you quiz yourself by looking and reaching, not scrolling.

## Product or overlay
- Type: product (virtual counter and objects placed in the room)
- What the real version would sense: on real glasses, the user would pinch real objects to drop tags on them (world anchoring), but that's not part of this build
- Stand-in for the preview: a virtual counter with six virtual kitchen objects at real scale, placed in the room in front of the user at start. No recognition needed.

## Where things live
- Where the user is looking during the main task: straight ahead and slightly down, along the counter
- Virtual counter: arm's length in front of the user (~70 cm), a little below eye level (~90 cm height), real kitchen-counter scale
- Six kitchen objects on the counter: de pan, de ketel, de snijplank, het mes, het glas, het bord — three de, three het, spaced along the counter so each is distinct and pinchable
- Word tags: small rounded labels ~12 cm wide, floating 10–15 cm above each object, billboarding to face the user. Article in colour (blue for de, orange for het) then noun in white, clean sans-serif, readable from ~1 m. Soft frosted lightly-lit backing (no black box — additive display), thin coloured line along the bottom in the article colour
- Quiz panel: a small panel at one end of the counter, showing the Quiz button in learn mode, the question during quiz mode, and the score at the end

## Hands and input
- Start quiz: pinch the Quiz button on the panel
- Answer a question: pinch the object you think is correct. Each object is a big, forgiving target that highlights when aimed at
- Start a new round: pinch the Again button on the score panel
- No voice, no grab, no drag — just pinch

## When things show
- Learn mode (start): all six tags visible with article + noun. Quiz panel shows the Quiz button
- Quiz mode: tags shrink to small dots above each object (position hint, no words). The panel shows "Waar is de/het ...?" for one object at a time
- Correct answer: green ring on the object, confirmation sound, the spoken Dutch word (if TTS works in the preview; otherwise sound only), the tag briefly reappears with article + noun, then the next question
- Wrong answer: the wrong object shakes gently and its own tag flashes (so you learn that word too), a small arrow points toward the correct object. The question stays until the user gets it right
- End of round: the panel shows the score (e.g. "5 / 6") and an Again button. Words missed come back first in the next round
- If something needs attention out of view: not expected — all six objects and the panel are on the counter in front of the user

## Done criteria
Each one can be checked in Lens Studio's preview.
1. On start, a counter at real height stands about an arm's length in front of the user, a little below eye level, with six kitchen objects on it. Each object shows its tag with the article in blue (de) or orange (het) and the noun in white.
2. Pinching the Quiz button shrinks all six tags to dots and the panel asks "Waar is de/het ...?" for one of the six objects.
3. Pinching the correct object shows a green ring, plays a confirmation sound and the spoken Dutch word if it works in the preview, briefly brings that tag back, and then moves to the next question.
4. Pinching a wrong object makes that object shake and flashes its own tag, and an arrow points toward the correct one. The question stays until the user gets it right.
5. After six questions the panel shows the score (e.g. "5 / 6") and an Again button. Pressing Again starts a new round where the words missed come first.

## Out of scope
- Recognizing real objects or dropping tags on them (future real-glasses feature)
- Syncing with LetsLearn's spaced-repetition data
- More than six objects or multiple word sets
- Persistent memory across sessions
- Multiplayer or shared Lens

## Risks and open questions
- Spoken Dutch word on correct answer: TTS may not work in the preview. If it doesn't, a confirmation sound alone is fine — the tag reappears with the word so the learner still sees it.
- Feel unproven: comfort of reading small tags at arm's length on real glasses, real hand-tracking reliability for pinching objects on a counter.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- The six kitchen objects should look like a real kitchen — use 3D models (not abstract shapes) at real scale.
- Blue (#4A90D9) for "de" and orange (#E8913A) for "het" (default). Both colours on light frosted backing. Colour is never the only signal — the article word is always written.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
