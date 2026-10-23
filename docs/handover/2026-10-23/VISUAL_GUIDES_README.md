# Visual admin and investor guides

Version 1.1, 23 October 2026. The admin edition has 14 screenshot walkthroughs and 26 pages; the investor edition has 15 walkthroughs and 25 pages. Both include the full detailed text reference. The developer guide and API collection are unchanged.

`visual_walkthroughs.json` supplies tasks, steps, screenshot crop rectangles and numbered callouts. `assets/screenshots/` contains actual UAT captures with a SHA-256 provenance manifest. Most images are from 23 October; the publication review is explicitly labelled as an expired 21 October example. No new financial request was created for the guide. Draft examples were left unsaved.

Run `render_visual_guides.py --output /absolute/output/pdf --fonts /path/to/DejaVu/fonts` with Python packages reportlab, pypdf, Pillow and markdown-it-py. It renders only the two visual guides and appends the detailed reference from their Markdown. It uses `render_guides.py` as the reference renderer. Do not use the older three-guide renderer alone to replace these visual outputs.

The output includes clickable visual contents, section bookmarks and continuous page numbers. Read full pages at normal size; zoom for fine transaction details. Dates, balances, sample values and addresses are examples: users must use their own live account and exact current reviews. No credentials or authentication codes appear in the screenshots.
