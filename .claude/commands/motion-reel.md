---
description: One-line product/showreel video — e.g. /motion-reel https://acme.com 20s vertical ref ./refs/frame.png
argument-hint: <url or "showreel"> [duration] [vertical|square|wide] [ref path] [voice]
---
Make a product or showreel motion video with the motion-studio skill: $ARGUMENTS

If a URL is given: product-launch playbook (capture real assets first). If "showreel": showreel playbook. If a reference path is given, run the reference-extraction pass before the shot list. If "voice" is mentioned, add the Fish Audio voiceover pass. Default 20s, 9:16 first then 1:1 and 16:9, synthesized music. Show the shot list and a contact sheet with scores before the full render.
