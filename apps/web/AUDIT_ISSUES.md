# Virelle Studios - Full Audit Issue List

## Already Fixed (Previous Pass)
1. [FIXED] LLM `thinking` mode incompatible with `response_format: json_schema` - conditional now
2. [FIXED] Missing `character.list` endpoint - added to router
3. [FIXED] Tools TabsContent was outside `</Tabs>` - moved inside
4. [FIXED] Broken JSX comment syntax (missing `}`)
5. [FIXED] BudgetEstimator.tsx TypeScript errors (null handling)
6. [FIXED] `server/_core/index.ts` Map iteration error (Array.from)
7. [FIXED] `routers.ts` line ~416 content type error (string vs array)
8. [FIXED] Mobile responsiveness: grid-cols-4 → grid-cols-2 sm:grid-cols-4 (stats)
9. [FIXED] Mobile responsiveness: grid-cols-3 → grid-cols-1 sm:grid-cols-3 (NewProject, AI char dialogs, StoryEditor)
10. [FIXED] Mobile responsiveness: Characters page header buttons flex-wrap
11. [FIXED] Mobile responsiveness: TabsList h-auto for wrapping

## Remaining Issues to Investigate
- [ ] Check all remaining frontend pages for issues (Storyboard, SceneEditor, ScriptEditor, ColorGrading, Credits, ShotList, ContinuityCheck, LocationScout, MoodBoard, Subtitles, DialogueEditor, SoundEffects, VisualEffects, Collaboration, Login, Register, Settings, Landing)
- [ ] Check directorAssistant.ts tool_calls handling (assistant message missing tool_calls property)
- [ ] Verify all tRPC endpoints match frontend calls
- [ ] Check for any remaining mobile responsiveness issues
