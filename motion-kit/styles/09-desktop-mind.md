# 09 Desktop Mind — style playbook

Purpose: make a new clip in the 09 Desktop Mind style at the approved quality.
Source: rounds 1–3 of the CCE code motion tests. Last updated: 2026-11-25.

**Latest films:** `films/cce-ft09-desktop` (VSL #2, v03) and `films/cce-r2-09-desktop` (VSL #5, v02). Copy the r2 film.

## The look
A real-feeling Mac desktop explains the idea: gradient wallpaper with the CCE badge, a menu bar ("CCE"), a dock with magnification, Finder windows, widgets, notification banners, Quick Look; a pointer that moves, clicks, drags and drops. No Apple marks or app icons.

## Assets
- File thumbnails (`assets/files/`) are **Nano Banana 2.1 images that look like iPhone photos** (generated in AIVideo, see `../../prompts/README.md`).
- Everything else (windows, icons, widgets, wallpaper) is drawn in code.

## Engine
`macWindow`, `winIn`/`winOut`, `menuBar`, `dock`, `widget`, `label`, `item`, `folderIcon`/`docIcon`/`thumb`, the pointer (`CUR`, `PRESS`, `DRAGS`, `cursorAt`, `pointer`), app content helpers (calculator `CALC`/`keyAt`, calendar `CAL`/`calTile`, photos `PH`, `checkRow`, `banner`, `typed`).

## Must
- Explain with real-looking app windows (sidebars, toolbars, segmented controls, toggles, calendar grids, charts, map pins, album tiles), never a window that only holds text; apps match the concept (Calculator, Calendar, Photos, Finder).
- Clean UI: every label, number and button inside its window; nothing under the dock or menu bar; no wallpaper badge peeking from behind windows; Finder labels dark (blue pill when selected).
- In voiceover-only moments do not scale the desktop up (windows must stay off the frame edges).

## Never
- Apple logos or real app icons; "Finder" as the app name (it is "CCE").
