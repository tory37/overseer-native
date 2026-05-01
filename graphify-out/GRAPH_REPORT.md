# Graph Report - overseer  (2026-05-01)

## Corpus Check
- 73 files · ~39,554 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 184 nodes · 139 edges · 10 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `SessionService` - 17 edges
2. `SessionRegistry` - 8 edges
3. `SyncService` - 7 edges
4. `CompanionPtyManager` - 6 edges
5. `UpdateService` - 6 edges
6. `PtyManager` - 6 edges
7. `ConfigService` - 4 edges
8. `ScrollbackManager` - 4 edges
9. `readAgentConfig()` - 3 edges
10. `matchKeybinding()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `matchKeybinding()` --calls--> `handleGlobalKeyDown()`  [INFERRED]
  src/renderer/types/ipc.ts → src/renderer/components/SettingsModal.tsx
- `registerIpcHandlers()` --calls--> `createWindow()`  [INFERRED]
  src/main/ipc-handlers.ts → src/main/index.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (3): handleSave(), readAgentConfig(), SessionService

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (4): handleGlobalKeyDown(), handleSync(), UpdateService, matchKeybinding()

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (1): SessionRegistry

### Community 4 - "Community 4"
Cohesion: 0.36
Nodes (1): SyncService

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (1): PtyManager

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (1): CompanionPtyManager

### Community 8 - "Community 8"
Cohesion: 0.53
Nodes (4): decodeEntities(), parseSpriteSpeech(), SpriteParser, stripAnsi()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (2): createWindow(), registerIpcHandlers()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (1): ConfigService

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (1): ScrollbackManager

## Knowledge Gaps
- **Thin community `Community 3`** (9 nodes): `SessionRegistry`, `.add()`, `.constructor()`, `.list()`, `.load()`, `.remove()`, `.save()`, `.update()`, `registry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (8 nodes): `SyncService`, `.constructor()`, `.driftedFiles()`, `.getDriftStatus()`, `.getLastSyncedAt()`, `.runSync()`, `.writeSyncedAt()`, `sync-service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (8 nodes): `.onError()`, `PtyManager`, `.has()`, `.kill()`, `.resize()`, `.spawn()`, `.write()`, `pty-manager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (7 nodes): `CompanionPtyManager`, `.has()`, `.kill()`, `.resize()`, `.spawn()`, `.write()`, `companion-pty-manager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (5 nodes): `createWindow()`, `isDirectory()`, `registerIpcHandlers()`, `index.ts`, `ipc-handlers.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (5 nodes): `ConfigService`, `.constructor()`, `.read()`, `.write()`, `config-service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (5 nodes): `ScrollbackManager`, `.append()`, `.constructor()`, `.read()`, `scrollback.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SessionService` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `handleSave()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._