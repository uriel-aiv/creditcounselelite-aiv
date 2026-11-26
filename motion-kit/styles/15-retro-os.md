# 15 Retro OS — style playbook

Purpose: rebuild or extend the 15 Retro OS style (explored, not chosen for footage tests).
Source: style round 1 of the CCE code motion tests. Last updated: 2026-11-25.

**Films:** `films/cce-retroos` (v01) and `films/cce-retroos-brand` (v03). Copy the brand film.

## The look
Counsel-blue desktop with scanlines; 1-bit cream/black windows (striped title bars, close box, thick borders, hard offset shadows); pixel icons and pixel type; segmented progress bars, buttons, checkboxes. Animated through OS behaviour: zoom-rect window opens/closes, a pixel cursor that moves/drags/clicks, bars filling, files dragged to the trash, an image loading line by line, cascading windows.

## Assets
None generated; all drawn in code.

## To use it for a footage test
Follow the runbook with `mkft.py films/cce-retroos-brand <clip> ...`; apply every shared rule (README) and the text-layout rules in `../../workflows/code-motion-tests.md`.
