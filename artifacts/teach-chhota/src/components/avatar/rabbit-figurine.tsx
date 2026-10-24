import { Component, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Bone, Group, SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import styles from './rabbit-figurine.module.css';

type Vector3Tuple = [number, number, number];
const DEFAULT_EARS = ['Ear.L', 'Ear.R'];
const ORIGIN: Vector3Tuple = [0, 0, 0];
const CAMERA: Vector3Tuple = [0, 0, 4];

export interface RabbitFigurineProps {
  src?: string;
  className?: string;
  style?: CSSProperties;
  scale?: number;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  /** Ordered left/right ear bone names from the actual asset. */
  earBoneNames?: string[];
  swayAmount?: number;
  swaySpeed?: number;
  earAmount?: number;
  /** Can disable motion explicitly; OS reduced-motion preference always wins. */
  reducedMotion?: boolean;
  cameraPosition?: Vector3Tuple;
  cameraFov?: number;
  label?: string;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

class RabbitErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <span className={styles.status} role="status">Rabbit unavailable. A valid rigged GLB model is required.</span>
      : this.props.children;
  }
}

type ModelProps = Required<Pick<RabbitFigurineProps,
  'src' | 'scale' | 'position' | 'rotation' | 'earBoneNames' | 'swayAmount' | 'swaySpeed' | 'earAmount' | 'reducedMotion'
>>;

function RabbitModel({ src, scale, position, rotation, earBoneNames, swayAmount, swaySpeed, earAmount, reducedMotion }: ModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useLoader(GLTFLoader, src);
  const model = useMemo(() => {
    // Object3D.clone alone leaves skinned meshes referencing the original skeleton.
    const copy = clone(scene);
    let rigged = false;
    copy.traverse((object) => {
      if (object instanceof SkinnedMesh && object.skeleton.bones.length > 0) rigged = true;
      // Asset cameras/lights must not alter this component's fixed presentation.
      if ('isLight' in object || 'isCamera' in object) object.visible = false;
    });
    if (!rigged) throw new Error('Rabbit model must contain a skinned mesh and skeleton.');
    return copy;
  }, [scene]);

  // Snapshot the bind pose once, even if a caller supplies a fresh names array.
  const restPose = useMemo(() => {
    const poses = new Map<Bone, Bone['rotation']>();
    model.traverse((object) => {
      if (object instanceof Bone) poses.set(object, object.rotation.clone());
    });
    return poses;
  }, [model]);

  // Preserve the supplied ordering, including when only one named ear exists.
  const ears = useMemo(() => earBoneNames.flatMap((name, index) => {
    const bone = model.getObjectByName(name);
    const rest = bone instanceof Bone ? restPose.get(bone) : undefined;
    return bone instanceof Bone && rest ? [{ bone, index, rest }] : [];
  }), [model, earBoneNames, restPose]);

  useEffect(() => () => {
    // Cached geometry/materials belong to useLoader; only release cloned skeletons.
    const skeletons = new Set<SkinnedMesh['skeleton']>();
    model.traverse((object) => {
      if (object instanceof SkinnedMesh) skeletons.add(object.skeleton);
    });
    skeletons.forEach((skeleton) => skeleton.dispose());
  }, [model]);

  useEffect(() => {
    if (group.current) group.current.rotation.set(...rotation);
    ears.forEach(({ bone, rest }) => bone.rotation.copy(rest));
    return () => { ears.forEach(({ bone, rest }) => bone.rotation.copy(rest)); };
  }, [reducedMotion, rotation, ears]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    // Restore every axis when motion is disabled, including previous Z sway.
    group.current.rotation.set(...rotation);
    ears.forEach(({ bone, rest }) => bone.rotation.copy(rest));
    if (reducedMotion) return;
    const t = clock.elapsedTime * swaySpeed;
    group.current.rotation.y += Math.sin(t) * swayAmount;
    group.current.rotation.z += Math.sin(t) * swayAmount * 0.25;
    ears.forEach(({ bone, index, rest }) => {
      const lag = index % 2 === 0 ? 0.45 : 0.75;
      const wave = Math.sin(t - lag) * earAmount;
      bone.rotation.z = rest.z + wave * (index % 2 === 0 ? 1 : -1);
      bone.rotation.x = rest.x + wave * 0.25;
    });
  });

  return <group ref={group} scale={scale} position={position} rotation={rotation}>
    <primitive object={model} dispose={null} />
  </group>;
}

/** Unmounted until a real rabbit asset is supplied; importing does not preload it. */
export default function RabbitFigurine({
  src = `${import.meta.env.BASE_URL}models/rabbit.glb`,
  className, style, scale = 1, position = ORIGIN, rotation = ORIGIN,
  earBoneNames = DEFAULT_EARS, swayAmount = 0.06, swaySpeed = 1.2, earAmount = 0.08,
  reducedMotion = false, cameraPosition = CAMERA, cameraFov = 35,
  label = 'Animated rabbit figurine',
}: RabbitFigurineProps) {
  const prefersReducedMotion = useReducedMotion();
  const stopMotion = reducedMotion || prefersReducedMotion;
  return <div className={[styles.root, className].filter(Boolean).join(' ')} style={style} role="img" aria-label={label}>
    <RabbitErrorBoundary key={src}>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        dpr={[1, 2]}
        frameloop={stopMotion ? 'demand' : 'always'}
        style={{ background: 'transparent', pointerEvents: 'none' }}
        fallback={<span className={styles.status}>3D rendering is unavailable on this device.</span>}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <Suspense fallback={null}>
          <RabbitModel {...{ src, scale, position, rotation, earBoneNames, swayAmount, swaySpeed, earAmount }} reducedMotion={stopMotion} />
        </Suspense>
      </Canvas>
    </RabbitErrorBoundary>
  </div>;
}
