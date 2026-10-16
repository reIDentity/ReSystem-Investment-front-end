# Bundled application fonts

The application loads these files through `next/font/local`; building the app no longer fetches Google Fonts. The files are unmodified copies of the Latin WOFF2 assets used by the successful local Google-font build. The emitted CSS/source maps identify their original Google Fonts URLs and the same configured weights. No font substitution or re-encoding was performed.

| Family | Configured weights | CSS variable | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| IBM Plex Sans | 400, 500, 600, 700 | `--font-plex` | 40,240 | `056e4e2459f57a0033c8c9c844ff19d6e42ac8602027803d4345823bcc939818` |
| Plus Jakarta Sans | 400, 500, 600, 700, 800 | `--font-jakarta` | 27,272 | `cd8db90cd950e26bc8761f65d323588bd5cd112d326d6d322bc7c8ea86771215` |
| Montserrat | 700 | `--font-montserrat` | 16,472 | `cbcba0f7387dfa1ddb2e375f4ee04ea0dd733c94f0d0f4015baf425dcf9c1580` |
| Space Grotesk | 500, 600, 700 | `--font-invest-display` | 22,320 | `a0d054c4af557de20afd6ca59f47ab353bcaec49c63ff04b6c9d39d0f8910557` |
| JetBrains Mono | 400, 500, 700 | `--font-invest-mono` | 31,340 | `2c32b9b3ee358c119e210f6f5195f9bd34894d78a785ff2e95d60e718e400af4` |

`manifest.json` records exact source URLs, file hashes, font metadata, configured weights and license provenance. IBM Plex Sans, Plus Jakarta Sans, Space Grotesk and JetBrains Mono use the same cached variable font file for each configured weight; Montserrat is the same cached static 700 face. The declared `latin` subset, normal style, `swap` display and preloading are retained.

`fallbacks.css` preserves the exact Arial ascent, descent, line gap and size-adjust values emitted by the previous Google-font loader. Automatic local-font fallback recalculation is disabled so it cannot replace those measurements. Component styles, layout markup and CSS variable names remain unchanged.

The five complete SIL Open Font License 1.1 files are included in `licenses/`, retrieved from the primary [Google Fonts repository at bf7c667ae010c0ffb39944ae85097021478cb91d](https://github.com/google/fonts/tree/bf7c667ae010c0ffb39944ae85097021478cb91d/ofl). Preserve these notices when redistributing the fonts. The upstream font binaries also retain their embedded copyright/license metadata.

To check asset integrity from the repository root:

```sh
node -e 'const fs=require("fs"),c=require("crypto"),m=require("./src/app/fonts/manifest.json");for(const f of m.fonts){const h=c.createHash("sha256").update(fs.readFileSync("src/app/fonts/"+f.file)).digest("hex");if(h!==f.sha256)throw Error(f.file);console.log(f.family,h)}'
```
