# SportsGrid Multi-Viewer (Chrome Extension)

A lightweight Chrome Extension designed for watching multiple legal sports feeds simultaneously (DAZN, ESPN+, Amazon Prime Video, Apple TV+, Peacock, and more) in a clean 2x2 grid with quadrant-locked fullscreen support.

---

## Features
- **4-Quadrant Multi-Viewer Layout**: Automatically launches 4 independent, borderless popup windows snapped into a 2x2 screen grid.
- **Quadrant-Locked Fullscreen**: Intercepts native video player fullscreen requests so that clicking fullscreen on any player expands it strictly to fill its quadrant rather than taking over your entire monitor.
- **Quick Keyboard Shortcuts**:
  - `Alt + M` (Option + M on Mac): Open the SportsGrid Setup Menu.
  - `Alt + C` (Option + C on Mac): Instantly close all active sports grid windows simultaneously.
- **Custom Service Selector**: Choose your preferred sports streaming lineup for each of the 4 quadrants.

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
   - Press **`Alt + M`** to configure your 4 sports feeds, or press **`Alt + S` / `Cmd + Shift + S`** to launch your 2x2 grid instantly!

---

## How to Update
When a new version is released:
1. Download the updated `.zip` file from GitHub and replace your old folder.
2. Go back to `chrome://extensions/` in Chrome.
3. Click the circular **Reload** arrow icon on the **SportsGrid Multi-Viewer** card.
