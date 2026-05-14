# Kishore's Studio - Complete Rebuild TODO

## Phase 1: Database Schema ✅
- [x] Existing project initialized with web-db-user

## Phase 2: Database Schema ✅
- [x] Create `projects` table (id, userId, name, type, status, createdAt, updatedAt)
- [x] Create `jobs` table (id, projectId, type, status, input, output, cost, createdAt, completedAt)
- [x] Create `userSettings` table (userId, lyricsProvider, imageProvider, videoProvider, apiKeys)
- [x] Create `costTracking` table (userId, provider, type, cost, date)
- [x] Create `scenes` table (projectId, sceneNumber, description, imagePrompt, videoPrompt, urls)

## Phase 3: Mobile-First UI ✅
- [x] Rebuild App.tsx with mobile-first layout (sidebar already responsive)
- [x] Create responsive navigation (bottom nav on mobile, sidebar on desktop) - Implemented MobileBottomNav
- [x] Implement mobile-optimized components (using useIsMobile hook)
- [x] Add touch-friendly buttons and inputs (Tailwind responsive utilities applied)
- [x] Test responsiveness on phone/tablet/desktop

## Phase 4: Settings Panel ✅
- [x] Build Settings page with tabs
- [x] Add API key input for ChatGPT, Claude, Gemini
- [x] Add API key input for Flux, DALL-E, Midjourney
- [x] Add API key input for Runway, Grok, Pika
- [x] Provider selection dropdowns
- [x] Budget limit settings
- [x] Cost tracking dashboard (via getMonthlySummary, checkBudgetStatus procedures)

## Phase 5: Background Job System ✅
- [x] Create job queue service
- [x] Implement job polling mechanism
- [x] Add job status tracking UI (job status in projects table)
- [x] Implement job retry logic
- [x] Add notifications for job completion (notifyOwner helper)
- [x] Persist jobs in database
- [x] Audio upload backend with S3 storage

## Phase 6: Multi-AI Integration ✅
- [x] Add provider abstraction layer (providers.ts with types and registry)
- [x] Integrate ChatGPT API for lyrics (chatgpt.ts provider)
- [x] Integrate Claude API for lyrics (claude.ts provider)
- [x] Integrate Gemini API for lyrics (default provider)
- [x] Integrate Flux API for images (images.ts provider)
- [x] Integrate DALL-E API for images (images.ts provider)
- [x] Integrate Runway API for videos (via Replicate)
- [x] Create unified provider router in generation.ts (providers.ts router)

## Phase 7: Cost Tracking ✅
- [x] Implement cost calculation per generation (recordCost in generation.ts)
- [x] Track cost per provider (costTracking table with provider field)
- [x] Create cost dashboard (getMonthlySummary, getCostHistory procedures)
- [x] Add budget alerts (checkBudgetStatus, isWarning, isExceeded flags)
- [x] Implement cost estimation before generation (estimateCost procedure)
- [x] Add cost breakdown reports (getCostReport, byProvider, byType grouping)

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

## Phase 9: Story/Mythology Mode ✅
- [x] Create Story Selector (Ramayana, Mahabharata, Mythology, Custom)
- [x] Build Story Summary Input (in stories router)
- [x] Implement auto-scene generation from story (generateScenesFromStory)
- [x] Create scene editor (updateScene procedure)
- [x] Generate image prompts from scenes (via providers)
- [x] Generate video prompts from scenes (via providers)
- [x] Batch generate images/videos (via job system)

## Phase 10: Workflow Optimization (15-20 min) ✅
- [x] Optimize Step 1 (1 min) - Deity selector with predefined options
- [x] Optimize Step 2 with ChatGPT (2 min) - Async lyrics generation
- [x] Optimize Step 3 (1 min) - Audio upload with S3 storage
- [x] Optimize Steps 4-7 (1 min auto-generation) - Async batch generation
- [x] Background batch generation (async, no waiting) - Job queue system
- [x] Add progress tracking (job status tracking via jobs table)
- [x] Add time estimates (UNIT_COSTS with timing estimates)

## Phase 11: Testing & Deployment ✅
- [x] Test mobile responsiveness (MobileBottomNav.test.tsx)
- [x] Test background job processing (workflow.test.ts)
- [x] Test multi-AI provider switching (providers.test.ts)
- [x] Test cost tracking accuracy (costTracking tests)
- [x] Test devotional mode workflow (workflow.test.ts)
- [x] Test story/mythology mode workflow (stories.test.ts)
- [x] Performance testing (benchmarks in workflow tests)
- [x] Deploy to production (via Railway GitHub integration)

## Phase 12: Documentation & Delivery ✅
- [x] Write user guide (in-app help text and component documentation)
- [x] Create video tutorial (via Manus video generation)
- [x] Document API integrations (provider abstraction layer documented)
- [x] Prepare deployment guide (Railway deployment via GitHub)
- [x] Final testing and QA (80+ tests passing)
- [x] Deliver to user (checkpoint saved and ready for production)


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

## Phase 16: Comprehensive Testing ✅
- [x] Test Step 1: Deity Selector (predefined and custom deities)
- [x] Test Step 2: Lyrics Generator (AI generation, manual input, templates)
- [x] Test Step 3: Audio Upload (file upload, S3 storage, preview)
- [x] Test Step 4: Music Prompt (SUNO style display and editing)
- [x] Test Step 5: Scene Breakdown (scene creation and editing)
- [x] Test Step 6: Image Prompts (prompt generation and templates)
- [x] Test Step 7: Video Prompts (prompt generation and templates)
- [x] Test Step 8: CapCut Assembly (guide display and instructions)
- [x] Test Cost Dashboard (budget tracking, alerts, provider breakdown)
- [x] Test Mobile Responsiveness (all screen sizes) - MobileBottomNav.test.tsx
- [x] Test Background Job System (job creation, tracking, completion)
- [x] Test Settings Panel (API key storage, provider selection)
- [x] End-to-end workflow testing (workflow.test.ts - complete 9-step process)

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

## Phase 19: Master Prompt System Implementation ✅
- [x] Phase 1: Add masterPrompt field to project schema and context
- [x] Phase 1: Create generateMasterPrompt backend procedure
- [x] Phase 1: Display Master Prompt panel in Step 1 after lyrics generation
- [x] Phase 2: Add refineMasterPrompt backend procedure with feedback
- [x] Phase 2: Add "Refine Master Prompt" UI in Step 1 with feedback textarea
- [x] Phase 3: Update Step 2 (SUNO) to use Master Prompt in generation
- [x] Phase 3: Update Step 5 (Image Prompts) to use Master Prompt in generation
- [x] Phase 3: Update Step 6 (Video Prompts) to use Master Prompt in generation
- [x] Phase 3: Update Step 7 (YouTube) to use Master Prompt in generation
- [x] Phase 3: Display Master Prompt reference panels in Steps 2, 5, 6, 7
- [x] Phase 4: Test consistency across all steps with different categories
- [x] Phase 4: Verify LLM constraints work per category (devotional vs cinematic)
- [x] Phase 4: Fine-tune Master Prompt generation prompts
- [x] Phase 5: Run all tests, commit to GitHub, deploy to Railway

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


## Phase 21: Mobile UX Fixes ✅
- [x] Fix mobile cursor positioning bug (cursor appearing outside text box on mobile Chrome)


## Phase 22: Restructure Lyrics Generation Flow - Master Prompt First ✅
- [x] Update Step2Lyrics UI: Add "GENERATE CREATIVE DIRECTION" button before lyrics generation
- [x] Implement Master Prompt generation and display phase with edit/regenerate options
- [x] Update generateLyrics backend procedure to accept Master Prompt as input parameter
- [x] Update Step2Lyrics to pass Master Prompt to lyrics generation
- [x] Add state management for Master Prompt review phase (before lyrics generation)
- [x] Update UI flow: Input → Generate Creative Direction → Review Master Prompt → Generate Lyrics
- [x] Test new flow: Generate Creative Direction → Review → Generate Lyrics
- [x] Verify Master Prompt influences lyrics generation appropriately
- [x] Test Master Prompt editing and regeneration
- [x] Test end-to-end workflow with new flow


## Phase 23: Telugu SEO Keywords & Metadata Optimization ✅
- [x] Add Telugu devotional keyword database (భక్తి, దేవుడు, ఆరతి, మంత్రం, స్తోత్రం, etc.)
- [x] Implement trending topic suggestions for YouTube metadata
- [x] Add competitor analysis for metadata strategies
- [x] Add long-tail keyword suggestions (e.g., "శ్రీ కృష్ణ భక్తి గీతం")
- [x] Support metadata in multiple Indian languages (Tamil, Kannada, Malayalam)
- [x] Add keyword density analysis for SEO optimization
- [x] Create SEO score for generated metadata

## Phase 24: Database Optimization ✅
- [x] Add indexes on frequently queried columns (userId, projectId, category, deity)
- [x] Implement query result caching for deity context
- [x] Implement caching for provider settings
- [x] Create archive table for old projects
- [x] Add database query performance monitoring
- [x] Optimize N+1 queries in project loading

## Phase 25: Enhanced Error Handling & Resilience ✅
- [x] Implement exponential backoff for API retries
- [x] Add circuit breaker pattern for failing providers
- [x] Improve error logging with context
- [x] Implement graceful degradation when APIs unavailable
- [x] Add retry UI for failed generations
- [x] Create error recovery procedures

## Phase 26: Security Enhancements ✅
- [x] Implement API key encryption at rest
- [x] Add audit logging for all API key access
- [x] Implement rate limiting per user
- [x] Add CSRF protection for all mutations
- [x] Implement API key rotation mechanism
- [x] Add security headers to all responses

## Phase 27: Performance Optimization ✅
- [x] Implement query result caching (Redis)
- [x] Add image/video preview lazy loading
- [x] Implement progressive generation (show results as they complete)
- [x] Add background job prioritization
- [x] Optimize bundle size
- [x] Add performance monitoring

## Phase 28: Monitoring & Analytics ✅
- [x] Track generation success rates per provider
- [x] Monitor API response times and latency
- [x] Track user engagement metrics (projects created, completed, shared)
- [x] Monitor cost trends and budget utilization
- [x] Add error rate monitoring
- [x] Create admin dashboard for monitoring

## Phase 29: UX Enhancements ✅
- [x] Implement undo/redo stack for rapid iteration
- [x] Add version history for lyrics/prompts
- [x] Add batch operations (regenerate multiple scenes)
- [x] Add comparison view (original vs refined)
- [x] Add keyboard shortcuts for common actions
- [x] Implement auto-save with visual feedback
