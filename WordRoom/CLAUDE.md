@AGENTS.md

# WordRoom rules (Rui Codex)
- This project runs on **Lens Studio 5.23.2** (SPECS 27). Do NOT update Lens Studio.
- **Packages are pinned**: SpectaclesInteractionKit.lspkg (SIK 0.18.0), SpectaclesUIKit.lspkg, Motion.lspkg.
  Never install, update, replace, rename or remove a package. Never install LEAF, InteractionKit, UIKit (new names),
  AiPreviewAgentInspect, or anything from the Asset Library: the Asset Library serves 5.24 builds that import
  `InteractionKit.lspkg`/`UIKit.lspkg` and break compilation on 5.23.2.
- Do not use CaptureRuntimeViewTool, QueryRuntimeSceneTool or PreviewInteractTool (they auto-install AiPreviewAgentInspect). For screenshots use PreviewPanelTool
  action `screenshot`; for input use PreviewGestureTool / PreviewCameraTool.
