import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Software WebGL detector per Three.js performance guidelines.
 * Keeps scene geometry identical while pacing frame cost on CPU-rendered headless browsers.
 */
export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

/**
 * Generates a procedural leather micro-dimple bump texture in memory (zero external files).
 */
function createLeatherBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const shade = 110 + ((x * 17 + y * 31) % 45);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

/**
 * Builds the 8-part composite Procedural 3D Cricket Ball group.
 */
function buildCricketBallGroup(bumpMap: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();
  group.rotation.set(0.35, 0.4, -0.28);

  // 1. Main crimson polished leather body
  const leatherGeo = new THREE.SphereGeometry(1.25, 48, 48);
  const leatherMat = new THREE.MeshPhysicalMaterial({
    color: '#991B1B',
    roughness: 0.28,
    metalness: 0.08,
    clearcoat: 0.75,
    clearcoatRoughness: 0.22,
    bumpMap,
    bumpScale: 0.018,
  });
  const ballMesh = new THREE.Mesh(leatherGeo, leatherMat);
  group.add(ballMesh);

  // 2. Darker leather quarter seam belt
  const quarterBelt = new THREE.Mesh(
    new THREE.TorusGeometry(1.253, 0.012, 12, 64),
    new THREE.MeshStandardMaterial({ color: '#450A0A', roughness: 0.65, metalness: 0.05 })
  );
  quarterBelt.rotation.set(0, 0, Math.PI / 2);
  group.add(quarterBelt);

  // 3. Central equator raised leather welt
  const welt = new THREE.Mesh(
    new THREE.TorusGeometry(1.248, 0.045, 16, 64),
    new THREE.MeshStandardMaterial({ color: '#7F1D1D', roughness: 0.55, metalness: 0.1 })
  );
  welt.rotation.set(Math.PI / 2, 0, 0);
  group.add(welt);

  // 4 & 5. Twin parallel stitched seam tracks
  const seamMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    roughness: 0.75,
    metalness: 0.05,
  });
  const seamTop = new THREE.Mesh(new THREE.TorusGeometry(1.262, 0.016, 12, 64), seamMat);
  seamTop.position.set(0, 0.042, 0);
  seamTop.rotation.set(Math.PI / 2, 0, 0);
  group.add(seamTop);

  const seamBottom = new THREE.Mesh(new THREE.TorusGeometry(1.262, 0.016, 12, 64), seamMat);
  seamBottom.position.set(0, -0.042, 0);
  seamBottom.rotation.set(Math.PI / 2, 0, 0);
  group.add(seamBottom);

  // 6. Instanced 48 angled linen cross-stitches
  const stitchCount = 48;
  const stitchGeo = new THREE.BoxGeometry(0.024, 0.075, 0.025);
  const stitchMat = new THREE.MeshStandardMaterial({
    color: '#FFFBEB',
    roughness: 0.8,
    metalness: 0.05,
  });
  const stitchInstanced = new THREE.InstancedMesh(stitchGeo, stitchMat, stitchCount);
  const dummy = new THREE.Object3D();
  const radius = 1.272;
  for (let i = 0; i < stitchCount; i++) {
    const angle = (i / stitchCount) * Math.PI * 2;
    const sideOffset = i % 2 === 0 ? 0.062 : -0.062;
    dummy.position.set(Math.cos(angle) * radius, sideOffset, Math.sin(angle) * radius);
    dummy.lookAt(0, 0, 0);
    dummy.rotateZ(i % 2 === 0 ? 0.45 : -0.45);
    dummy.updateMatrix();
    stitchInstanced.setMatrixAt(i, dummy.matrix);
  }
  stitchInstanced.instanceMatrix.needsUpdate = true;
  stitchInstanced.computeBoundingSphere();
  group.add(stitchInstanced);

  // 7. Gold foil makers stamp ring
  const stamp = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.23, 32),
    new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      metalness: 0.85,
      roughness: 0.2,
      side: THREE.DoubleSide,
    })
  );
  stamp.position.set(0, 1.245, 0);
  stamp.rotation.set(Math.PI / 2, 0, 0);
  group.add(stamp);

  return group;
}

/**
 * Builds the 9-part composite Procedural 3D Championship Trophy + Confetti group.
 */
function buildTrophyGroup(): {
  trophyGroup: THREE.Group;
  confettiMesh: THREE.InstancedMesh;
  confettiData: { x: number; y: number; z: number; speed: number; rotSpeed: number }[];
} {
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, -0.25, 0);

  // 1. Tiered dark obsidian plinth
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.96, 0.36, 32),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.4 })
  );
  plinth.position.set(0, -1.25, 0);
  trophyGroup.add(plinth);

  // 2. Gold championship nameplate band
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.78, 0.14, 32),
    new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.18, metalness: 0.92 })
  );
  collar.position.set(0, -1.02, 0);
  trophyGroup.add(collar);

  // 3. Tapered metallic stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.56, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: '#FBBF24', roughness: 0.22, metalness: 0.88 })
  );
  stem.position.set(0, -0.35, 0);
  trophyGroup.add(stem);

  // 4, 5, 6. Three sculpted vertical pillar ribs
  const ribGeo = new THREE.TorusGeometry(0.62, 0.055, 12, 32, Math.PI);
  const ribMat = new THREE.MeshStandardMaterial({
    color: '#FDE68A',
    roughness: 0.15,
    metalness: 0.95,
  });
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((angle) => {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.set(Math.cos(angle) * 0.38, 0.1, Math.sin(angle) * 0.38);
    rib.rotation.set(0, -angle, 0.18);
    trophyGroup.add(rib);
  });

  // 7. Main Championship Chalice Bowl
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.3, 1.05, 32, 1, false),
    new THREE.MeshPhysicalMaterial({
      color: '#F59E0B',
      roughness: 0.14,
      metalness: 0.94,
      clearcoat: 0.8,
    })
  );
  bowl.position.set(0, 0.55, 0);
  trophyGroup.add(bowl);

  // 8. Crown Rim Ring
  const crownRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.05, 16, 48),
    new THREE.MeshStandardMaterial({ color: '#FEF08A', roughness: 0.12, metalness: 0.96 })
  );
  crownRim.position.set(0, 1.08, 0);
  crownRim.rotation.set(Math.PI / 2, 0, 0);
  trophyGroup.add(crownRim);

  // 9. Inner Levitating Cricket Sphere
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 24),
    new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.25, metalness: 0.35 })
  );
  globe.position.set(0, 1.28, 0);
  trophyGroup.add(globe);

  // Celebratory Confetti Instances
  const confettiCount = 36;
  const confettiMesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.09, 0.05),
    new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.6,
    }),
    confettiCount
  );
  confettiMesh.frustumCulled = false;

  const palette = [
    new THREE.Color('#F59E0B'),
    new THREE.Color('#38BDF8'),
    new THREE.Color('#F43F5E'),
    new THREE.Color('#A855F7'),
  ];
  const dummy = new THREE.Object3D();
  const confettiData = Array.from({ length: confettiCount }, (_, i) => {
    const item = {
      x: Math.sin(i * 2.1) * 2.1,
      y: ((i * 0.37) % 3.2) - 1.4,
      z: Math.cos(i * 1.7) * 1.6,
      speed: 0.4 + (i % 5) * 0.15,
      rotSpeed: 1.2 + (i % 4) * 0.4,
    };
    dummy.position.set(item.x, item.y, item.z);
    dummy.rotation.set(i * 0.5, i * 0.3, i);
    dummy.updateMatrix();
    confettiMesh.setMatrixAt(i, dummy.matrix);
    confettiMesh.setColorAt(i, palette[i % palette.length]);
    return item;
  });
  confettiMesh.instanceMatrix.needsUpdate = true;
  if (confettiMesh.instanceColor) confettiMesh.instanceColor.needsUpdate = true;

  return { trophyGroup, confettiMesh, confettiData };
}

/**
 * Builds the 6-part composite Procedural 3D Orange / Purple Cap + Orbiting Halo.
 */
function buildCapGroup(variant: 'orange' | 'purple'): {
  capGroup: THREE.Group;
  haloRing: THREE.Mesh;
} {
  const primaryColor = variant === 'orange' ? '#EA580C' : '#9333EA';
  const accentColor = variant === 'orange' ? '#FDBA74' : '#D8B4FE';
  const glowColor = variant === 'orange' ? '#F97316' : '#A855F7';

  const capGroup = new THREE.Group();
  capGroup.position.set(0, -0.15, 0);
  capGroup.rotation.set(0.22, 0.38, -0.05);

  // 1. Tailored Cap Crown Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.58, metalness: 0.15 })
  );
  capGroup.add(dome);

  // 2. Crown Seam Ribs
  const ribMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.38,
    metalness: 0.45,
  });
  [0, Math.PI / 3, (Math.PI * 2) / 3].forEach((rot) => {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(1.024, 0.012, 8, 32, Math.PI),
      ribMat
    );
    rib.rotation.set(0, rot, 0);
    capGroup.add(rib);
  });

  // 3. Top Cap Button (Squatchee)
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.3, metalness: 0.7 })
  );
  button.position.set(0, 1.02, 0);
  capGroup.add(button);

  // 4. Base Trim Band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(1.01, 0.045, 12, 48),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.45, metalness: 0.35 })
  );
  band.position.set(0, 0.02, 0);
  band.rotation.set(Math.PI / 2, 0, 0);
  capGroup.add(band);

  // 5. Curved Front Visor Brim
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.9,
      0.96,
      0.42,
      32,
      1,
      false,
      -Math.PI * 0.42,
      Math.PI * 0.84
    ),
    new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.48, metalness: 0.2 })
  );
  visor.position.set(0, 0.01, 0.86);
  visor.rotation.set(0.14, 0, 0);
  visor.scale.set(1.0, 0.1, 0.72);
  capGroup.add(visor);

  // 6. Front Gold Crest Emblem
  const crest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.05, 6),
    new THREE.MeshStandardMaterial({ color: '#FBBF24', roughness: 0.18, metalness: 0.92 })
  );
  crest.position.set(0, 0.4, 0.95);
  crest.rotation.set(-0.35, 0, 0);
  capGroup.add(crest);

  // Glowing Orbital Halo Ring
  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.024, 16, 64),
    new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.6 })
  );
  haloRing.position.set(0, 0.15, -0.5);

  return { capGroup, haloRing };
}

export interface SceneCanvas3DProps {
  mode: 'ball' | 'trophy' | 'orange-cap' | 'purple-cap';
  reducedMotion?: boolean;
  className?: string;
}

/**
 * Isolated WebGL Canvas mount following the Three.js skill lifecycle & software-WebGL rules:
 * - Uses RoomEnvironment + PMREMGenerator for authentic metallic/leather reflections.
 * - Uses afterDraw() frame pacing on software WebGL so headless screenshots never stall.
 * - Pre-allocates objects outside the loop and cleans up all GPU resources on unmount.
 */
export default function SceneCanvas3D({
  mode,
  reducedMotion = false,
  className = 'w-full h-full',
}: SceneCanvas3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 4.1);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Floodlights
    const accentColor =
      mode === 'orange-cap'
        ? '#F97316'
        : mode === 'purple-cap'
        ? '#A855F7'
        : mode === 'trophy'
        ? '#F59E0B'
        : '#38BDF8';

    const hemiLight = new THREE.HemisphereLight('#38BDF8', '#0F172A', 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFFBEB', 2.2);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(accentColor, 1.5);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Contact shadow grounding disc
    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.55, 32),
      new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
    );
    contactShadow.position.set(0, -1.68, 0);
    contactShadow.rotation.set(-Math.PI / 2, 0, 0);
    scene.add(contactShadow);

    // Drifting stadium atmosphere particles
    const particleCount = 28;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = Math.sin(i * 3.7) * 2.2;
      particlePositions[i * 3 + 1] = Math.cos(i * 2.3) * 1.5;
      particlePositions[i * 3 + 2] = Math.sin(i * 1.9) * 1.4 - 0.4;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: accentColor,
      size: 0.055,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Build mode-specific composite 3D subject
    let ballPivot: THREE.Group | null = null;
    let ballGroup: THREE.Group | null = null;
    let bumpMap: THREE.CanvasTexture | null = null;
    let trophyObj: ReturnType<typeof buildTrophyGroup> | null = null;
    let capObj: ReturnType<typeof buildCapGroup> | null = null;

    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragRotY = 0;
    let dragRotX = 0;

    if (mode === 'ball') {
      bumpMap = createLeatherBumpTexture();
      ballPivot = new THREE.Group();
      ballGroup = buildCricketBallGroup(bumpMap);
      ballPivot.add(ballGroup);
      scene.add(ballPivot);
      container.style.cursor = 'grab';
      container.style.touchAction = 'none';
    } else if (mode === 'trophy') {
      trophyObj = buildTrophyGroup();
      scene.add(trophyObj.trophyGroup);
      scene.add(trophyObj.confettiMesh);
    } else {
      capObj = buildCapGroup(mode === 'orange-cap' ? 'orange' : 'purple');
      scene.add(capObj.capGroup);
      scene.add(capObj.haloRing);
    }

    const onPointerDown = (e: PointerEvent) => {
      if (mode !== 'ball') return;
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      container.style.cursor = 'grabbing';
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // ignore fallback
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Normalized cursor offset from center (-1 to +1)
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = Math.max(-1.2, Math.min(1.2, (e.clientX - cx) / (rect.width / 2)));
        const ny = Math.max(-1.2, Math.min(1.2, (e.clientY - cy) / (rect.height / 2)));
        pointerRef.current.x = nx;
        pointerRef.current.y = ny;
      }

      if (isDragging && ballGroup) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        dragRotY += dx * 0.008;
        dragRotX += dy * 0.008;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (mode === 'ball') {
        isDragging = false;
        container.style.cursor = 'grab';
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {
          // ignore fallback
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 420;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Render initial frame immediately
    renderer.render(scene, camera);

    let frameId = 0;
    let lastTime = performance.now();
    const dummy = new THREE.Object3D();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      const elapsed = now / 1000;
      lastTime = now;

      if (!reducedMotion) {
        particles.rotation.y += dt * 0.08;

        if (ballPivot && ballGroup) {
          // 1. Continuous realistic seam spin & interactive drag inertia
          ballGroup.rotation.y += dt * 0.55 + dragRotY;
          ballGroup.rotation.x += dragRotX;
          dragRotY *= 0.92;
          dragRotX *= 0.92;

          // 2. Cursor follow:
          // Cursor moves RIGHT (pointerX > 0) -> turns ball RIGHT (positive Y rotation)
          // Cursor moves LEFT (pointerX < 0)  -> turns ball LEFT (negative Y rotation)
          // Cursor moves DOWN (pointerY > 0)  -> tilts ball DOWN (positive X rotation)
          // Cursor moves UP (pointerY < 0)    -> tilts ball UP (negative X rotation)
          const targetTiltY = pointerRef.current.x * 0.45;
          const targetTiltX = pointerRef.current.y * 0.35;
          const targetTiltZ = -pointerRef.current.x * 0.12;

          ballPivot.rotation.y = THREE.MathUtils.damp(ballPivot.rotation.y, targetTiltY, 4, dt);
          ballPivot.rotation.x = THREE.MathUtils.damp(ballPivot.rotation.x, targetTiltX, 4, dt);
          ballPivot.rotation.z = THREE.MathUtils.damp(ballPivot.rotation.z, targetTiltZ, 4, dt);

          // Gentle ambient float
          ballPivot.position.y = Math.sin(elapsed * 2.0) * 0.08;
        }

        if (trophyObj) {
          trophyObj.trophyGroup.rotation.y += dt * 0.65;
          for (let i = 0; i < trophyObj.confettiData.length; i++) {
            const d = trophyObj.confettiData[i];
            let yPos = d.y - ((elapsed * d.speed) % 3.2);
            if (yPos < -1.6) yPos += 3.2;
            dummy.position.set(d.x, yPos, d.z);
            dummy.rotation.set(elapsed * d.rotSpeed, elapsed * d.rotSpeed * 0.7, i);
            dummy.updateMatrix();
            trophyObj.confettiMesh.setMatrixAt(i, dummy.matrix);
          }
          trophyObj.confettiMesh.instanceMatrix.needsUpdate = true;
        }

        if (capObj) {
          capObj.capGroup.rotation.y = Math.sin(elapsed * 0.85) * 0.42 + 0.38;
          capObj.capGroup.position.y = -0.15 + Math.sin(elapsed * 1.8) * 0.06;
          capObj.haloRing.rotation.z += dt * 0.75;
        }
      }

      renderer.render(scene, camera);

      if (!reducedMotion) {
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      }
    }

    if (!reducedMotion) {
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', onResize);
      envTexture.dispose();
      bumpMap?.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [mode, reducedMotion]);

  return (
    <div
      ref={mountRef}
      className={`relative select-none ${className}`}
      data-testid={`scene-3d-${mode}`}
    />
  );
}
