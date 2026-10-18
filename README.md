# WordRoom: learn Dutch words where they live

A Lens for **SPECS** (Snap's AR glasses), made for the Devpost hackathon **Learn AR with SPECS**.

WordRoom puts a kitchen counter in front of you with six everyday objects at real size, each carrying its Dutch word:
the article in colour (blue *de*, orange *het*), then the noun. Pinch **Start Quiz** and the room becomes the test:
"Waar is het mes?". Look at the object and pinch it.

- Right: a green ring around the object, and its word.
- Wrong: the object you picked shows its own word, and an arrow points at the right one.
- After six questions you get a score. **Again** starts a new round with the missed words first.

Built with AI assistance using Snap's CLAD and the Lens Studio MCP.

## Open it
1. Install **Lens Studio 5.23.2** from [ar.snap.com/older-versions](https://ar.snap.com/older-versions).
   The project was built and tested on 5.23.2 (SPECS 27 target).
2. Clone the repo with Git LFS installed (`git lfs install` first): models and packages are stored in LFS.
3. In Lens Studio: **File > Open Project** and choose `WordRoom/WordRoom.esproj`.
4. In the Preview panel, choose **Interactive** with device **SPECS 27**. Use WASD to move and right-drag to look
   around; a click acts as a pinch.

Do not update the packages in `WordRoom/Packages`. The current Asset Library versions target Lens Studio 5.24
and do not compile in 5.23.2.

## Repository
- `WordRoom/`: the Lens Studio project
  - `Assets/Scripts/WordRoomMain.ts`: game flow (learn, quiz, score), objects, tags, feedback
  - `Assets/Scripts/WordRoomQuizPanelUI.ts`: the quiz panel (Start Quiz, question, score, Again)
  - `Assets/GeneratedMeshes/`: the six kitchen objects
- `WordRoom/devpost/`: planning and review documents
  - `design-brief.md`: the approved design brief from the Devpost Learn skill pack
  - `manual-tests.md`: preview test checklist and results
  - `judge-notes.md`: the design review pass and its fixes
- `docs/concept.md`: early concept notes

## Pre-existing work used
- **Specs Base Template** from Snap's [specs-devs/samples](https://github.com/specs-devs/samples), tag `5.22.0`
- Snap packages: **SpectaclesInteractionKit 0.18.0**, **SpectaclesUIKit**, **Motion** (from the template / Lens Studio)
- Lens Studio's built-in Interactive Preview scene ("Sunlit Room") for testing
- 3D models generated during the hackathon with SPECS text-to-3D, and Fast3D for the plate
- The Devpost Learn skill pack (`challengepost/learn-specs`) and Snap's CLAD plugin (`lens-studio-devs/ls-extensions`),
  used for planning and building

All WordRoom scripts, the word list, the scene layout and the planning documents were created during the
submission period (October 2026).

© 2026 Rui Codex
