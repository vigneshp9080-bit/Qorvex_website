// Qorvex — page-wide 3D particle wave background (Three.js)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg3d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch (err) {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

  // Grid of points that the shader turns into rolling waves
  const small = window.innerWidth < 768;
  const COLS = small ? 90 : 160;
  const ROWS = small ? 50 : 80;
  const GAP = 0.35;
  const positions = new Float32Array(COLS * ROWS * 3);
  let i = 0;
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      positions[i++] = (x - COLS / 2) * GAP;
      positions[i++] = 0;
      positions[i++] = -z * GAP;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: small ? 2.2 : 2.6 },
      uWidth: { value: COLS * GAP },
      uColorA: { value: new THREE.Color(0x2ec58f) },
      uColorB: { value: new THREE.Color(0x22d3ee) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      varying float vElev;
      varying float vX;
      varying float vDepth;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 0.35 + uTime * 0.5) * 0.5
                + cos(p.z * 0.45 + uTime * 0.4) * 0.4
                + sin((p.x + p.z) * 0.2 + uTime * 0.4) * 0.4;
        p.y += w;
        vElev = w;
        vX = position.x;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = uSize * (10.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uWidth;
      varying float vElev;
      varying float vX;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 color = mix(uColorA, uColorB, clamp(vX / uWidth + 0.5, 0.0, 1.0));
        float fade = smoothstep(32.0, 6.0, vDepth);
        float glow = 0.35 + 0.65 * clamp((vElev + 1.5) / 3.0, 0.0, 1.0);
        gl_FragColor = vec4(color, fade * glow * (1.0 - d * 2.0));
      }
    `,
  });

  const wave = new THREE.Points(geometry, material);
  wave.position.set(0, -2.5, 4);
  scene.add(wave);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const render = (t) => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = window.scrollY / maxScroll;

    material.uniforms.uTime.value = t;
    // The camera glides across the wave as the visitor scrolls the page
    wave.rotation.y = progress * 0.9 - 0.2;
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.03;
    camera.position.y = 3 + progress * 2.5 - pointer.y * 0.4;
    camera.position.z = 8;
    camera.lookAt(0, -1.5 - progress * 1.5, -8);
    renderer.render(scene, camera);
  };

  if (reduceMotion) {
    render(0);
    window.addEventListener('resize', () => render(0));
    return;
  }

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => render(clock.getElapsedTime()));
}
