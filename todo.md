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
- [ ] Rebuild App.tsx with mobile-first layout
- [ ] Create responsive navigation (bottom nav on mobile, sidebar on desktop)
- [ ] Implement mobile-optimized components
- [ ] Add touch-friendly buttons and inputs
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

## Phase 6: Multi-AI Integration
- [ ] Integrate ChatGPT API for lyrics
- [ ] Integrate Claude API for lyrics
- [ ] Integrate Gemini API for lyrics
- [ ] Integrate Flux API for images
- [ ] Integrate DALL-E API for images
- [ ] Integrate Runway API for videos
- [ ] Add provider abstraction layer

## Phase 7: Cost Tracking
- [ ] Implement cost calculation per generation
- [ ] Track cost per provider
- [ ] Create cost dashboard
- [ ] Add budget alerts
- [ ] Implement cost estimation before generation
- [ ] Add cost breakdown reports

## Phase 8: Devotional Mode
- [ ] Rebuild Step 1: Deity Selector (mobile-optimized)
- [ ] Rebuild Step 2: Lyrics Generator with ChatGPT
- [ ] Rebuild Step 3: SUNO Style Builder
- [ ] Rebuild Step 4: Music Prompt Guide
- [ ] Rebuild Step 5: Scene Breakdown
- [ ] Rebuild Step 6: Image Prompts (with cost estimation)
- [ ] Rebuild Step 7: Video Prompts (with cost estimation)
- [ ] Rebuild Step 8: CapCut Assembly Guide
- [ ] Rebuild Step 9: YouTube Export

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
