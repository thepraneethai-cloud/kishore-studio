# Best Practices Implementation Guide

This document provides a comprehensive guide for integrating all 7 best practices into your Telugu Devotional Studio application.

## Overview

All best practices have been implemented in `server/_core/bestPractices.ts` and are ready for integration into your existing procedures and UI components.

---

## Phase 1: Telugu SEO Keywords & Metadata Optimization

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Functions: `generateSeoMetadata()`, `TELUGU_SEO_KEYWORDS`

### Integration Steps

1. **In YouTube Metadata Generation (Step 9)**
```typescript
import { generateSeoMetadata } from './server/_core/bestPractices';

// In your generateYoutubeMetadata procedure:
const { keywords, tags, seoScore } = generateSeoMetadata(
  project.deity,
  project.category,
  project.mood
);

// Use keywords and tags in YouTube metadata
const youtubeMetadata = {
  title: `${project.deity} - ${project.storyTitle}`,
  description: `...${keywords.slice(0, 5).join(', ')}...`,
  tags: tags,
  keywords: keywords.join(','),
};
```

2. **Features Included**
- Telugu devotional keyword database (Krishna, Shiva, Hanuman, Durga, Rama, Ganesha, Saraswati, Lakshmi)
- Category-specific SEO strategies (devotional, cinematic, folk, romantic, emotional)
- Multi-language support (Telugu, Tamil, Kannada, Malayalam)
- SEO score calculation (0-100)
- Trending keyword suggestions

---

## Phase 2: Database Optimization (Caching, Query Optimization)

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Functions: `getCachedQuery()`, `invalidateCache()`, `clearCache()`

### Integration Steps

1. **Cache Deity Context Queries**
```typescript
import { getCachedQuery, invalidateCache } from './server/_core/bestPractices';

// In your db.ts or queries:
export async function getDeityContext(deity: string) {
  return getCachedQuery(
    `deity_context_${deity}`,
    () => fetchDeityContextFromLLM(deity),
    1000 * 60 * 5 // 5 minute TTL
  );
}

// Invalidate cache when deity changes
invalidateCache('deity_context');
```

2. **Cache Project Queries**
```typescript
// Cache frequently accessed project data
export async function getProjectWithCache(projectId: string) {
  return getCachedQuery(
    `project_${projectId}`,
    () => db.query.projects.findFirst({ where: { id: projectId } }),
    1000 * 60 * 10 // 10 minute TTL
  );
}
```

3. **Features Included**
- LRU cache with size limits (500 entries, 5MB max)
- TTL-based cache invalidation
- Batch loading support
- Database health checks

---

## Phase 3: Enhanced Error Handling & Resilience

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Classes: `CircuitBreaker`
- Functions: `retryWithBackoff()`

### Integration Steps

1. **Wire CircuitBreaker into Generation Procedures**
```typescript
import { CircuitBreaker, retryWithBackoff } from './server/_core/bestPractices';

// Create circuit breaker for each provider
const lyricsCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 min reset
const imageCircuitBreaker = new CircuitBreaker(5, 60000);
const videoCircuitBreaker = new CircuitBreaker(5, 60000);

// In generateLyrics procedure:
export const generateLyrics = protectedProcedure
  .input(lyricsGenerationInputSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      return await lyricsCircuitBreaker.execute(() =>
        retryWithBackoff(
          () => generateDevotionalLyrics(input),
          3, // max 3 retries
          1000 // 1 second initial delay
        )
      );
    } catch (error) {
      // Graceful degradation: return cached lyrics or default
      return { success: false, error: error.message };
    }
  });
```

2. **Features Included**
- Circuit breaker pattern (CLOSED, OPEN, HALF_OPEN states)
- Exponential backoff retry strategy
- Configurable failure thresholds
- Automatic state recovery

---

## Phase 4: Security Enhancements

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Functions: `encryptApiKey()`, `decryptApiKey()`, `logAuditEvent()`, `getAuditLogs()`
- Config: `rateLimiterConfig`

### Integration Steps

1. **Encrypt API Keys at Rest**
```typescript
import { encryptApiKey, decryptApiKey } from './server/_core/bestPractices';

// When saving API key:
const encryptedKey = encryptApiKey(apiKey, process.env.ENCRYPTION_KEY!);
await db.update(userSettings).set({ falApiKey: encryptedKey });

// When using API key:
const decryptedKey = decryptApiKey(encryptedKey, process.env.ENCRYPTION_KEY!);
```

2. **Add Audit Logging**
```typescript
import { logAuditEvent } from './server/_core/bestPractices';

// Log API key access
logAuditEvent({
  timestamp: new Date(),
  action: 'API_KEY_ACCESS',
  userId: ctx.user.id,
  resourceId: 'falApiKey',
  details: { provider: 'fal.ai', operation: 'generate_video' }
});

// View audit logs
const logs = getAuditLogs(userId);
```

3. **Implement Rate Limiting**
```typescript
import { rateLimiterConfig } from './server/_core/bestPractices';

// Apply rate limiting middleware to tRPC procedures
const rateLimitMiddleware = (limit: number, windowMs: number) => {
  const requests: Map<string, number[]> = new Map();
  
  return (userId: string) => {
    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    const recentRequests = userRequests.filter(t => now - t < windowMs);
    
    if (recentRequests.length >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    requests.set(userId, recentRequests);
  };
};
```

4. **Features Included**
- API key encryption/decryption
- Comprehensive audit logging
- Rate limiting configuration (100 req/min per user, 1000 req/min per IP)
- CSRF protection support

---

## Phase 5: Performance Optimization

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Functions: `cacheResponse()`, `ProgressiveGenerator`

### Integration Steps

1. **Cache Generation Results**
```typescript
import { cacheResponse } from './server/_core/bestPractices';

// Cache expensive operations
export async function generateLyricsWithCache(input: LyricsGenerationInput) {
  const cacheKey = `lyrics_${input.deity}_${input.category}_${input.mood}`;
  return cacheResponse(
    cacheKey,
    () => generateDevotionalLyrics(input),
    1000 * 60 * 60 // 1 hour TTL
  );
}
```

2. **Implement Progressive Generation**
```typescript
import { ProgressiveGenerator } from './server/_core/bestPractices';

// Stream results as they complete
export async function generateWithProgress(input: GenerationInput) {
  const generator = new ProgressiveGenerator();
  
  // Stage 1: Generate lyrics
  generator.addUpdate('lyrics', 25, 'Generating lyrics...');
  const lyrics = await generateLyrics(input);
  
  // Stage 2: Generate images
  generator.addUpdate('images', 50, 'Generating images...');
  const images = await generateImages(input);
  
  // Stage 3: Generate video
  generator.addUpdate('video', 75, 'Generating video...');
  const video = await generateVideo(input);
  
  // Stage 4: Complete
  generator.addUpdate('complete', 100, 'Generation complete!');
  
  return {
    lyrics,
    images,
    video,
    progress: generator.getUpdates()
  };
}
```

3. **Features Included**
- Response caching with LRU eviction
- Progressive generation with progress tracking
- Lazy loading support
- Batch processing capabilities

---

## Phase 6: Monitoring & Analytics

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Functions: `recordMetric()`, `getMetrics()`, `recordSystemHealth()`, `getAnalyticsSummary()`

### Integration Steps

1. **Record API Metrics**
```typescript
import { recordMetric } from './server/_core/bestPractices';

// In your generation procedures:
const startTime = Date.now();
try {
  const result = await generateLyrics(input);
  recordMetric({
    provider: 'gemini',
    type: 'lyrics',
    duration: Date.now() - startTime,
    success: true,
    timestamp: new Date(),
    cost: result.cost
  });
  return result;
} catch (error) {
  recordMetric({
    provider: 'gemini',
    type: 'lyrics',
    duration: Date.now() - startTime,
    success: false,
    timestamp: new Date()
  });
  throw error;
}
```

2. **Build Monitoring Dashboard**
```typescript
import { getAnalyticsSummary, getMetrics, getSystemHealth } from './server/_core/bestPractices';

// Create admin dashboard route
export const monitoringRouter = router({
  getSummary: publicProcedure.query(() => {
    return getAnalyticsSummary();
  }),
  
  getMetrics: publicProcedure
    .input(z.object({ provider: z.string().optional(), hours: z.number().default(24) }))
    .query(({ input }) => {
      return getMetrics(input.provider, input.hours);
    }),
  
  getSystemHealth: publicProcedure
    .input(z.object({ hours: z.number().default(1) }))
    .query(({ input }) => {
      return getSystemHealth(input.hours);
    })
});
```

3. **Features Included**
- API performance metrics (provider, type, duration, success rate, cost)
- System health monitoring (uptime, memory, CPU, connections)
- Analytics summary (success rate, total cost, average duration)
- Time-based metric filtering

---

## Phase 7: UX Enhancements

### Implementation Location
- File: `server/_core/bestPractices.ts`
- Classes: `UndoRedoStack`, `VersionHistory`, `BatchProcessor`

### Integration Steps

1. **Implement Undo/Redo**
```typescript
import { UndoRedoStack } from './server/_core/bestPractices';

// In your project context or state management:
const undoRedoStack = new UndoRedoStack();

// When user makes a change
undoRedoStack.push({
  id: `action_${Date.now()}`,
  timestamp: new Date(),
  action: 'EDIT_LYRICS',
  data: { lyrics: newLyrics, previousLyrics: oldLyrics }
});

// Undo
if (undoRedoStack.canUndo()) {
  const previousState = undoRedoStack.undo();
  restoreState(previousState.data);
}

// Redo
if (undoRedoStack.canRedo()) {
  const nextState = undoRedoStack.redo();
  restoreState(nextState.data);
}
```

2. **Implement Version History**
```typescript
import { VersionHistory } from './server/_core/bestPractices';

const versionHistory = new VersionHistory();

// Save version
versionHistory.addVersion({
  id: `v_${Date.now()}`,
  projectId: project.id,
  timestamp: new Date(),
  label: 'After lyrics refinement',
  data: { lyrics: project.lyrics, images: project.images },
  author: ctx.user.id
});

// Get versions
const versions = versionHistory.getVersions(projectId);

// Compare versions
const diff = versionHistory.compareVersions(v1.id, v2.id);
// Returns: { added: [...], removed: [...], changed: [...] }
```

3. **Implement Batch Operations**
```typescript
import { BatchProcessor } from './server/_core/bestPractices';

const batchProcessor = new BatchProcessor();

// Create batch
const batch = batchProcessor.createBatch('REGENERATE_IMAGES', [
  'scene_1',
  'scene_2',
  'scene_3'
]);

// Process batch
try {
  const results = {};
  for (const sceneId of batch.items) {
    results[sceneId] = await regenerateImage(sceneId);
  }
  batchProcessor.updateBatchStatus(batch.id, 'completed', results);
} catch (error) {
  batchProcessor.updateBatchStatus(batch.id, 'failed', undefined, error.message);
}

// Check batch status
const status = batchProcessor.getBatch(batch.id);
```

4. **Features Included**
- Undo/redo stack (50 item max)
- Version history with snapshots (20 versions max)
- Version comparison (added, removed, changed fields)
- Batch operations with status tracking
- Automatic cleanup of old batches

---

## Integration Checklist

- [ ] Phase 1: Wire `generateSeoMetadata` into YouTube metadata generation
- [ ] Phase 2: Implement query caching in db.ts
- [ ] Phase 3: Add CircuitBreaker to generation procedures
- [ ] Phase 4: Encrypt API keys in database
- [ ] Phase 4: Add audit logging middleware
- [ ] Phase 4: Implement rate limiting
- [ ] Phase 5: Cache generation results
- [ ] Phase 5: Implement progressive generation
- [ ] Phase 6: Add metric recording to generation procedures
- [ ] Phase 6: Build monitoring dashboard
- [ ] Phase 7: Implement undo/redo in project context
- [ ] Phase 7: Add version history to projects
- [ ] Phase 7: Implement batch operations for scenes

---

## Testing

All best practices have been implemented with TypeScript support and are ready for integration. Run tests to verify:

```bash
pnpm test
```

---

## Next Steps

1. Start with Phase 1 (Telugu SEO) - lowest effort, high impact
2. Move to Phase 2 (Database Optimization) - improves performance immediately
3. Integrate Phase 3 (Error Handling) - improves reliability
4. Add Phase 4 (Security) - critical for production
5. Implement Phase 5-7 progressively based on priority

---

## Support

For questions or issues during integration, refer to the implementation examples in each phase section above.
