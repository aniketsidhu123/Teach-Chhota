# Rabbit asset

Place the real, rigged model here as `rabbit.glb`. No model is bundled or substituted.
Include embedded textures and a skeleton with weighted body and ear meshes.
The asset should contain only the rabbit and its clothing/accessories, without scenery.

Requested appearance: upright black stylized rabbit, large rounded head, long curved
ears, glossy white oval eyes, pink T-shirt with white skull graphic, white shorts,
black-and-white chunky sneakers, and silver chain.

The reusable component is `src/components/avatar/rabbit-figurine.tsx`.
It is deliberately not mounted in the app yet. After supplying the asset, import it
into the desired existing UI slot:

```tsx
import RabbitFigurine from '@/components/avatar/rabbit-figurine';

<RabbitFigurine
  style={{ width: 'min(100%, 280px)' }}
  scale={1.2}
  position={[0, -0.2, 0]}
  earBoneNames={['Ear.L', 'Ear.R']}
/>
```

- `style.width` adjusts the element's footprint; its default aspect ratio is 7:9.
  Set `style.height` as well if the existing slot has a specific height.
- `scale` changes the model size inside the canvas; `position` moves it in 3D space.
  Adjust these after inspecting the real asset's units, origin, and proportions.
- `rotation` sets the base orientation in radians. `cameraPosition` and `cameraFov`
  adjust initial framing; the camera stays fixed and has no orbit controls.
- Use normal parent layout or `style` for placement within the existing interface.
- `earBoneNames` must match actual bone names in left/right order. Missing bones
  are skipped; body sway still runs. Ear axes may need adjustment for the actual rig.
- `swayAmount`, `swaySpeed`, and `earAmount` tune procedural motion. Embedded clips
  are not played. `reducedMotion` or the OS reduced-motion setting stops animation.
- Transparent canvas, no floor, cast shadows, background image, or scene controls.
  Component-local lights illuminate the model only. CSS is scoped with CSS Modules.
- No request is made until mounted. A failed asset shows a local message without
  replacing the surrounding app. Changing `src` resets that error boundary.
- The URL respects Vite's base path; at the root it is `/models/rabbit.glb`,
  not `/public/models/rabbit.glb`.

Validate appearance, framing, ear deformation, and animation with the real GLB before
enabling the component. Preserve the asset's license/attribution alongside it.
