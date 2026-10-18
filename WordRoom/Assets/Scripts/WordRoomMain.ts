/**
 * WordRoomMain -- Main game controller for WordRoom
 *
 * Owns: game lifecycle (learn -> quiz -> score), question ordering,
 *       answer checking, object highlighting, SFX playback.
 * @input: quizPanel (WordRoomQuizPanelUI), kitchenObjects[] (SceneObject[]),
 *         plus tunables for article colors, tag height, counter reference.
 * Must NOT: build UI surfaces, hold UI text refs.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import { WordRoomQuizPanelUI } from "./WordRoomQuizPanelUI"

// ── Asset references ─────────────────────────────────────────
const panPrefab = requireAsset("../GeneratedMeshes/Pan.glb") as ObjectPrefab
const ketelPrefab = requireAsset("../GeneratedMeshes/Ketel.glb") as ObjectPrefab
const snijplankPrefab = requireAsset("../GeneratedMeshes/Snijplank.glb") as ObjectPrefab
const mesPrefab = requireAsset("../GeneratedMeshes/Mes.glb") as ObjectPrefab
const glasPrefab = requireAsset("../GeneratedMeshes/Glas.glb") as ObjectPrefab
const bordPrefab = requireAsset("../GeneratedMeshes/Bord.glb") as ObjectPrefab

const correctSfx = requireAsset("../GeneratedSFX/CorrectSound.wav") as AudioTrackAsset
const wrongSfx = requireAsset("../GeneratedSFX/WrongSound.wav") as AudioTrackAsset

// Box mesh + material for tag backings and bottom lines
const boxMesh = requireAsset("../Box.mesh") as RenderMesh
const counterMat = requireAsset("../CounterMaterial.mat") as Material

// ── Word data ────────────────────────────────────────────────
interface WordEntry {
    article: string        // "de" or "het"
    noun: string           // Dutch noun
    prefab: ObjectPrefab   // GLB prefab
    aabbCm: vec3           // Known AABB dimensions
}

const WORDS: WordEntry[] = [
    { article: "de", noun: "pan", prefab: panPrefab, aabbCm: new vec3(28, 8.4, 18.4) },
    { article: "de", noun: "ketel", prefab: ketelPrefab, aabbCm: new vec3(20, 20, 19.2) },
    { article: "de", noun: "snijplank", prefab: snijplankPrefab, aabbCm: new vec3(30, 2, 20) },
    { article: "het", noun: "mes", prefab: mesPrefab, aabbCm: new vec3(30, 2.7, 4.8) },
    { article: "het", noun: "glas", prefab: glasPrefab, aabbCm: new vec3(8.8, 12, 8.8) },
    { article: "het", noun: "bord", prefab: bordPrefab, aabbCm: new vec3(25, 2.6, 25) },
]

const DE_COLOR = new vec4(0.29, 0.565, 0.851, 1)    // #4A90D9 blue
const HET_COLOR = new vec4(0.91, 0.569, 0.227, 1)   // #E8913A orange
const CORRECT_COLOR = new vec4(0.3, 0.9, 0.3, 1)    // Green ring
const ARROW_COLOR = new vec4(1.0, 0.86, 0.35, 1)    // Warm yellow hint arrow
const RING_SIZE_PER_CM = 33                         // Text size units per cm of ring diameter (measured in preview)
const DOT_COLOR = new vec4(0.92, 0.94, 1.0, 1)      // Neutral quiz-mode dot
const WHITE = new vec4(1, 1, 1, 1)

// Tag backing: soft frosted light tint (visible on additive display)
const TAG_BACKING_COLOR = new vec4(0.17, 0.19, 0.25, 0.82)

// Muted wood tone for snijplank runtime tint
const SNIJPLANK_TINT = new vec4(0.65, 0.5, 0.35, 1)

type GameMode = "learn" | "quiz" | "score"

// Quiz panel follow: distance ahead (cm), drop below eye level (cm), smoothing per frame
const PANEL_DISTANCE = 85
const PANEL_DROP = -12
const PANEL_FOLLOW = 0.06

@component
export class WordRoomMain extends BaseScriptComponent {
    @ui.label('<span style="color: #60A5FA;">WordRoomMain - Dutch vocabulary game</span>')
    @ui.separator

    @ui.group_start("References")
    @input
    @hint("Quiz panel UI module")
    quizPanel!: WordRoomQuizPanelUI

    @input
    @hint("Root SceneObject for the counter surface")
    counterRoot!: SceneObject
    @ui.group_end

    @ui.group_start("Settings")
    @input
    @hint("Height of floating word tags above objects (cm)")
    @widget(new SliderWidget(4, 20, 1))
    tagHeight: number = 7

    @input
    @hint("Total X spread for placing objects on counter (cm)")
    @widget(new SliderWidget(30, 150, 5))
    totalWidth: number = 55

    @input("vec4", "{0.29, 0.565, 0.851, 1}")
    @hint("Color for 'de' article tags")
    @widget(new ColorWidget())
    deArticleColor: vec4

    @input("vec4", "{0.91, 0.569, 0.227, 1}")
    @hint("Color for 'het' article tags")
    @widget(new ColorWidget())
    hetArticleColor: vec4
    @ui.group_end

    // ── Internal state ───────────────────────────────────────
    private mode: GameMode = "learn"
    private objectRoots: SceneObject[] = []
    private tagTexts: Text[] = []
    private tagRoots: SceneObject[] = []
    private interactables: Interactable[] = []
    private questionQueue: number[] = []
    private currentQuestion: number = -1
    private correctCount: number = 0
    private totalQuestions: number = 6
    private missedWords: number[] = []
    private missedThisQuestion: boolean = false
    private busy: boolean = false
    private tagFull: SceneObject[][] = []
    private tagDots: SceneObject[] = []
    private tagTimers: number[] = []

    // Audio components
    private correctAudio!: AudioComponent
    private wrongAudio!: AudioComponent

    // Camera ref for billboard
    private cameraTransform!: Transform

    onAwake() {
        if (!this.quizPanel || !this.counterRoot) {
            print("WordRoomMain: required @input not wired. Check Phase B.")
            return
        }

        // Find camera for billboard behavior
        this.findCamera()

        this.setupAudio()
        this.buildScene()

        // Billboard update loop: rotate all tagRoots to face camera each frame,
        // and let the quiz panel lazily follow the user's gaze along the counter
        this.createEvent("UpdateEvent").bind(() => {
            this.updateBillboards()
            this.updatePanelFollow()
        })

        // Defer event wiring to OnStartEvent so QuizPanel's onAwake has run
        this.createEvent("OnStartEvent").bind(() => {
            this.wireEvents()
            this.setMode("learn")
        })
    }

    private findCamera(): void {
        // Walk root objects to find one with a Camera component
        for (let i = 0; i < global.scene.getRootObjectsCount(); i++) {
            const root = global.scene.getRootObject(i)
            const cam = root.getComponent("Component.Camera")
            if (cam) {
                this.cameraTransform = root.getTransform()
                return
            }
        }
        // Fallback: use this script's transform (should not happen)
        print("WordRoomMain: WARN - no Camera found, billboard disabled")
        this.cameraTransform = this.getTransform()
    }

    private updateBillboards(): void {
        if (!this.cameraTransform) return
        const camPos = this.cameraTransform.getWorldPosition()

        for (const root of this.tagRoots) {
            if (!root.enabled) continue
            const tagPos = root.getTransform().getWorldPosition()
            const dir = camPos.sub(tagPos)
            // Zero out Y so tags only rotate on the Y axis (stay upright)
            const flatDir = new vec3(dir.x, 0, dir.z)
            if (flatDir.length > 0.01) {
                root.getTransform().setWorldRotation(quat.lookAt(flatDir, vec3.up()))
            }
        }
    }

    /** Keep the quiz panel in view: ~85 cm ahead along the gaze, a little below eye level, facing the user. */
    private updatePanelFollow(): void {
        if (!this.cameraTransform || !this.quizPanel) return
        const camPos = this.cameraTransform.getWorldPosition()
        const look = this.cameraTransform.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
        const flat = new vec3(look.x, 0, look.z)
        if (flat.length < 0.01) return
        const target = camPos.add(flat.normalize().uniformScale(PANEL_DISTANCE)).add(new vec3(0, PANEL_DROP, 0))
        const pt = this.quizPanel.getSceneObject().getTransform()
        const cur = pt.getWorldPosition()
        pt.setWorldPosition(vec3.lerp(cur, target, PANEL_FOLLOW))
        const toCam = camPos.sub(pt.getWorldPosition())
        const flatToCam = new vec3(toCam.x, 0, toCam.z)
        if (flatToCam.length > 0.01) pt.setWorldRotation(quat.lookAt(flatToCam, vec3.up()))
    }

    private logPanel(): void {
        const p = this.quizPanel.getSceneObject().getTransform().getWorldPosition()
        print(`[WordRoom] panel at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`)
    }

    private setupAudio(): void {
        // Correct sound
        const cObj = global.scene.createSceneObject("CorrectAudio")
        cObj.setParent(this.getSceneObject())
        this.correctAudio = cObj.createComponent("Component.AudioComponent") as AudioComponent
        this.correctAudio.audioTrack = correctSfx
        this.correctAudio.playbackMode = Audio.PlaybackMode.LowLatency

        // Wrong sound
        const wObj = global.scene.createSceneObject("WrongAudio")
        wObj.setParent(this.getSceneObject())
        this.wrongAudio = wObj.createComponent("Component.AudioComponent") as AudioComponent
        this.wrongAudio.audioTrack = wrongSfx
        this.wrongAudio.playbackMode = Audio.PlaybackMode.LowLatency
    }

    private buildScene(): void {
        // Counter surface is an editor-authored SceneObject (CounterSlab2)
        this.buildCounterSurface()

        // Place 6 objects spaced evenly along the counter's X axis
        const spacing = this.totalWidth / (WORDS.length - 1)
        const startX = -this.totalWidth / 2

        for (let i = 0; i < WORDS.length; i++) {
            const word = WORDS[i]
            const xPos = startX + i * spacing

            // Object wrapper (no physics collider -- SIK Interactable handles its own)
            const wrapper = global.scene.createSceneObject(`Obj_${word.noun}`)
            wrapper.setParent(this.counterRoot)
            // GLBs are grounded (pivot at the base), so the object sits on the counter top (slab top = +0.5 cm)
            wrapper.getTransform().setLocalPosition(new vec3(xPos, 0.6, 0))

            // Visual child (the GLB)
            const visual = word.prefab.instantiate(wrapper)
            visual.name = `${word.noun}_visual`

            // FIX 6A: Tint snijplank to muted wood tone at runtime
            if (word.noun === "snijplank") {
                this.tintMeshVisuals(visual, SNIJPLANK_TINT)
            }

            // FIX 6B: No Physics.ColliderComponent -- SIK Interactable handles interaction volumes

            // Add SIK Interactable
            const interactable = wrapper.createComponent(Interactable.getTypeName()) as Interactable
            this.interactables.push(interactable)

            // ── Floating word tag with backing ──────────────────
            const tagRoot = global.scene.createSceneObject(`Tag_${word.noun}`)
            tagRoot.setParent(wrapper)
            tagRoot.getTransform().setLocalPosition(new vec3(0, word.aabbCm.y + this.tagHeight, 0.5))

            const articleColor = word.article === "de" ? this.deArticleColor : this.hetArticleColor

            // Backing plate (frosted light rectangle behind text, using a box mesh)
            const backingObj = global.scene.createSceneObject(`TagBacking_${word.noun}`)
            backingObj.setParent(tagRoot)
            backingObj.getTransform().setLocalPosition(new vec3(0, 0, -0.15))
            backingObj.getTransform().setLocalScale(new vec3(12, 3.5, 0.1))
            const backingRmv = backingObj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
            backingRmv.mesh = boxMesh
            const backingMat = counterMat.clone()
            backingMat.mainPass.baseColor = TAG_BACKING_COLOR
            backingRmv.addMaterial(backingMat)

            // Bottom colored line in article color (thin box)
            const bottomLineObj = global.scene.createSceneObject(`TagLine_${word.noun}`)
            bottomLineObj.setParent(tagRoot)
            bottomLineObj.getTransform().setLocalPosition(new vec3(0, -1.55, -0.1))
            bottomLineObj.getTransform().setLocalScale(new vec3(12, 0.25, 0.08))
            const lineRmv = bottomLineObj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
            lineRmv.mesh = boxMesh
            const lineMat = counterMat.clone()
            lineMat.mainPass.baseColor = articleColor
            lineRmv.addMaterial(lineMat)

            // Label text (article in color + noun in white, rich text)
            const labelObj = global.scene.createSceneObject(`TagLabel_${word.noun}`)
            labelObj.setParent(tagRoot)
            labelObj.getTransform().setLocalPosition(new vec3(0, 0, 0))
            const tagText = labelObj.createComponent("Component.Text") as Text
            tagText.text = `<color=${this.colorToHex(articleColor)}>${word.article}</color> ${word.noun}`
            tagText.depthTest = true
            tagText.size = 42
            ;(tagText as Text & { weight?: number }).weight = 700
            tagText.horizontalAlignment = HorizontalAlignment.Center
            tagText.verticalAlignment = VerticalAlignment.Center
            tagText.horizontalOverflow = HorizontalOverflow.Overflow
            tagText.verticalOverflow = VerticalOverflow.Overflow
            tagText.textFill.color = WHITE
            tagText.enableRichText = true

            // Quiz-mode dot: a small neutral marker showing where the tag is, without the word
            const dotObj = global.scene.createSceneObject(`TagDot_${word.noun}`)
            dotObj.setParent(tagRoot)
            dotObj.getTransform().setLocalPosition(new vec3(0, -1.0, 0))
            const dotText = dotObj.createComponent("Component.Text") as Text
            dotText.text = "\u25CF"
            dotText.size = 60
            dotText.depthTest = true
            dotText.textFill.color = DOT_COLOR
            dotText.horizontalAlignment = HorizontalAlignment.Center
            dotText.verticalAlignment = VerticalAlignment.Center
            dotObj.enabled = false

            this.objectRoots.push(wrapper)
            this.tagTexts.push(tagText)
            this.tagRoots.push(tagRoot)
            this.tagFull.push([backingObj, bottomLineObj, labelObj])
            this.tagDots.push(dotObj)
            this.tagTimers.push(0)

            // Wire interaction
            const idx = i
            interactable.onTriggerEnd.add((event: InteractorEvent) => {
                this.onObjectPinched(idx)
            })
        }
    }

    /** FIX 6A helper: tint all RenderMeshVisual materials on a scene object tree */
    private tintMeshVisuals(obj: SceneObject, color: vec4): void {
        const rmv = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
        if (rmv) {
            const matCount = rmv.getMaterialsCount()
            const tinted: Material[] = []
            for (let m = 0; m < matCount; m++) {
                const mat = rmv.getMaterial(m).clone()
                mat.mainPass.baseColor = color
                tinted.push(mat)
            }
            rmv.clearMaterials()
            for (const mat of tinted) {
                rmv.addMaterial(mat)
            }
        }
        for (let c = 0; c < obj.getChildrenCount(); c++) {
            this.tintMeshVisuals(obj.getChild(c), color)
        }
    }

    private wireEvents(): void {
        this.quizPanel.onQuizStart.add(() => {
            this.startQuiz()
        })
        this.quizPanel.onPlayAgain.add(() => {
            this.startQuiz()
        })
    }

    private setMode(mode: GameMode): void {
        this.mode = mode
        this.logPanel()
        if (mode === "learn") {
            print("[WordRoom] learn mode")
            this.quizPanel.showLearnMode()
            this.showAllTags(true)
        } else if (mode === "quiz") {
            // Tags handled by shrinkTags
        } else if (mode === "score") {
            print(`[WordRoom] round over: ${this.correctCount}/${this.totalQuestions}; missed: [${this.missedWords.map(i => WORDS[i].noun).join(", ")}]`)
            this.quizPanel.showScoreMode(this.correctCount, this.totalQuestions)
            this.showAllTags(true)
        }
    }

    private startQuiz(): void {
        this.correctCount = 0
        this.totalQuestions = WORDS.length

        // Build question queue: missed words first, then rest shuffled
        this.questionQueue = []
        const missed = [...this.missedWords]
        const rest: number[] = []
        for (let i = 0; i < WORDS.length; i++) {
            if (!missed.includes(i)) rest.push(i)
        }
        this.shuffle(rest)
        this.shuffle(missed)
        this.questionQueue = [...missed, ...rest]
        print(`[WordRoom] quiz start; missed first: [${missed.map(i => WORDS[i].noun).join(", ")}]; order: [${this.questionQueue.map(i => WORDS[i].noun).join(", ")}]`)
        this.missedWords = []

        this.shrinkAllTags()
        this.mode = "quiz"
        this.nextQuestion()
    }

    private nextQuestion(): void {
        if (this.questionQueue.length === 0) {
            this.setMode("score")
            return
        }
        this.currentQuestion = this.questionQueue.shift()!
        this.missedThisQuestion = false
        const word = WORDS[this.currentQuestion]
        print(`[WordRoom] question: Waar is ${word.article} ${word.noun}?`)
        const question = `Waar is ${word.article} ${word.noun}?`
        this.quizPanel.showQuizMode(question)
    }

    private onObjectPinched(idx: number): void {
        if (this.mode !== "quiz") return

        if (this.busy) return
        const word = WORDS[idx]
        if (idx === this.currentQuestion) {
            // Correct: only a first-try answer counts toward the score
            if (!this.missedThisQuestion) this.correctCount++
            print(`[WordRoom] pinch ${word.article} ${word.noun}: CORRECT (score ${this.correctCount})`)
            this.busy = true
            this.correctAudio.play(1)
            this.flashCorrect(idx)
            this.showTagFor(idx, 1.4)

            const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
            delayEvent.bind(() => {
                this.busy = false
                this.nextQuestion()
            })
            delayEvent.reset(1.6)
        } else {
            // Wrong: the pinched object shakes and shows its own word; an arrow marks the right one
            print(`[WordRoom] pinch ${word.article} ${word.noun}: WRONG (asked ${WORDS[this.currentQuestion].noun})`)
            this.wrongAudio.play(1)
            this.missedThisQuestion = true
            if (!this.missedWords.includes(this.currentQuestion)) {
                this.missedWords.push(this.currentQuestion)
            }
            this.shakeObject(idx)
            this.showTagFor(idx, 2.0)
            this.showArrow(this.currentQuestion)
        }
    }

    private buildCounterSurface(): void {
        // Counter surface is a scene object (CounterSlab) added in the editor
        // under CounterRoot — no runtime creation needed.
    }

    // ── Visual feedback ──────────────────────────────────────
    /** Show a tag as the full label (article + noun) or as the small quiz-mode dot. */
    private setTagFull(idx: number, full: boolean): void {
        this.tagRoots[idx].enabled = true
        for (const part of this.tagFull[idx]) part.enabled = full
        this.tagDots[idx].enabled = !full
    }

    private showAllTags(visible: boolean): void {
        for (let i = 0; i < this.tagRoots.length; i++) {
            this.tagTimers[i]++
            if (visible) this.setTagFull(i, true)
            else this.tagRoots[i].enabled = false
        }
    }

    private shrinkAllTags(): void {
        for (let i = 0; i < this.tagRoots.length; i++) {
            this.tagTimers[i]++
            this.setTagFull(i, false)
        }
    }

    /** Bring a tag back as the full label for a while, then return it to a dot (if still in quiz mode). */
    private showTagFor(idx: number, seconds: number): void {
        const token = ++this.tagTimers[idx]
        this.setTagFull(idx, true)
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        delayEvent.bind(() => {
            if (this.tagTimers[idx] === token && this.mode === "quiz") this.setTagFull(idx, false)
        })
        delayEvent.reset(seconds)
    }

    private flashCorrect(idx: number): void {
        // Create a green ring around the correct object
        const wrapper = this.objectRoots[idx]
        const ringObj = global.scene.createSceneObject("GreenRing")
        ringObj.setParent(wrapper)
        ringObj.getTransform().setLocalPosition(new vec3(0, 0.4, 0))
        ringObj.getTransform().setLocalRotation(quat.fromEulerAngles(-Math.PI / 2, 0, 0))
        const size = WORDS[idx].aabbCm
        const diameterCm = Math.min(36, Math.max(12, 1.25 * Math.max(size.x, size.z)))

        const ringText = ringObj.createComponent("Component.Text") as Text
        ringText.text = "\u25EF"
        ringText.size = Math.round(diameterCm * RING_SIZE_PER_CM)
        ringText.depthTest = true
        ringText.textFill.color = CORRECT_COLOR
        ringText.horizontalAlignment = HorizontalAlignment.Center
        ringText.verticalAlignment = VerticalAlignment.Center

        // Remove after delay
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        delayEvent.bind(() => {
            ringObj.destroy()
        })
        delayEvent.reset(1.4)
    }


    private shakeObject(idx: number): void {
        const wrapper = this.objectRoots[idx]
        const transform = wrapper.getTransform()
        const origPos = transform.getLocalPosition()
        let shakeCount = 0
        const maxShakes = 16
        const shakeDist = 1.8

        const updateEvent = this.createEvent("UpdateEvent")
        updateEvent.bind(() => {
            shakeCount++
            if (shakeCount >= maxShakes) {
                transform.setLocalPosition(origPos)
                updateEvent.enabled = false
                return
            }
            const damp = 1 - shakeCount / maxShakes
            const offset = ((shakeCount % 2 === 0) ? shakeDist : -shakeDist) * damp
            transform.setLocalPosition(new vec3(origPos.x + offset, origPos.y, origPos.z))
        })
    }


    private showArrow(correctIdx: number): void {
        // Create an arrow text pointing toward the correct object
        const correctWrapper = this.objectRoots[correctIdx]
        const arrowObj = global.scene.createSceneObject("Arrow")
        arrowObj.setParent(correctWrapper)
        const arrowBaseY = WORDS[correctIdx].aabbCm.y + 5
        arrowObj.getTransform().setLocalPosition(new vec3(0, arrowBaseY, 0.5))
        let t = 0
        const bob = this.createEvent("UpdateEvent")
        bob.bind(() => {
            if (isNull(arrowObj)) { bob.enabled = false; return }
            t += getDeltaTime()
            arrowObj.getTransform().setLocalPosition(new vec3(0, arrowBaseY + 1.5 * Math.abs(Math.sin(t * 6)), 0.5))
        })

        const arrowText = arrowObj.createComponent("Component.Text") as Text
        arrowText.text = "\u25BC"
        arrowText.size = 220
        arrowText.depthTest = true
        arrowText.textFill.color = ARROW_COLOR
        arrowText.horizontalAlignment = HorizontalAlignment.Center
        arrowText.verticalAlignment = VerticalAlignment.Center

        // Remove after delay
        const delayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        delayEvent.bind(() => {
            bob.enabled = false
            arrowObj.destroy()
        })
        delayEvent.reset(2.0)
    }

    // ── Utilities ────────────────────────────────────────────
    private shuffle(arr: number[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const tmp = arr[i]
            arr[i] = arr[j]
            arr[j] = tmp
        }
    }

    private colorToHex(c: vec4): string {
        const r = Math.round(c.x * 255).toString(16).padStart(2, "0")
        const g = Math.round(c.y * 255).toString(16).padStart(2, "0")
        const b = Math.round(c.z * 255).toString(16).padStart(2, "0")
        return `#${r}${g}${b}`
    }
}
