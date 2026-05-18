# 🎯 3D Project Tree

> An interactive 3D visualization for browsing project directory structures. Built with vanilla JavaScript, CSS 3D transforms, and MediaPipe hand gesture recognition.

![Demo](assets/demo.jpg)

## ✨ Features

- **3D Glassmorphism Cards** — Frosted glass card UI with 3D perspective transforms (rotateX/Y/Z)
- **Smooth Animations** — Fluid card transitions, focus effects, and enter/exit folder animations
- **Folder Navigation** — Breadcrumb trail, keyboard controls (↑↓ Enter ESC R), click/touch support
- **Hand Gesture Control** — MediaPipe Hands integration for camera-based gesture navigation
- **Background Particles** — Interactive particle system with mouse-responsive glow
- **Fully Configurable** — Swap data, colors, layout, and hooks via a single config file

## 🚀 Quick Start

1. **Edit data** — Open `js/config.js` and replace `TREE_DATA` with your own project structure
2. **Open in browser** — Double-click `index.html` (no build tools required)

```javascript
const TREE_DATA = {
  name: 'my-project',
  icon: '📁',
  desc: 'Project root',
  tag: 'project',
  children: [
    { name: 'src', icon: '💻', desc: 'Source code', tag: 'source', children: [...] },
    { name: 'README.md', icon: '📋', desc: 'Documentation', tag: 'doc' },
  ],
};
```

## ⌨️ Controls

| Key / Action | Effect |
|---|---|
| ↑↓ / Mouse Wheel | Navigate cards |
| Enter / Click focused card | Enter folder |
| ESC / Backspace | Go back |
| R | Return to root |
| Click "Gesture" button | Enable/disable camera gesture control |

## ✋ Gestures

| Gesture | Action |
|---|---|
| Open hand → Pinch → Open | Enter folder |
| Fist hold ≥1.5s | Go back |
| Open hand, swipe up/down | Scroll list |

## 🛠️ Configuration

All customization in `js/config.js`:

| Section | Description |
|---|---|
| `TREE_DATA` | Your project tree structure |
| `TAG_COLORS` | Color mapping for tags |
| `TREE_CONFIG` | Card sizes, 3D perspective, focus effects, visible range |
| `GESTURE_CONFIG` | Gesture thresholds, camera resolution |
| `TREE_HOOKS` | Lifecycle callbacks: `onReady`, `onFocusChange`, `onEnterFolder`, `onGoBack`, `onGoRoot`, `onRender` |

## 📂 Project Structure

```
3d-project-tree/
├── index.html          # Entry point (open directly in browser)
├── css/
│   └── style.css       # All styles (glassmorphism, animations, responsive)
├── js/
│   ├── config.js       # ★ Edit this file ★ — data, colors, layout, hooks
│   ├── app.js          # Core logic — renderer, navigation, particles
│   └── gestures.js     # MediaPipe hand gesture control
└── README.md
```

## 📦 Dependencies

- [MediaPipe Hands](https://cdn.jsdelivr.net/npm/@mediapipe/hands) — Hand gesture recognition (loaded from CDN, optional)
- No build tools, no npm, no server required

## 📜 License

MIT
