# Telugu Devotional Studio - Comprehensive Testing Guide

## Overview

This guide provides step-by-step instructions to test all 8 steps of the Telugu Devotional Video Studio workflow, plus the Cost Tracking Dashboard and Settings Panel.

## Prerequisites

- Dev server running: `pnpm dev`
- Browser access to: `https://3000-i5jg2nn38e97533ejd1i7-1beb85d1.us2.manus.computer`
- Logged in with Manus OAuth

## Test Execution Plan

### Phase 1: Settings Panel & Cost Dashboard

#### Test 1.1: Settings Panel - API Keys
1. Click **Settings** in the top navigation
2. Navigate to **API Keys** tab
3. Enter test API keys:
   - OpenAI: `sk-test-123456789`
   - Claude: `sk-ant-test-123456789`
   - Gemini: `test-gemini-key`
4. Click **Save** and verify success message
5. Refresh page and verify keys are persisted (should show masked values)
6. **Expected**: Keys saved and displayed on next load

#### Test 1.2: Settings Panel - Provider Selection
1. In Settings, navigate to **Providers** tab
2. Select different providers:
   - Lyrics: Claude
   - Images: DALL-E
   - Videos: Pika
3. Click **Save**
4. **Expected**: Selections persist after page refresh

#### Test 1.3: Settings Panel - Budget Settings
1. In Settings, navigate to **Budget** tab
2. Set Monthly Budget: `$100`
3. Set Budget Reset Day: `15`
4. Click **Save**
5. **Expected**: Settings saved successfully

#### Test 1.4: Cost Dashboard - Budget Status
1. Click **Cost Dashboard** in main navigation (or Settings > Budget)
2. Verify display shows:
   - Monthly budget: `$100`
   - Current usage: `$0.00` (no generations yet)
   - Remaining: `$100.00`
   - Progress bar at 0%
3. **Expected**: Dashboard displays correctly with default values

---

### Phase 2: Step 1 - Deity Selector

#### Test 2.1: Select Predefined Deity
1. Start new project: Click **NEW PROJECT**
2. You should be on **STEP 1 OF 8 - SELECT DEITY**
3. In the input field, type: `Venkateswara`
4. Verify autocomplete suggestions appear
5. Click on **Venkateswara** from suggestions
6. Click **CONTINUE TO LYRICS**
7. **Expected**: Deity selected, proceed to Step 2

#### Test 2.2: Select Custom Deity
1. Return to Step 1 (click back or restart)
2. Type: `Hanuman` (custom deity not in predefined list)
3. Press Enter or click outside the input
4. Click **CONTINUE TO LYRICS**
5. **Expected**: Custom deity accepted, proceed to Step 2

#### Test 2.3: Deity Validation
1. Try to click **CONTINUE TO LYRICS** without selecting a deity
2. **Expected**: Button should be disabled or show error message

---

### Phase 3: Step 2 - Lyrics Generator

#### Test 3.1: AI Generate Lyrics
1. You should be on **STEP 2 OF 8 - WRITE LYRICS**
2. Select Theme: **Devotional**
3. Select Lyrics Length: **Medium** (50-100 words)
4. Click **AI GENERATE LYRICS**
5. Wait for generation (should show loading state)
6. **Expected**: Lyrics generated and displayed in text area

#### Test 3.2: Manual Lyrics Input
1. Clear the lyrics field
2. Paste custom lyrics:
   ```
   Oh divine lord, guide us through the darkness,
   With your eternal light and boundless grace,
   We bow before your sacred presence,
   In devotion, we find our peace.
   ```
3. Click **SAVE LYRICS**
4. **Expected**: Lyrics saved to project

#### Test 3.3: SUNO Style Generation
1. With lyrics in the field, click **GENERATE SUNO STYLE**
2. Wait for generation
3. **Expected**: SUNO style appears with:
   - Tempo (e.g., "120 BPM")
   - Mood (e.g., "Spiritual, Peaceful")
   - Instruments (e.g., "Sitar, Tabla, Flute")
   - Vocals (e.g., "Male, Devotional")

#### Test 3.4: Save SUNO Style Template
1. After SUNO style is generated, click **SAVE SUNO STYLE**
2. Enter template name: `Venkateswara Devotional`
3. Click **Save**
4. **Expected**: Template saved for future use

#### Test 3.5: Lyrics Length Control
1. Select different lengths:
   - **Short** (20-50 words)
   - **Medium** (50-100 words)
   - **Long** (100-200 words)
   - **Custom** (enter specific word count)
2. Click **AI GENERATE LYRICS** for each
3. **Expected**: Generated lyrics match the selected length

#### Test 3.6: Template Selection
1. Click **LOAD TEMPLATE**
2. Select a saved template (if any exist)
3. **Expected**: Template lyrics and SUNO style loaded

#### Test 3.7: Continue to Next Step
1. With lyrics and SUNO style generated, click **CONTINUE TO AUDIO**
2. **Expected**: Proceed to Step 3

---

### Phase 4: Step 3 - Audio Upload

#### Test 4.1: Upload Audio File
1. You should be on **STEP 3 OF 8 - AUDIO**
2. Click **SELECT FILE** or drag-and-drop an audio file
3. Select an MP3 or WAV file (test with a small file)
4. **Expected**: File uploaded, preview shows filename and duration

#### Test 4.2: Audio Preview
1. After upload, click **PLAY** button on the audio preview
2. **Expected**: Audio plays in browser

#### Test 4.3: Replace Audio
1. Click **SELECT FILE** again
2. Choose a different audio file
3. **Expected**: Previous file replaced with new one

#### Test 4.4: Continue to Next Step
1. With audio uploaded, click **CONTINUE TO MUSIC PROMPT**
2. **Expected**: Proceed to Step 4

---

### Phase 5: Step 4 - Music Prompt Guide

#### Test 5.1: View SUNO Style
1. You should be on **STEP 4 OF 8 - MUSIC PROMPT**
2. Verify SUNO style from Step 2 is displayed:
   - Tempo
   - Mood
   - Instruments
   - Vocals
3. **Expected**: All SUNO style details visible

#### Test 5.2: Edit SUNO Style
1. Click **EDIT** on any SUNO style field
2. Modify the value (e.g., change tempo from 120 to 140)
3. Click **SAVE**
4. **Expected**: Changes saved and displayed

#### Test 5.3: View Guide Content
1. Scroll down to see SUNO AI iteration tips
2. **Expected**: Tips and best practices displayed

#### Test 5.4: Continue to Next Step
1. Click **CONTINUE TO SCENES**
2. **Expected**: Proceed to Step 5

---

### Phase 6: Step 5 - Scene Breakdown

#### Test 6.1: Create Scene
1. You should be on **STEP 5 OF 8 - SCENE BREAKDOWN**
2. Click **ADD SCENE**
3. Enter scene description: `Deity appears in golden light`
4. Click **SAVE SCENE**
5. **Expected**: Scene added to list

#### Test 6.2: Edit Scene
1. Click **EDIT** on the created scene
2. Modify description: `Deity appears in golden light with celestial music`
3. Click **SAVE**
4. **Expected**: Scene updated

#### Test 6.3: Delete Scene
1. Click **DELETE** on a scene
2. Confirm deletion
3. **Expected**: Scene removed from list

#### Test 6.4: Multiple Scenes
1. Add 3-5 scenes for the video
2. **Expected**: All scenes displayed in order

#### Test 6.5: Continue to Next Step
1. Click **CONTINUE TO IMAGE PROMPTS**
2. **Expected**: Proceed to Step 6

---

### Phase 7: Step 6 - Image Prompts

#### Test 7.1: Generate Image Prompts
1. You should be on **STEP 6 OF 8 - IMAGE PROMPTS**
2. Click **AUTO-GENERATE PROMPTS**
3. **Expected**: Image prompts generated for each scene

#### Test 7.2: Edit Image Prompt
1. Click **EDIT** on an image prompt
2. Modify the prompt text
3. Click **SAVE**
4. **Expected**: Prompt updated

#### Test 7.3: View Prompt Templates
1. Click **LOAD TEMPLATE**
2. Select a template (if available)
3. **Expected**: Template prompts loaded

#### Test 7.4: Continue to Next Step
1. Click **CONTINUE TO VIDEO PROMPTS**
2. **Expected**: Proceed to Step 7

---

### Phase 8: Step 7 - Video Prompts

#### Test 8.1: Generate Video Prompts
1. You should be on **STEP 7 OF 8 - VIDEO PROMPTS**
2. Click **AUTO-GENERATE PROMPTS**
3. **Expected**: Video prompts generated for each scene

#### Test 8.2: Edit Video Prompt
1. Click **EDIT** on a video prompt
2. Modify the prompt text
3. Click **SAVE**
4. **Expected**: Prompt updated

#### Test 8.3: Continue to Next Step
1. Click **CONTINUE TO CAPCUT ASSEMBLY**
2. **Expected**: Proceed to Step 8

---

### Phase 9: Step 8 - CapCut Assembly

#### Test 9.1: View Assembly Guide
1. You should be on **STEP 8 OF 8 - CAPCUT ASSEMBLY**
2. Verify guide content displays:
   - Step-by-step instructions
   - Tips for assembly
   - Export recommendations
3. **Expected**: Guide content visible

#### Test 9.2: View Project Summary
1. Scroll down to see project summary
2. **Expected**: Summary shows all steps completed

#### Test 9.3: Export Project
1. Click **EXPORT TO YOUTUBE**
2. **Expected**: Proceed to Step 9 (YouTube Export)

---

### Phase 10: Step 9 - YouTube Export

#### Test 10.1: YouTube Metadata
1. You should be on **STEP 9 OF 8 - YOUTUBE EXPORT** (or final step)
2. Verify fields for:
   - Video Title
   - Description
   - Tags
   - Thumbnail
3. **Expected**: All fields available

#### Test 10.2: Save Project
1. Click **SAVE PROJECT**
2. **Expected**: Project saved with all steps completed

#### Test 10.3: Complete Workflow
1. Click **MARK COMPLETE** or **FINISH**
2. **Expected**: Project marked as completed

---

### Phase 11: Mobile Responsiveness Testing

#### Test 11.1: Mobile Layout (iPhone 12 - 390x844)
1. Open DevTools (F12)
2. Toggle Device Toolbar
3. Select iPhone 12
4. Navigate through all 8 steps
5. **Expected**: All elements responsive, no horizontal scroll

#### Test 11.2: Tablet Layout (iPad - 768x1024)
1. Select iPad in Device Toolbar
2. Navigate through all 8 steps
3. **Expected**: Layout optimized for tablet

#### Test 11.3: Touch Interactions
1. On mobile device or emulator, test:
   - Button taps (min 44x44px)
   - Input field focus
   - Drag-and-drop for file upload
2. **Expected**: All interactions work smoothly

---

### Phase 12: Cost Tracking Integration

#### Test 12.1: Cost Estimation
1. During any generation step, verify cost estimation displays
2. **Expected**: Estimated cost shown before generation

#### Test 12.2: Cost Logging
1. After generation, verify cost is logged
2. Check Cost Dashboard for updated totals
3. **Expected**: Cost added to monthly total

#### Test 12.3: Budget Alert
1. Set monthly budget to `$5`
2. Generate multiple items to exceed budget
3. **Expected**: Alert displays when budget exceeded

#### Test 12.4: Cost Breakdown
1. Open Cost Dashboard
2. Verify breakdown by:
   - Type (lyrics, images, videos)
   - Provider (ChatGPT, DALL-E, etc.)
3. **Expected**: Accurate cost breakdown displayed

---

### Phase 13: Background Job System

#### Test 13.1: Job Creation
1. During any generation, verify job is created
2. Check database for job record
3. **Expected**: Job created with correct status

#### Test 13.2: Job Tracking
1. Open browser console (F12)
2. Generate content
3. Watch job status change: `queued` → `processing` → `succeeded`
4. **Expected**: Job status updates correctly

#### Test 13.3: Job Retry
1. Simulate a failed job (if possible)
2. Verify retry mechanism activates
3. **Expected**: Job retried up to 3 times

---

### Phase 14: End-to-End Workflow

#### Test 14.1: Complete Devotional Video Creation
1. Start new project
2. Complete all 8 steps:
   - ✓ Step 1: Select Deity
   - ✓ Step 2: Generate Lyrics & SUNO Style
   - ✓ Step 3: Upload Audio
   - ✓ Step 4: Review Music Prompt
   - ✓ Step 5: Create Scenes
   - ✓ Step 6: Generate Image Prompts
   - ✓ Step 7: Generate Video Prompts
   - ✓ Step 8: View CapCut Assembly Guide
   - ✓ Step 9: YouTube Export
3. **Expected**: Complete workflow without errors

#### Test 14.2: Project Persistence
1. Complete a project
2. Refresh the page
3. Navigate to project history
4. **Expected**: Project data persists and loads correctly

#### Test 14.3: Multiple Projects
1. Create 2-3 different projects
2. Switch between them
3. **Expected**: Each project maintains its own state

---

## Bug Reporting Template

When you encounter an issue, please provide:

```
## Bug Report

**Title**: [Brief description]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [Third step]

**Expected Result**: [What should happen]

**Actual Result**: [What actually happened]

**Screenshots**: [If applicable]

**Environment**:
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile/Tablet]
- Screen Size: [e.g., 1920x1080]

**Severity**: [Critical/High/Medium/Low]
```

---

## Performance Testing

### Load Time Benchmarks
- Step 1 load: < 500ms
- Step 2 AI generation: < 5s
- Step 3 audio upload: < 10s (depends on file size)
- Cost Dashboard load: < 1s
- Settings Panel load: < 500ms

### Memory Usage
- Monitor DevTools Performance tab
- Check for memory leaks during navigation
- Verify smooth scrolling (60 FPS)

---

## Success Criteria

✅ **All tests pass** when:
- All 8 steps complete without errors
- Cost tracking accurately logs expenses
- Mobile responsiveness works on all screen sizes
- Background jobs process successfully
- Project data persists after refresh
- Settings and preferences save correctly
- No console errors or warnings

---

## Next Steps After Testing

1. Document any bugs found
2. Report issues with severity levels
3. Prioritize fixes based on impact
4. Schedule follow-up testing after fixes
5. Prepare for production deployment

---

## Contact & Support

For questions or issues during testing, please reach out with:
- Step number where issue occurred
- Browser and device information
- Screenshots or video recordings
- Exact error messages from console

Good luck with testing! 🚀
