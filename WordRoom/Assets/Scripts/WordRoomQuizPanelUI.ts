/**
 * WordRoomQuizPanelUI -- Quiz panel UI module for WordRoom
 *
 * Owns: Quiz button (learn mode), question text (quiz mode),
 *       score display + Again button (score mode).
 * @input: none beyond tunables (self-contained panel).
 * Must NOT: hold game state, make game decisions, import game modules.
 *
 * Public API (Main -> UI):
 *   showLearnMode()       -- show Quiz button only
 *   showQuizMode(q: string) -- show question text
 *   showScoreMode(correct: number, total: number) -- show results
 *   setQuestion(q: string) -- update question text mid-quiz
 *
 * Public Events (UI -> Main):
 *   onQuizStart   -- user tapped "Start Quiz"
 *   onPlayAgain   -- user tapped "Again"
 */

import { BackPlate } from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import { Button } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"

// ── Typography ────────────────────────────────────────────────
const FONT_SIZE_SCALE = 1.0

type TextRole =
    | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
    | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"

const TYPE_SCALE: Record<TextRole, { size: number; weight: number }> = {
    Title1: { size: 105, weight: 700 },
    Title2: { size: 93, weight: 700 },
    HeadlineXL: { size: 62, weight: 700 },
    Headline1: { size: 54, weight: 700 },
    Headline2: { size: 48, weight: 700 },
    Subheadline: { size: 41, weight: 700 },
    Button: { size: 39, weight: 500 },
    Callout: { size: 39, weight: 700 },
    Body: { size: 39, weight: 500 },
    Caption: { size: 38, weight: 500 },
}

function applyTextRole(t: Text, role: TextRole): void {
    t.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE
    ;(t as Text & { weight?: number }).weight = TYPE_SCALE[role].weight
}

// ── Layout constants ──────────────────────────────────────────
const PANEL_W = 26
const BUTTON_LABEL_Z = 0.08

@component
export class WordRoomQuizPanelUI extends BaseScriptComponent {
    @ui.label('<span style="color: #60A5FA;">WordRoomQuizPanelUI - Quiz/Score panel</span>')
    @ui.separator

    @ui.group_start("Settings")
    @input("vec4", "{0.45, 0.9, 0.55, 1}")
    @hint("Color for the score number")
    @widget(new ColorWidget())
    scoreColor: vec4
    @ui.group_end

    // ── Events (UI -> Main) ──────────────────────────────────
    private _onQuizStart = new Event<void>()
    private _onPlayAgain = new Event<void>()
    get onQuizStart(): PublicApi<void> { return this._onQuizStart.publicApi() }
    get onPlayAgain(): PublicApi<void> { return this._onPlayAgain.publicApi() }

    // ── Internal refs ────────────────────────────────────────
    private learnRoot!: SceneObject
    private quizRoot!: SceneObject
    private scoreRoot!: SceneObject
    private questionText!: Text
    private scoreText!: Text

    onAwake() {
        this.sceneObject.createComponent("Component.Canvas")

        const bp = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
        bp.size = new vec2(PANEL_W, 8)

        const content = this.createChild(this.sceneObject, "Content", new vec3(0, 0, 0.6))

        // ── Learn mode: Quiz button ──────────────────────────
        this.learnRoot = this.createChild(content, "LearnMode", vec3.zero())
        this.addButton(this.learnRoot, "Start Quiz", 14, 3.5, () => {
            this._onQuizStart.invoke()
        })

        // ── Quiz mode: question text ─────────────────────────
        this.quizRoot = this.createChild(content, "QuizMode", vec3.zero())
        this.questionText = this.addText(this.quizRoot, "Waar is de pan?", "HeadlineXL",
            new vec4(1, 1, 1, 1), PANEL_W - 3)
        this.quizRoot.enabled = false

        // ── Score mode: score + Again button ─────────────────
        this.scoreRoot = this.createChild(content, "ScoreMode", vec3.zero())

        const scoreLabelObj = this.createChild(this.scoreRoot, "ScoreLabel", new vec3(0, 2.5, 0))
        this.addText(scoreLabelObj, "Score", "Subheadline", new vec4(1, 1, 1, 0.75), 10)

        const scoreNumObj = this.createChild(this.scoreRoot, "ScoreNum", new vec3(0, 0, 0))
        this.scoreText = this.addText(scoreNumObj, "6/6", "Title1", this.scoreColor, 10)

        const againObj = this.createChild(this.scoreRoot, "AgainBtn", new vec3(0, -3.5, 0))
        this.addButton(againObj, "Again", 10, 3, () => {
            this._onPlayAgain.invoke()
        })
        this.scoreRoot.enabled = false
    }

    // ── Public API (Main -> UI) ──────────────────────────────
    showLearnMode(): void {
        this.learnRoot.enabled = true
        this.quizRoot.enabled = false
        this.scoreRoot.enabled = false
    }

    showQuizMode(question: string): void {
        this.learnRoot.enabled = false
        this.quizRoot.enabled = true
        this.scoreRoot.enabled = false
        if (this.questionText) this.questionText.text = question
    }

    showScoreMode(correct: number, total: number): void {
        this.learnRoot.enabled = false
        this.quizRoot.enabled = false
        this.scoreRoot.enabled = true
        if (this.scoreText) this.scoreText.text = `${correct}/${total}`
    }

    setQuestion(question: string): void {
        if (this.questionText) this.questionText.text = question
    }

    // ── Helpers ──────────────────────────────────────────────
    private createChild(parent: SceneObject, name: string, pos: vec3): SceneObject {
        const so = global.scene.createSceneObject(name)
        so.setParent(parent)
        so.getTransform().setLocalPosition(pos)
        return so
    }

    private addText(parent: SceneObject, text: string, role: TextRole, color: vec4, width: number): Text {
        const t = parent.createComponent("Component.Text") as Text
        t.text = text
        t.depthTest = true
        applyTextRole(t, role)
        t.textFill.color = color
        t.horizontalAlignment = HorizontalAlignment.Center
        t.verticalAlignment = VerticalAlignment.Center
        t.horizontalOverflow = HorizontalOverflow.Wrap
        t.verticalOverflow = VerticalOverflow.Overflow
        t.layoutRect = Rect.create(-width / 2, width / 2, -2, 2)
        return t
    }

    private addButton(parent: SceneObject, label: string, w: number, h: number, onClick: () => void): void {
        const btnObj = this.createChild(parent, label, vec3.zero())
        const btn = btnObj.createComponent(Button.getTypeName()) as Button
        btn.size = new vec3(w, h, 1)

        // Button label
        const labelSO = this.createChild(btnObj, "BtnLabel", new vec3(0, 0, BUTTON_LABEL_Z))
        const t = labelSO.createComponent("Component.Text") as Text
        t.text = label
        t.depthTest = true
        applyTextRole(t, "Button")
        t.horizontalAlignment = HorizontalAlignment.Center
        t.verticalAlignment = VerticalAlignment.Center
        t.horizontalOverflow = HorizontalOverflow.Overflow
        t.verticalOverflow = VerticalOverflow.Overflow
        t.layoutRect = Rect.create(-(w - 0.5) / 2, (w - 0.5) / 2, -1.2, 1.2)

        btn.onTriggerUp.add(onClick)
    }
}
