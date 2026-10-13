# Springs refactor — make motion feel expensive

Cheap motion eases from A to B on a fixed curve. Expensive motion has mass: it accelerates, overshoots a hair, settles.

Prompt:
```
Replace every easing curve and linear tween in projects/<slug>/index.html with closed-form springs from engine/lib/motion.js.
- UI (buttons, toggles, leading edges): 'snappy' (tiny overshoot)
- Containers, cards, camera: 'default'
- Big type, numbers, logo lockups, 3D: 'heavy' (no overshoot)
- Mascots, stickers only: 'playful' (visible overshoot)
Any value with more than one target uses track() — one spring per change, never restart a spring.
Text never overshoots. Keep everything a pure function of t.
```
The `style.json → motion.pace` picks the default feel for a project; scenes ask for roles (`sp(t, 'heavy')`), not numbers.
