# Prompts

Purpose: reusable prompts for CCE (copy, ad scripts, hooks, image/video generation), so outputs can be regenerated at the same quality.
Source: CCE work sessions, Nov 2026. Last updated: 2026-11-25.

One file per prompt family; each says the target model, settings, cost, inputs and what comes after. Always load `business/` + `brand/messaging.md` + `visual/brand-guide.md` + `business/compliance-and-legal.md` as context for anything public-facing.

## Image generation for the code motion styles
| File | Style | Model |
|---|---|---|
| [image-gen-pixel-wealth.md](image-gen-pixel-wealth.md) | 19 Pixel Wealth rooms | GPT Image 2.6 Sunburst |
| [image-gen-photo-collage.md](image-gen-photo-collage.md) | 20 Photo Collage 2.5D scenes, clean plates, flat props | Nano Banana 2.1 (2K) |

### Older styles (09, 11, 12, 16): prompts live on the AIVideo assets
The art for 09 Desktop Mind (iPhone-photo file thumbnails, Nano Banana 2.1), 11 Vox Explainer (paper textures, Nano Banana Pro; transparent cards and props, GPT Image), 12 Soft Systems (glass icons, transparent blue-toned objects, photo tiles) and 16 Board Game (pen line drawings, GPT Image transparent) was generated in the AIVideo project **"CCE Art Direction"** `77b9a3f28a694c7c885eb5978627a64b`, folder **Style Round 1 → Code Motion Tests**. Every generated asset stores its full prompt:
- with the AIVideo MCP: `get_context(project_id, ids=[{"type":"asset","id":"<asset id>"}], detail="full")` → `data.prompt`;
- in the AIVideo editor: open the asset's details.
When you reuse one, copy it into a file here (same format as the two above).

### Rules for every image prompt in this kit
- No text, letters, numbers, logos or currency symbols unless the design needs a specific word (e.g. PLAYBOOK, FIRST CLASS).
- No real people, brands, app icons or airline/bank marks.
- Say the cost before generating; never generate video unless the creative lead asks.
