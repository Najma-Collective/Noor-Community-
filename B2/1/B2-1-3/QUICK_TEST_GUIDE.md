# Quick Test Guide - AI Lesson Orchestrator

## 🚀 5-Minute Quick Test

### Single Browser Test (1 Learner)

1. **Open orchestrator.html** in your browser
   - File location: `B2/1/B2-1-3/orchestrator.html`

2. **When prompted for API key:**
   - Click "Cancel" to use simulated mode (no API needed)
   - OR enter your Gemini API key for full AI

3. **On entry screen:**
   - Enter name: "Ali"
   - Leave join code blank
   - Click "Join Lesson"

4. **In lobby:**
   - Note the 6-character code (e.g., "ABC123")
   - Click "I'm Ready"
   - Lesson should auto-start after 2 seconds

5. **Test lesson features:**
   - ✅ Check if slides are visible in center
   - ✅ Click next arrow → should move to slide 2
   - ✅ Type "Hello Sarah" and press Enter
   - ✅ Wait for Sarah's response (~2 seconds)
   - ✅ Check phase label changes when navigating slides

### Two Browser Test (2 Learners)

**Browser 1 (Learner A):**
1. Open `orchestrator.html`
2. Skip API key prompt
3. Enter name: "Ali"
4. Leave code blank, click "Join Lesson"
5. **Copy the join code shown** (e.g., "XYZ789")
6. Wait in lobby (don't click Ready yet)

**Browser 2 (Learner B):**
1. Open `orchestrator.html` in a NEW browser/incognito window
2. Skip API key prompt
3. Enter name: "Mariam"
4. **Paste the code from Browser 1**
5. Click "Join Lesson"
6. You should see both names in lobby

**Both Browsers:**
1. Click "I'm Ready" in both
2. Both should enter lesson together
3. Test chat between learners:
   - Browser 1: Type message, send to "Everyone"
   - Browser 2: Should see Ali's message
   - Browser 2: Reply to Ali
4. Navigate slides - both should stay in sync (with 2-second delay)

---

## ✅ Feature Checklist

### Entry & Lobby
- [ ] Can enter name
- [ ] Can create new session (no code)
- [ ] Can join existing session (with code)
- [ ] Join code displays correctly
- [ ] Participant list shows names
- [ ] Ready indicators work
- [ ] Auto-start when all ready

### Lesson Interface
- [ ] Slide deck visible in iframe
- [ ] Slide counter updates (e.g., "1 / 12")
- [ ] Phase label displays correctly
- [ ] Timer counts up
- [ ] Session code shown in toolbar
- [ ] Participant badges visible

### Slide Navigation
- [ ] Next button works
- [ ] Previous button works
- [ ] Buttons disable at first/last slide
- [ ] Slide content changes in iframe
- [ ] Sarah comments on slide changes

### Chat
- [ ] Can type messages
- [ ] Can select recipient (Everyone/individual)
- [ ] Send button works
- [ ] Enter key sends message
- [ ] Messages appear in chat
- [ ] Sarah responds (typing indicator → message)
- [ ] Timestamps display
- [ ] Chat scrolls to latest message

### Sarah Behavior
- [ ] Welcome message on lesson start
- [ ] Responds to slide changes
- [ ] Responds to user messages
- [ ] Different guidance per slide
- [ ] Typing indicator shows
- [ ] Messages appear after delay

### Phases
- [ ] Slide 1-2: "Orientation"
- [ ] Slide 3: "Warmer"
- [ ] Slide 4-6: "Controlled Practice"
- [ ] Slide 7-10: "Main Task"
- [ ] Slide 11: "Reflection"
- [ ] Slide 12: "Closing"

### Pairwork Mode
- [ ] Banner appears on slides 7-10
- [ ] Banner hidden on other slides

---

## 🐛 Common Issues & Fixes

### Slides not showing
**Problem:** Blank white area in center
**Fix:** Check that `B2-1-3-b.html` is in the same folder as `orchestrator.html`

### Sarah using simulated responses
**Symptom:** Generic, repetitive responses
**Expected:** This is normal without API key
**To enable AI:** Refresh page and enter Gemini API key when prompted

### Second learner can't join
**Problem:** "Session not found" error
**Fix:**
- Verify code is typed exactly (case-sensitive)
- Ensure first learner is still in lobby/lesson
- Try creating new session

### Chat messages doubled
**Problem:** Seeing messages twice
**Cause:** Same user in multiple tabs
**Fix:** Use different browsers or incognito windows for testing

### Slides not syncing between browsers
**Problem:** Learners see different slides
**Expected:** 2-second delay is normal (localStorage polling)
**Fix:** Wait 2-3 seconds for sync

---

## 🎯 Test Scenarios

### Scenario 1: Solo Learning
1. One learner completes entire lesson alone
2. Sarah adapts to single-learner mode
3. Test all 12 slides
4. Check Sarah's guidance changes per slide

### Scenario 2: Pair Learning
1. Two learners join same session
2. Navigate to Slide 9 (Main Task)
3. Sarah assigns roles (Finance Manager / Project Manager)
4. Learners chat using role-specific language
5. Sarah monitors and responds

### Scenario 3: Slide-Specific Testing

**Test Controlled Practice (Slide 4-6):**
- Send incorrect grammar
- Check if Sarah gives immediate feedback
- Example: "If I have more money, I will expand project"
- Expected: Sarah corrects to past simple + would

**Test Fluency Activity (Slide 3, 7):**
- Make deliberate errors
- Check if Sarah continues conversation without immediate correction
- Expected: Sarah notes error but doesn't interrupt flow

**Test Reflection (Slide 11):**
- Navigate to slide 11
- Check if Sarah asks reflection questions
- Ideally would surface earlier errors (currently in simulated mode)

---

## 📊 What to Expect

### Simulated Mode (No API Key)
- **Response time:** ~2 seconds
- **Responses:** Pre-written, slide-specific
- **Intelligence:** Basic, pattern-matched
- **Cost:** Free
- **Best for:** Testing UI/UX, demos

### AI Mode (With Gemini API)
- **Response time:** ~3-5 seconds
- **Responses:** Dynamic, context-aware
- **Intelligence:** Understands context, adapts to input
- **Cost:** Very low (Gemini Flash is cheap)
- **Best for:** Real lesson delivery

---

## 🔧 Developer Testing

### Console Commands

Open browser console (F12) and try:

```javascript
// Check current state
console.log(state);

// Force slide change
navigateSlide(1); // Move forward
navigateSlide(-1); // Move back

// Simulate Sarah message
addMessage('Sarah', 'Test message from console', 'everyone');

// Check session data
console.log(getSession(state.joinCode));

// Clear all sessions (reset)
localStorage.clear();
```

### Testing Specific Slides

Navigate directly:
```javascript
// Jump to main task (slide 9)
state.currentSlide = 8;
navigateSlide(0); // Trigger update
```

### Mock Error Logging

```javascript
// Add sample error
state.errors.push({
  slide: 5,
  original: "If I have more budget, I will hire staff",
  corrected: "If I had more budget, I would hire staff",
  type: "second conditional"
});
console.log('Errors:', state.errors);
```

---

## ✨ Success Criteria

Your test is successful if:

1. ✅ Can create and join sessions
2. ✅ Slides display and navigate correctly
3. ✅ Sarah sends messages (simulated or AI)
4. ✅ Chat works bidirectionally
5. ✅ Phase labels update per slide
6. ✅ Multi-learner sessions stay synchronized
7. ✅ No console errors (except optional API warnings)

---

## 📝 Feedback Template

After testing, note:

**What worked well:**
- [ ] Entry/lobby flow
- [ ] Slide navigation
- [ ] Sarah's responses
- [ ] Chat functionality
- [ ] Visual design

**What needs improvement:**
- [ ] Response time too slow
- [ ] Sarah's guidance not helpful
- [ ] Sync delays confusing
- [ ] UI elements unclear
- [ ] Missing features

**Priority additions:**
1. ________________
2. ________________
3. ________________

---

**Happy testing!** 🎉

Report issues or suggestions in the project repository.
