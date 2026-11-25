// Qorvex — interactive 3D hero scene (Three.js), styled after the logo:
// porcelain core, ink and green orbit rings.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero3d');
const host = canvas && canvas.parentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    return; // No WebGL — the CSS pattern and glow still give the hero depth.
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  let baseZ = 9;
  camera.position.set(0, 0, baseZ);

  const GREEN = 0x2ec58f;
  const GREEN_DARK = 0x0f9465;
  const INK = 0x111318;

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 5, 6);
  const rim = new THREE.PointLight(GREEN, 40, 20);
  rim.position.set(4, -2, 3);
  scene.add(key, rim);

  const world = new THREE.Group();
  scene.add(world);

  // Faceted porcelain core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.45, 1),
    new THREE.MeshStandardMaterial({ color: 0xf7f6f1, metalness: 0.08, roughness: 0.38, flatShading: true })
  );
  world.add(core);

  // Ink wireframe shell
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.05, 1)),
    new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.22 })
  );
  world.add(shell);

  // Green nodes on the shell
  const nodes = new THREE.Points(
    new THREE.IcosahedronGeometry(2.05, 1),
    new THREE.PointsMaterial({ color: GREEN_DARK, size: 0.085 })
  );
  world.add(nodes);

  // Orbit rings — ink and green, like the logo
  const ringMat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.035, 12, 180), ringMat(INK, 0.9));
  ring1.rotation.set(Math.PI / 2.4, 0.3, 0);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.03, 12, 180), ringMat(GREEN, 0.95));
  ring2.rotation.set(Math.PI / 1.8, -0.5, 0.4);
  world.add(ring1, ring2);

  // Satellites travelling along the rings
  const satGeo = new THREE.SphereGeometry(0.11, 20, 20);
  const sat1 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: GREEN }));
  const sat2 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: INK }));
  ring1.add(sat1);
  ring2.add(sat2);

  // Small floating shapes orbiting the core
  const shapeDefs = [
    { geo: new THREE.OctahedronGeometry(0.28), color: GREEN, pos: [-3.1, 1.6, 0.5] },
    { geo: new THREE.TetrahedronGeometry(0.3), color: INK, pos: [3.0, 1.9, -0.6] },
    { geo: new THREE.TorusGeometry(0.22, 0.08, 12, 32), color: GREEN, pos: [2.7, -2.0, 0.8] },
    { geo: new THREE.BoxGeometry(0.32, 0.32, 0.32), color: INK, pos: [-2.6, -2.1, -0.4] },
    { geo: new THREE.IcosahedronGeometry(0.22, 0), color: 0xffffff, pos: [0.4, 3.0, -1.2] },
  ];
  const shapes = shapeDefs.map(({ geo, color, pos }, i) => {
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.4, flatShading: true })
    );
    mesh.position.set(...pos);
    mesh.userData = { base: new THREE.Vector3(...pos), phase: i * 1.3, spin: 0.4 + i * 0.15 };
    scene.add(mesh);
    return mesh;
  });

  // Particle field
  const COUNT = 700;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 3.6 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: 0x5b616d, size: 0.03, transparent: true, opacity: 0.45 })
  );
  scene.add(particles);

  // Sizing
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    baseZ = w < 420 ? 11 : 9;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(host);
  resize();

  if (reduceMotion) {
    camera.position.z = baseZ;
    renderer.render(scene, camera);
    return;
  }

  // Pointer parallax
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Intro fly-in starts when the opening animation finishes
  let introStart = null;
  const startIntro = () => { if (introStart === null) introStart = performance.now(); };
  if (document.body.classList.contains('is-loaded')) startIntro();
  else document.addEventListener('qorvex:ready', startIntro, { once: true });
  setTimeout(startIntro, 5000); // safety net
  const easeOut = (x) => 1 - Math.pow(1 - x, 4);

  // Only animate while the hero is on screen
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(host);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    const intro = introStart === null ? 0 : easeOut(Math.min((performance.now() - introStart) / 2200, 1));
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.2);

    core.rotation.x = t * 0.25;
    core.rotation.y = t * 0.35;
    shell.rotation.y = nodes.rotation.y = -t * 0.15;
    shell.rotation.x = nodes.rotation.x = t * 0.08;
    ring1.rotation.z = t * 0.3;
    ring2.rotation.z = -t * 0.22;
    sat1.position.set(Math.cos(t * 1.2) * 2.8, Math.sin(t * 1.2) * 2.8, 0);
    sat2.position.set(Math.cos(-t * 0.9) * 3.2, Math.sin(-t * 0.9) * 3.2, 0);

    // Particles start scattered and converge during the intro
    particles.rotation.y = t * 0.03;
    particles.scale.setScalar(1 + (1 - intro) * 2.5);
    particles.material.opacity = 0.45 * intro;

    // Core spins in from far away, then follows the pointer and scroll
    world.scale.setScalar(0.15 + 0.85 * intro);
    world.position.y = Math.sin(t * 1.1) * 0.12 + scroll * 1.2;
    const spin = (1 - intro) * Math.PI * 2;
    world.rotation.y += (pointer.x * 0.3 + spin + scroll * 0.6 - world.rotation.y) * 0.05;
    world.rotation.x += (pointer.y * 0.2 + scroll * 0.3 - world.rotation.x) * 0.05;

    shapes.forEach((m, i) => {
      const { base, phase, spin: s } = m.userData;
      m.rotation.x = t * s;
      m.rotation.y = t * s * 1.3;
      m.position.set(
        base.x * (0.3 + 0.7 * intro) + Math.sin(t * 0.7 + phase) * 0.25,
        base.y * (0.3 + 0.7 * intro) + Math.cos(t * 0.9 + phase) * 0.25,
        base.z + pointer.x * (i % 2 ? 0.2 : -0.2)
      );
      m.scale.setScalar(intro);
    });

    // Camera flies in, then eases back as the visitor scrolls
    camera.position.z = baseZ + (1 - intro) * 14 + scroll * 3;
    camera.position.x += (pointer.x * 0.25 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 0.15 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  });
}
