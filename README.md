# SportsGrid Multi-Viewer (Chrome Extension v1.21)

A professional 4-quadrant Chrome Extension designed for watching multiple legal sports feeds simultaneously (ESPN, DAZN, CBS Sports, NBC Sports, Peacock, Fox One, TBS, TNT, Xfinity Stream, Prime Video, Apple TV+, or any custom stream URL) in a clean 2x2 grid with quadrant-locked fullscreen and instant audio switching.

---

## Features
- **4-Quadrant Multi-Viewer Layout**: Automatically launches 4 independent, borderless popup windows snapped into a 2x2 screen grid with smart window recycling (unedited streams stay open and playing continuously without reloading when saving settings).
- **Quadrant-Locked Fullscreen**: Intercepts native video player fullscreen requests so that clicking fullscreen on any player expands it strictly to fill its quadrant rather than taking over your entire monitor.
- **Injected Corner Speaker Switcher**: Every quadrant features a clean speaker icon (`🔊`/`🔇`) in the top-right corner. Clicking it instantly shifts active audio focus to that quadrant and mutes the others.
- **Complete Keyboard Shortcut Suite**:
  - `Alt + M` (Option + M on Mac): Open the Setup Menu (choose services per quadrant, set default audio sound, or enter custom stream URLs).
  - `Alt + S` (Option + S on Mac): Open the Quick Audio Switcher menu.
  - `Alt + V` (Option + V on Mac): Open the VPN Helper reminder.
  - `Alt + C` (Option + C on Mac): Instantly close all active sports grid windows simultaneously.
- **Custom URL Support**: Every quadrant dropdown includes an "Enter Custom URL..." option to drop in any regional network or stream link instantly.

---

## Installation Instructions

1. **Download the Source Code**:
   - Download this repository as a `.zip` file from GitHub (click the green **Code** button -> **Download ZIP**) and extract/unzip it to a permanent folder on your computer.
2. **Load into Google Chrome**:
   - Open Google Chrome and navigate to **`chrome://extensions/`**.
   - In the top-right corner, toggle on **Developer mode**.
   - In the top-left corner, click **Load unpacked**.
   - Select the unzipped `sportsgrid-extension` folder.
3. **Start Watching**:
   - Press **`Alt + M`** to configure your 4 sports feeds and default audio, or press **`Alt + S`** to launch your 2x2 grid instantly!

---

## How to Update
When a new version is released:
1. Download the updated `.zip` file from GitHub and replace your old folder.
2. Go back to `chrome://extensions/` in Chrome.
3. Click the circular **Reload** arrow icon on the **SportsGrid Multi-Viewer** card.
