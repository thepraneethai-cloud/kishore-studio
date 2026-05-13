# Kishore's Studio - Complete Rebuild TODO

## Phase 1: Database Schema ✅
- [x] Existing project initialized with web-db-user

## Phase 2: Database Schema ✅
- [x] Create `projects` table (id, userId, name, type, status, createdAt, updatedAt)
- [x] Create `jobs` table (id, projectId, type, status, input, output, cost, createdAt, completedAt)
- [x] Create `userSettings` table (userId, lyricsProvider, imageProvider, videoProvider, apiKeys)
- [x] Create `costTracking` table (userId, provider, type, cost, date)
- [x] Create `scenes` table (projectId, sceneNumber, description, imagePrompt, videoPrompt, urls)

## Phase 3: Mobile-First UI
- [x] Rebuild App.tsx with mobile-first layout (sidebar already responsive)
- [x] Create responsive navigation (bottom nav on mobile, sidebar on desktop) - Implemented MobileBottomNav
- [x] Implement mobile-optimized components (using useIsMobile hook)
- [x] Add touch-friendly buttons and inputs (Tailwind responsive utilities applied)
- [ ] Test responsiveness on phone/tablet/desktop

## Phase 4: Settings Panel ✅
- [x] Build Settings page with tabs
- [x] Add API key input for ChatGPT, Claude, Gemini
- [x] Add API key input for Flux, DALL-E, Midjourney
- [x] Add API key input for Runway, Grok, Pika
- [x] Provider selection dropdowns
- [x] Budget limit settings
- [ ] Cost tracking dashboard

## Phase 5: Background Job System ✅
- [x] Create job queue service
- [x] Implement job polling mechanism
- [ ] Add job status tracking UI
- [x] Implement job retry logic
- [ ] Add notifications for job completion
- [x] Persist jobs in database
- [x] Audio upload backend with S3 storage

## Phase 6: Multi-AI Integration
- [x] Add provider abstraction layer (providers.ts with types and registry)
- [x] Integrate ChatGPT API for lyrics (chatgpt.ts provider)
- [x] Integrate Claude API for lyrics (claude.ts provider)
- [ ] Integrate Gemini API for lyrics
- [x] Integrate Flux API for images (images.ts provider)
- [x] Integrate DALL-E API for images (images.ts provider)
- [ ] Integrate Runway API for videos
- [ ] Create unified provider router in generation.ts

## Phase 7: Cost Tracking
- [ ] Implement cost calculation per generation
- [ ] Track cost per provider
- [ ] Create cost dashboard
- [ ] Add budget alerts
- [ ] Implement cost estimation before generation
- [ ] Add cost breakdown reports

## Phase 8: Devotional Mode ✅
- [x] Rebuild Step 1: Deity Selector (mobile-optimized, fixed deity key normalization)
- [x] Rebuild Step 2: Lyrics Generator with ChatGPT + SUNO Style generation
- [x] Rebuild Step 3: Audio Upload (renamed from SUNO Style, with drag-drop and preview)
- [x] Rebuild Step 4: Music Prompt Guide (Glassmorphism theme applied)
- [x] Rebuild Step 5: Scene Breakdown (Glassmorphism theme applied)
- [x] Rebuild Step 6: Image Prompts (Glassmorphism theme applied)
- [x] Rebuild Step 7: Video Prompts (Glassmorphism theme applied)
- [x] Rebuild Step 8: CapCut Assembly Guide (Glassmorphism theme applied)
- [x] Rebuild Step 9: YouTube Export (Glassmorphism theme applied)

## Phase 9: Story/Mythology Mode
- [ ] Create Story Selector (Ramayana, Mahabharata, Mythology, Custom)
- [ ] Build Story Summary Input
- [ ] Implement auto-scene generation from story
- [ ] Create scene editor
- [ ] Generate image prompts from scenes
- [ ] Generate video prompts from scenes
- [ ] Batch generate images/videos

## Phase 10: Workflow Optimization (15-20 min)
- [ ] Optimize Step 1 (1 min)
- [ ] Optimize Step 2 with ChatGPT (2 min)
- [ ] Optimize Step 3 (1 min)
- [ ] Optimize Steps 4-7 (1 min auto-generation)
- [ ] Background batch generation (async, no waiting)
- [ ] Add progress tracking
- [ ] Add time estimates

## Phase 11: Testing & Deployment
- [ ] Test mobile responsiveness
- [ ] Test background job processing
- [ ] Test multi-AI provider switching
- [ ] Test cost tracking accuracy
- [ ] Test devotional mode workflow
- [ ] Test story/mythology mode workflow
- [ ] Performance testing
- [ ] Deploy to production

## Phase 12: Documentation & Delivery
- [ ] Write user guide
- [ ] Create video tutorial
- [ ] Document API integrations
- [ ] Prepare deployment guide
- [ ] Final testing and QA
- [ ] Deliver to user


## Phase 13: Lyrics Refinement & Length Control ✅
- [x] Add lyrics length selector (short/medium/long/custom word count)
- [x] Add custom lyrics input option (paste your own lyrics)
- [x] Add lyrics refinement controls (regenerate, edit, adjust)
- [x] Add lyrics preview with word count and duration estimate
- [x] Support for both AI-generated and manually-entered lyrics
- [x] Lyrics templates for different styles

## Phase 14: Workflow Consolidation ✅
- [x] Remove Step 4 (Music Prompt) - redundant with Step 2 SUNO Style
- [x] Consolidate workflow from 9 steps to 8 steps
- [x] Update sidebar and step navigation
- [x] Update step numbering in all components

## Phase 15: Saveable Templates & Theme Defaults ✅
- [x] Add database schema for prompt templates (lyrics prompts)
- [x] Add database schema for SUNO style templates
- [x] Create backend tRPC procedures for template CRUD (save, list, delete)
- [x] Build default theme-based prompts (Deity, Love, Folk, Mass, etc.)
- [x] Build default SUNO style presets per theme
- [x] Update Step 2 UI with prompt template selector
- [x] Add "Save as Template" button for lyrics prompts
- [x] Add "Save SUNO Style" button for generated styles
- [x] Theme selector auto-populates default prompts and SUNO settings

## Phase 16: Comprehensive Testing (All 8 Steps)
- [ ] Test Step 1: Deity Selector (predefined and custom deities)
- [ ] Test Step 2: Lyrics Generator (AI generation, manual input, templates)
- [ ] Test Step 3: Audio Upload (file upload, S3 storage, preview)
- [ ] Test Step 4: Music Prompt (SUNO style display and editing)
- [ ] Test Step 5: Scene Breakdown (scene creation and editing)
- [ ] Test Step 6: Image Prompts (prompt generation and templates)
- [ ] Test Step 7: Video Prompts (prompt generation and templates)
- [ ] Test Step 8: CapCut Assembly (guide display and instructions)
- [ ] Test Cost Dashboard (budget tracking, alerts, provider breakdown)
- [ ] Test Mobile Responsiveness (all screen sizes)
- [ ] Test Background Job System (job creation, tracking, completion)
- [ ] Test Settings Panel (API key storage, provider selection)
- [ ] End-to-end workflow testing (complete devotional video creation)

## Phase 17: Step 2 Enhancement - SUNO Style Refinement
- [x] Separate SUNO style into its own box/card in Step 2 UI
- [x] Auto-generate SUNO style when "Generate Lyrics" is clicked
- [x] Add "Refine SUNO Style" button for feedback-based regeneration
- [x] Add feedback input field for SUNO style refinement
- [x] Backend procedure to regenerate SUNO style based on feedback
- [x] Maintain separate "Generate Lyrics" button
- [x] Display SUNO style fields: Tempo, Mood, Instruments, Vocals
- [x] Add loading states for SUNO style generation
- [x] Test SUNO style refinement workflow
- [x] Create 22 comprehensive SUNO refinement tests (all passing)
- [x] REDESIGN: SUNO style as SINGLE copyable box (not separate fields)
- [x] Add Copy button to copy SUNO style to clipboard
- [x] Fix feedback refinement procedure to work correctly
- [x] Test feedback-based refinement with actual updates


## Phase 18: Bug Fixes - Railway Deployment
- [x] Fix: Generate Lyrics button generates "Mother" lyrics when subject field is empty
- [x] Add validation to prevent empty subject submission
- [x] Show error toast when subject is missing
- [x] Test fix on Railway deployment
- [x] Fixed database schema: llm_model → llmModel column rename

## Phase 19: Master Prompt System Implementation
- [ ] Phase 1: Add masterPrompt field to project schema and context
- [ ] Phase 1: Create generateMasterPrompt backend procedure
- [ ] Phase 1: Display Master Prompt panel in Step 1 after lyrics generation
- [ ] Phase 2: Add refineMasterPrompt backend procedure with feedback
- [ ] Phase 2: Add "Refine Master Prompt" UI in Step 1 with feedback textarea
- [ ] Phase 3: Update Step 2 (SUNO) to use Master Prompt in generation
- [ ] Phase 3: Update Step 5 (Image Prompts) to use Master Prompt in generation
- [ ] Phase 3: Update Step 6 (Video Prompts) to use Master Prompt in generation
- [ ] Phase 3: Update Step 7 (YouTube) to use Master Prompt in generation
- [ ] Phase 3: Display Master Prompt reference panels in Steps 2, 5, 6, 7
- [ ] Phase 4: Test consistency across all steps with different categories
- [ ] Phase 4: Verify LLM constraints work per category (devotional vs cinematic)
- [ ] Phase 4: Fine-tune Master Prompt generation prompts
- [ ] Phase 5: Run all tests, commit to GitHub, deploy to Railway

## App Title Update
- [x] Change app title from "Telugu Devotional Video Studio" to "Kishore's Studio"


## Phase 20: Bug Fixes & UX Improvements (User Implementation)
- [x] Step 6 (Image Prompts) — Layout Fix: Image prompt textarea now fills full card width
- [x] Scene Breakdown — Remove "Devotional" prefix from prompts: LLM now forbids generic prefixes
- [x] Project Context — Save category/mood/languageStyle: Fields now persist across steps
- [x] Step 2 — Move Generation Settings section: Moved to just below "Subject & Title"
- [x] Step 2 — Fix stale directive causing mixed instructions: Clears after generation
- [x] Step 2 — Inline status for Generate Prompt button: Replaced toast with inline status
- [x] Sri Rama / Jai Sriram alias resolution: Added fuzzy multi-word matching for deities
- [x] Directive generation — Stop inventing unrelated themes: Tightened LLM constraints
- [x] Deity context cache — TTL fix: Added 10-minute TTL to prevent stale contexts
- [x] Stale lyrics warning + Clear buttons: Orange warning banner with clear options
- [x] Fix silent reuse of old deity from localStorage: Subject input always starts empty
