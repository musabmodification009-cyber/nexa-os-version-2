# Loop Rules

These rules govern every iteration of the Ralph loop. The loop prompt references this file. Edit these rules to change how the loop behaves without changing the prompt.

---

## Execution Rules

1. Implement ONLY the selected story — do not touch unrelated code
2. Follow conventions in docs/agents.md
3. Follow visual standards in docs/design-guidelines.md
4. Max 250 lines per file — if a file would exceed this, extract components first
5. Every async operation needs a loading state and an error state
6. Design mobile-first for 390px viewport — stack elements vertically
7. Implement completely — no placeholders, no TODOs, no stubs
8. Do not create new components inside existing files — always separate files
9. Use barrel exports (index.ts) when creating module directories

---

## Integration Deferral

If a story has a requiresIntegration field, do NOT attempt to implement it. Instead:

1. Log the story ID, title, service name, and key needed to docs/deferred-integrations.md
2. Skip to the next eligible story
3. Do NOT mark the story as isPassed

If docs/deferred-integrations.md does not exist, create it with this format:

# Deferred Integrations

Stories skipped because they require API keys or external service configuration.

Handle these manually after the queue completes.

| Story ID | Title | Service | Key Needed |
|----------|-------|---------|------------|

Add one row per deferred story.

---

## Verification Procedures

After implementing a story, run the verification test defined in the story's verification object. This is mandatory — self-assessment is not sufficient.

### console-check

1. Open the relevant page in the browser preview
2. Open the browser console
3. Check for errors, warnings, and signs of infinite re-renders
4. The page must render completely with zero console errors
5. PASS = zero errors, page renders fully
6. FAIL = any console error, any blank/broken section, any infinite loop
7. Note: React strict mode double-renders are expected — these are NOT failures

### database

1. Execute the test described in the story's verification.test
2. This may involve inserting data, querying as different users, or checking RLS
3. Verify the exact expected result described in the test
4. PASS = data operation returns the expected result
5. FAIL = wrong result, access not enforced, or query error

### e2e

1. Execute the full user flow described in the story's verification.test step by step
2. At each step, confirm the expected behavior before proceeding
3. Complete the entire flow including any persistence/refresh checks
4. PASS = every step works as described
5. FAIL = any step produces unexpected behavior

### After running verification:

IF PASSED:

- Set the story's isPassed to true in the PRD file

IF FAILED:

- Attempt to fix the issue
- Re-run the verification test
- If it passes on retry, set isPassed to true
- If it STILL fails after one fix attempt:
  - Do NOT set isPassed to true
  - Add what failed and why to the story's notes field
  - Add the issue to docs/progress.md under Known Issues
  - Leave the story for the next iteration to retry

---

## File Update Rules

After every iteration, update these files:

### PRD file

- If verification passed: set isPassed to true
- If verification failed: leave isPassed as false, update the notes field with what went wrong

### docs/progress.md

- Update "Last Completed" with the story ID, title, and verification result
- Add any new issues under Known Issues
- Add any insights under Learnings
- Keep this file under 30 lines — prune old completed items that are no longer relevant

### docs/agents.md

- If you learned a pattern, gotcha, convention, or testing insight, add it
- Keep concise — under 40 lines total
- Organize by category (Build Conventions, Patterns, Mistakes, Testing Notes)

### docs/current-phase.json

- If ALL stories in the current PRD have isPassed: true:
  - Move the current PRD to completedPrds
  - Set currentPrd and currentPrdFile to the next PRD
  - If no more PRDs remain, set status to "complete"
