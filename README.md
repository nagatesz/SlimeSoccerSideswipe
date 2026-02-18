<img width="512" height="512" alt="slime-soccer-pfp-512x512" src="https://github.com/user-attachments/assets/9711cbe2-78f6-46bd-9ad2-21890d6a89a3"/>
# 🎮 Slime Soccer Sideswipe


A 2D soccer game inspired by Rocket League Sideswipe, featuring customizable slime characters, goal explosions, and comprehensive stats tracking!

![Slime Soccer Sideswipe](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?style=for-the-badge&logo=vite)

## ✨ Features

### 🎯 Game Modes
- **Single Player** - Battle AI opponents with 4 difficulty levels (Easy, Medium, Hard, Impossible)
- **Local Multiplayer** - Play with friends on the same device (WASD vs IJKL controls)
- **Multiple Durations** - Choose from 1min, 2min, 4min, 8min, or Championship mode

### 🎨 Customization
- **12 Slime Colors** - Customize your slime and opponent with RGB spectrum colors
- **8 Goal Explosions** - Fire, Ice, Electric, Toxic, Galaxy, Inferno, Ocean, Rose
- **Live Preview** - See your customizations in real-time in the Garage

### 🏆 Stats & Achievements
- Match history (last 10 games)
- Win/loss/draw records
- Win and loss streaks
- Per-difficulty statistics
- Total time played
- **7 Achievements** to unlock:
  - 🏆 First Victory
  - 🎯 Clean Sheet
  - ⚽ Hat Trick
  - 💪 Comeback Kid
  - 🔥 On Fire (5 win streak)
  - 🎖️ Veteran (25+ matches)
  - 💀 Giant Slayer (beat Impossible AI)

### 🎮 Gameplay Mechanics
- **Grab & Throw** - Hold the ball and aim your throw
- **Ball Steal** - Knock the ball away from opponents with speed
- **Goalie Penalty** - Don't camp in your own goal!
- **Smart AI** - AI with state machines (KICKOFF, DEFEND, ATTACK, CHASE)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/slime-soccer-sideswipe.git
cd slime-soccer-sideswipe
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The build will be in the `dist/` folder, ready to deploy!

## 🎮 Controls

### Single Player
- **WASD** or **Arrow Keys** - Move and jump
- **S** or **↓** - Grab ball
- Move while grabbing to aim your throw

### Multiplayer
- **Player 1 (Left)**
  - W - Jump
  - A/D - Move left/right
  - S - Grab

- **Player 2 (Right)**
  - I - Jump
  - J/L - Move left/right
  - K - Grab

### In-Game
- **Pause Button** - Pause the game (3-2-1 countdown on resume)
- **Quit Button** - Return to main menu

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Vite settings
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/slime-soccer-sideswipe)

## 📁 Project Structure

```
slime-soccer-sideswipe/
├── src/
│   ├── App.jsx          # Main game component
│   ├── main.jsx         # React entry point
│   └── index.css        # Styles
├── public/              # Static assets
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🛠️ Built With

- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- HTML5 Canvas - Game rendering
- JavaScript - Game logic

## 🎯 Future Enhancements

- [ ] Add localStorage persistence for stats
- [ ] Sound effects and background music
- [ ] More explosion themes
- [ ] Tournament mode
- [ ] Replays system
- [ ] Mobile touch controls

## 👥 Credits

**Built by nog & Claude Sonnet 4**

Inspired by Rocket League

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🐛 Bug Reports

Found a bug? Please open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 💖 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Enjoy playing Slime Soccer Sideswipe! ⚽🔥**
