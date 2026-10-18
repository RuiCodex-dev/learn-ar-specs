# WordRoom: "judge it" pass and design fixes (2026-10-18)

These are the brief's "After the build: judge it" steps, done in Interactive Preview. Every fix below was made
because of something seen in the preview.

## The three questions
- **Uses what I'm looking at?** Yes. The quiz asks about the object in front of you, and you answer by looking
  at it and pinching.
- **Puts something in my space, where it belongs?** Yes. Each word sits on its own object on a counter at real
  scale.
- **Frees my hands / eyes up?** Yes. You only look and pinch; nothing is held.
- **Just as good on a phone?** No. On a phone the word is separate from the thing it names. Here the word lives
  on the object, so the place itself becomes the memory aid.

## What the pass found, and what changed
| Found in preview | Change |
|---|---|
| Only 2 of 6 objects were in view at 80 cm, and the counter was out of frame | Counter moved to 70 cm (the brief's number), 1.5 m long, objects 23 cm apart; the user looks along the counter, as the brief's "one spatial moment" says |
| The question panel left the view when you turned toward the outer objects | The panel now follows your gaze along the counter (85 cm ahead, 12 cm below eye level), so the question is always readable |
| Objects floated 5 to 12 cm above the counter | Objects now sit on the counter top |
| The knife was a 30 cm upright slab | New SPECS text-to-3D knife ("chef's knife, side view"), scaled to 30 cm and lying flat |
| White nouns were unreadable on the light tag backing | Translucent slate backing; noun in white, article in blue/orange, plus a coloured underline |
| The quiz "dots" were invisible (tags shrunk to 5 %) | Real dots: each tag shows a small white dot during the quiz |
| The green ring was a filled disc covering the object | A ring on the counter around the object, sized to the object |
| The wrong-answer arrow was tiny and the shake was hard to see | Bigger bobbing yellow arrow; a clearer, damped wobble |
| A correct pinch after a wrong one still counted, so every round scored 6/6 | Only first-try answers count; missed words come first in the next round |
| Pinching twice during the 1.6 s pause could skip a question | Input is ignored while moving to the next question |
| The question text was small | Larger question text and a wider panel |

## Brief deviations (deliberate)
- Tags float 7 cm above each object, not 10 to 15 cm. The SPECS field of view is narrow, and 7 cm keeps the
  word in view while you look at the object.
- The quiz panel sits in front of the counter and follows your gaze, rather than at one end of the counter, so
  the question never leaves view.
- No spoken Dutch word; the brief allows a sound instead.
