# WordRoom: manual test checklist (Lens Studio preview)

Run on 2026-10-18 in Lens Studio 5.23.2, Interactive Preview, device SPECS 27, scene "Sunlit Room".
Input was driven through the Lens Studio MCP preview tools: `MovePreviewCamera` turns the view toward
an object (like turning your head), and `InjectPreviewGesture` presses and releases at the centre of the view
(like a pinch on what you look at). Results come from the Lens's own `[WordRoom]` log lines plus the
recorded preview footage.

The LEAF test framework is not used. Its current Asset Library package targets Lens Studio 5.24 and does not
compile in 5.23.2.

| # | Done criterion (design brief) | What was done | Result |
|---|---|---|---|
| T1 | On start: counter in front, six objects, each with a tag (article in blue/orange, noun in white) | Reset the Lens and looked along the counter from left to right | PASS: `learn mode`; all six tags visible on their objects |
| T2 | Pinching **Start Quiz** turns tags into dots and asks "Waar is de/het …?" | Looked at the panel and pinched the button | PASS: `quiz start`, then `question: Waar is het mes?`; tags show as dots |
| T3 | Correct pinch: green ring, sound, the tag comes back, then the next question | Pinched the asked object for all six questions | PASS (6/6): `CORRECT`; green ring on the counter around the object; tag reappears; the next question follows after 1.6 s |
| T4 | Wrong pinch: that object shakes, its own tag flashes, an arrow points at the right one, and the question stays | Pinched a wrong object on questions 1 and 3 | PASS (2/2): `WRONG`; the pinched object wobbles and shows its own word; a yellow arrow bobs over the right object; the question is unchanged until the right pinch |
| T5 | After six questions: score and an **Again** button | Finished the round | PASS: `round over: 4/6; missed: [mes, bord]`; the panel shows **4/6** and **Again** |
| T6 | **Again** starts a new round with the missed words first | Pinched Again | PASS: `quiz start; missed first: [mes, bord]; order: [mes, bord, glas, pan, snijplank, ketel]` |

Scoring rule: only a first-try answer counts. A word answered after a wrong pinch is not counted and comes
back first in the next round. Before this test pass, every round could only score 6/6, because a correct pinch
after a wrong one still counted.

## Labels (from the brief's "judge it" step)

- **Logic proven** (tests + preview): learn → quiz → score → Again loop; missed words first; feedback for
  correct and wrong pinches; the quiz panel follows your gaze along the counter so the question stays in view.
- **Feel unproven** (needs real glasses): reading comfort of tags at about 70 cm, real hand-tracking pinch on
  objects lying on a counter, and how often users have to turn their head along a 1.4 m counter.
- **No test**: spoken Dutch word (not built; the brief allows sound only).
