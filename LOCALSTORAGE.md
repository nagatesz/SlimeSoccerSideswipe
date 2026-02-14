# 💾 Adding localStorage for Persistent Stats

Want your stats to persist across page refreshes? Follow this guide to add localStorage support!

## 📝 What This Does

Currently, stats reset when you refresh the page. With localStorage:
- ✅ Stats persist across sessions
- ✅ Username saves automatically
- ✅ Match history stays
- ✅ Achievements unlock permanently

## 🔧 Implementation

### Step 1: Open `src/App.jsx`

Find the `stats` useState (around line 159):

```javascript
const [stats, setStats] = useState({ 
  played:0, wins:0, losses:0, draws:0, gf:0, ga:0,
  matchHistory: [],
  // ... rest of stats
});
```

**Replace it with:**

```javascript
const [stats, setStats] = useState(() => {
  // Try to load stats from localStorage
  const saved = localStorage.getItem('slimeSoccerStats');
  
  // If saved data exists, use it; otherwise use defaults
  return saved ? JSON.parse(saved) : {
    played:0, wins:0, losses:0, draws:0, gf:0, ga:0,
    matchHistory: [],
    bestWinStreak: 0, currentWinStreak: 0,
    bestLoseStreak: 0, currentLoseStreak: 0,
    totalMinutesPlayed: 0,
    explosionUsage: {},
    difficultyStats: { 
      easy:{w:0,l:0}, 
      medium:{w:0,l:0}, 
      hard:{w:0,l:0}, 
      impossible:{w:0,l:0} 
    },
    achievements: []
  };
});
```

### Step 2: Save Stats on Change

Add this useEffect **after** the stats useState (around line 175):

```javascript
// Save stats to localStorage whenever they change
useEffect(() => {
  localStorage.setItem('slimeSoccerStats', JSON.stringify(stats));
}, [stats]);
```

### Step 3: Persist Username

Find the `username` useState (around line 153):

```javascript
const [username, setUsername] = useState('');
```

**Replace it with:**

```javascript
const [username, setUsername] = useState(() => {
  return localStorage.getItem('slimeSoccerUsername') || '';
});
```

Then add this useEffect:

```javascript
// Save username whenever it changes
useEffect(() => {
  if (username) {
    localStorage.setItem('slimeSoccerUsername', username);
  }
}, [username]);
```

### Step 4: Persist Color Choices (Optional)

If you want to save color preferences:

```javascript
const [myColor, setMyColor] = useState(() => {
  const saved = localStorage.getItem('slimeSoccerMyColor');
  return saved ? JSON.parse(saved) : COLORS[5];
});

const [oppColor, setOppColor] = useState(() => {
  const saved = localStorage.getItem('slimeSoccerOppColor');
  return saved ? JSON.parse(saved) : COLORS[1];
});

const [expColor, setExpColor] = useState(() => {
  const saved = localStorage.getItem('slimeSoccerExpColor');
  return saved ? JSON.parse(saved) : EXPLOSION_COLORS[0];
});

// Save colors on change
useEffect(() => {
  localStorage.setItem('slimeSoccerMyColor', JSON.stringify(myColor));
}, [myColor]);

useEffect(() => {
  localStorage.setItem('slimeSoccerOppColor', JSON.stringify(oppColor));
}, [oppColor]);

useEffect(() => {
  localStorage.setItem('slimeSoccerExpColor', JSON.stringify(expColor));
}, [expColor]);
```

## ✅ Test It

1. **Make changes**
2. **Run** `npm run dev`
3. **Play a game** and check stats
4. **Refresh the page**
5. Stats should still be there! 🎉

## 🧹 Clear Data (For Testing)

To reset everything:

**Method 1: In-Game**
- Go to Stats page
- Click "Reset All"

**Method 2: Browser Console**
```javascript
localStorage.clear();
location.reload();
```

**Method 3: Browser DevTools**
1. Press F12 → Application tab
2. Storage → Local Storage
3. Clear site data

## 📊 What Gets Saved

```javascript
localStorage {
  slimeSoccerStats: "{...}"      // All your stats
  slimeSoccerUsername: "nog"     // Your username
  slimeSoccerMyColor: "{...}"    // Your slime color
  slimeSoccerOppColor: "{...}"   // Opponent color
  slimeSoccerExpColor: "{...}"   // Explosion theme
}
```

## 🔒 Privacy Note

localStorage is:
- ✅ Stored on **your device only**
- ✅ Never sent to any server
- ✅ Private to your browser
- ✅ Can be cleared anytime

## 🐛 Troubleshooting

### Stats Not Saving

**Check:**
1. Browser allows localStorage (private/incognito mode may block it)
2. No errors in browser console (F12)
3. You're not in an iframe or special browser mode

### Stats Corrupted

Clear localStorage and start fresh:
```javascript
localStorage.removeItem('slimeSoccerStats');
```

### Old Stats Format

If you update the stats structure, you may need to migrate old data:

```javascript
const [stats, setStats] = useState(() => {
  const saved = localStorage.getItem('slimeSoccerStats');
  if (saved) {
    const data = JSON.parse(saved);
    // Add any missing new fields
    return {
      ...data,
      newField: data.newField || defaultValue
    };
  }
  return defaultStats;
});
```

## 🎉 Done!

Your stats now persist forever! Play on! ⚽

---

**Need help?** Open an issue on GitHub!
