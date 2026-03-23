The Focus Session system is a **layered, event-driven architecture** designed to:
- Track time precisely (no drift)
- Manage session flow (focus → break → next)
- Persist data reliably (autosave + backend sync)
- Avoid unnecessary UI re-renders (high performance)
### System Flow

``` 
1. UI (FocusSession.jsx)  
2. Session Controller (useSessionController)  
3. Segment Timer (useSegmentTimer)   
4. Timer Hook (useTimerEngine)   
5. Timer Engine (Pure JS)  
6. Autosave System (useAutoSaveSession)  
7. Backend Service (sessionService)
```

---
# 1. Timer Engine (Core Time Logic)

**Pure JS**

$$
elapsed = baseElapsed + (now - startTime)
$$
### Responsibilities:
- Accurate time calculation
- Start / Pause / Reset handling 
- No dependency on UI or React

---
# 2. useTimerEngine (React Adapter)

Bridges TimerEngine → React UI
### Key Features:
- Uses `requestAnimationFrame` for smooth updates (60fps)
- Prevents unnecessary re-renders using `lastValueRef`
- Handles tab visibility (fixes freeze issue)

### Flow:
```
start() → engine.start() → RAF loop → getElapsed() → setState  
pause() → engine.pause() → stop RAF
```

---
# 3. useSegmentTimer (Segment Logic)

Handles **per-segment behavior**
Each session consists of **Focus** *&* **Break** segments
### Responsibilities:

#### 3.1 Initialize segment time

```
if completed → full duration    
if running → recoverElapsed()    
else → stored duration
```
#### 3.2 Start segment

- set startedAt  
- call timer.start()
#### 3.3 Pause segment

- calculate elapsed  
- store duration  
- clear startedAt
#### 3.4 Auto-complete segment

```js
if (timeLeft === 0 && running):  
    mark completed  
    move to next segment  
    reset timer
```

---
# 4. useSessionMachine (State Machine)

Controls **session lifecycle**

| State      | Use                   |
| ---------- | --------------------- |
| idle       | Not started           |
| running    | Active session        |
| paused     | User paused           |
| transition | Segment ended         |
| ready      | Next segment prepared |
| finished   | All segments done     |
##### Transitions

```
START -> running  
PAUSE -> paused  
TIME_UP -> transition  
NEXT_SEGMENT -> ready / finished  
RESET -> idle
```

---
# 5. useSessionController (Brain of System)

This connects everything:
- Timer
- Machine    
- Autosave
- Backend
## Responsibilities

#### 5.1 Sync Machine ↔ Timer

```
if machine = running → start timer    
if machine = paused → pause timer
```
#### 5.2 Handle Segment Transitions

```js
if transition:  
    move to next segment  
    reset timer  
    auto-start if needed
```

#### 5.3 Auto Start Logic

```js
if nextSegment.type === "break":  
    start only if autoStartBreaks  
else:  
    always start (focus)
```

#### 5.4 Progress Tracking

Every 15 seconds:
```js
markDirty("progress")
```

#### 5.5 Completion Handling

```js
if timeLeft === 0:  
    markDirty("segment_complete")  
    dispatch(TIME_UP)
```

#### 5.6 Session Finish
```js
if finished:  
    markDirty("finish")  
    forceSave()
```

---
# 6. useAutoSaveSession (Smart Sync System)

Handles **all backend communication safely**

## Key Concept: Dirty Queue

```js
dirtyTypes = Set()
```

Instead of saving instantly:
```js
markDirty("progress")  
markDirty("start")
```

## Save Flow

#### Debounced Save (2s)

```
User action → markDirty → wait → batch save
```

#### Interval Backup

```
every 60s:  
    if dirty → save
```

#### Execution

```
for each dirtyType:  
    payload = buildPayload(type)  
    send to backend
```

---
## When User Starts Session

```
1. UI -> dispatch(START)
2. Machine → running  
3. Controller → start()  
4. TimerEngine → startTime set  
5. RAF loop → elapsed updates  
6. Autosave → markDirty("start")
```

### When User Pauses

```
1. UI → dispatch(PAUSE)  
2. Controller → pause()  
3. TimerEngine → freeze time  
4. Segment updated (duration saved)  
5. Autosave → markDirty("progress")
```

### While Running

```
Every frame:  
    elapsed updated (RAF)    
Every 15s:  
    markDirty("progress")  
Autosave:  
    send to backend
```

## When Segment Ends

```
1. timeLeft = 0  
2. markDirty("segment_complete")  
3. dispatch(TIME_UP)  
4. Machine → transition  
5. Controller:  
	- next segment  
    - reset timer  
    - auto start
```
