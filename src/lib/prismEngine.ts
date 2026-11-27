/**
 * Real-time 3D Glass Prism & 72-Wavelength Cauchy Dispersion Light Engine.
 * Glass geometry and multi-pass WebGL2 refraction shaders ported from
 * vercel-labs/vgpu (MIT License, Copyright (c) Vercel, Inc.),
 * apps/docs/app/[lang]/(home)/components/prism-background.
 */
import * as THREE from 'three';

interface Vec2 {
  x: number;
  y: number;
}

interface SpectralSample {
  nm: number;
  n: number;
  vivid: [number, number, number];
  core: [number, number, number];
  weight: number;
}

interface RaySegment {
  p0: Vec2;
  p1: Vec2;
  energy: number;
  inside: boolean;
  outgoing: boolean;
}

interface DustMote {
  t: number;
  spread: number;
  speed: number;
  radius: number;
  phase: number;
  freq: number;
}

interface LayoutMetrics {
  W: number;
  H: number;
  dpr: number;
  fxDpr: number;
  mobile: boolean;
  S: number;
  R: number;
  cx: number;
  cy: number;
  verts: [Vec2, Vec2, Vec2]; // top, right, left (y-down 2D plane)
  normals: [Vec2, Vec2, Vec2]; // outward normals for edges 0 (right), 1 (base), 2 (left)
  edges: [[Vec2, Vec2], [Vec2, Vec2], [Vec2, Vec2]];
  diag: number;
}

const SQRT3 = Math.sqrt(3);
const WAVELENGTH_COUNT = 72;
const LAMBDA_MIN = 410;
const LAMBDA_MAX = 695;
const GLASS_IOR = 1.645;
const GLASS_F0 = Math.pow((GLASS_IOR - 1) / (GLASS_IOR + 1), 2);
const REFLECTION_STRENGTH = 2.35;

/**
 * Pure P3-inspired visible spectrum approximation (410nm violet -> 695nm crimson).
 */
function wavelengthToRgb(nm: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;

  if (nm < 440) {
    r = -(nm - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (nm < 490) {
    r = 0;
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm < 510) {
    r = 0;
    g = 1;
    b = -(nm - 510) / (510 - 490);
  } else if (nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / (645 - 580);
    b = 0;
  } else {
    r = 1;
    g = 0;
    b = 0;
  }

  let atten = 1;
  if (nm < 420) atten = 0.55 + 0.45 * ((nm - 395) / (420 - 395));
  else if (nm > 665) atten = 0.55 + 0.45 * ((710 - nm) / (710 - 665));

  return [
    Math.pow(Math.max(0, Math.min(1, r * atten)), 0.78),
    Math.pow(Math.max(0, Math.min(1, g * atten)), 0.78),
    Math.pow(Math.max(0, Math.min(1, b * atten)), 0.78),
  ];
}

function buildSpectrum(): SpectralSample[] {
  const raw: { nm: number; n: number; rgb: [number, number, number] }[] = [];
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < WAVELENGTH_COUNT; i++) {
    const t = i / (WAVELENGTH_COUNT - 1);
    const nm = LAMBDA_MIN + t * (LAMBDA_MAX - LAMBDA_MIN);
    const um = nm / 1000;
    const n = 1.2 + 0.1 / (um * um);
    const rgb = wavelengthToRgb(nm);
    sumR += rgb[0];
    sumG += rgb[1];
    sumB += rgb[2];
    raw.push({ nm, n, rgb });
  }

  const mean = (sumR + sumG + sumB) / 3;
  const scaleR = mean / Math.max(sumR, 1e-4);
  const scaleG = mean / Math.max(sumG, 1e-4);
  const scaleB = mean / Math.max(sumB, 1e-4);

  return raw.map(({ nm, n, rgb }) => {
    const cr = Math.min(1, rgb[0] * scaleR);
    const cg = Math.min(1, rgb[1] * scaleG);
    const cb = Math.min(1, rgb[2] * scaleB);
    const weight = (1 / WAVELENGTH_COUNT) * 3.6;
    return {
      nm,
      n,
      vivid: [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)],
      core: [Math.round(cr * 255), Math.round(cg * 255), Math.round(cb * 255)],
      weight,
    };
  });
}

const SPECTRUM = buildSpectrum();

function createDustMotes(): DustMote[] {
  const motes: DustMote[] = [];
  for (let i = 0; i < 70; i++) {
    motes.push({
      t: Math.random(),
      spread: (Math.random() - 0.5) * 2,
      speed: 0.014 + Math.random() * 0.026,
      radius: 0.55 + Math.random() * 1.15,
      phase: Math.random() * Math.PI * 2,
      freq: 0.9 + Math.random() * 2.1,
    });
  }
  return motes;
}

function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function refract2D(dir: Vec2, normal: Vec2, eta: number): Vec2 | null {
  const cosI = -dot2(normal, dir);
  const sinT2 = eta * eta * (1 - cosI * cosI);
  if (sinT2 > 1) return null;
  const cosT = Math.sqrt(Math.max(0, 1 - sinT2));
  return {
    x: eta * dir.x + (eta * cosI - cosT) * normal.x,
    y: eta * dir.y + (eta * cosI - cosT) * normal.y,
  };
}

function reflect2D(dir: Vec2, normal: Vec2): Vec2 {
  const d = 2 * dot2(dir, normal);
  return { x: dir.x - d * normal.x, y: dir.y - d * normal.y };
}

function fresnelUnpolarized(cosI: number, n1: number, n2: number): number {
  const sinT2 = ((n1 / n2) * (n1 / n2)) * (1 - cosI * cosI);
  if (sinT2 >= 1) return 1;
  const cosT = Math.sqrt(Math.max(0, 1 - sinT2));
  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n1 * cosT - n2 * cosI) / (n1 * cosT + n2 * cosI);
  return 0.5 * (rs * rs + rp * rp);
}

function intersectRaySegment(
  origin: Vec2,
  dir: Vec2,
  a: Vec2,
  b: Vec2,
): { t: number; u: number; point: Vec2 } | null {
  const sx = b.x - a.x;
  const sy = b.y - a.y;
  const denom = dir.x * sy - dir.y * sx;
  if (Math.abs(denom) < 1e-8) return null;
  const dx = a.x - origin.x;
  const dy = a.y - origin.y;
  const t = (dx * sy - dy * sx) / denom;
  const u = (dx * dir.y - dy * dir.x) / denom;
  if (t > 1e-3 && u >= -1e-4 && u <= 1 + 1e-4) {
    return {
      t,
      u,
      point: { x: origin.x + dir.x * t, y: origin.y + dir.y * t },
    };
  }
  return null;
}

/**
 * Procedural rounded-edge triangular prism mesh ported from vercel-labs/vgpu.
 * Apex up, centered at origin, z in [-depth/2, +depth/2].
 * Fillet on all 9 edges: 4 corner segments, 4 bevel segments, 16 edge segments.
 */
function createPrismGeometry(S: number): {
  geometry: THREE.BufferGeometry;
  depth: number;
  planes: THREE.Vector4[];
} {
  const R = S / SQRT3;
  const depth = (S * 0.3) / 0.57;
  const r = (S * 0.0085) / 0.57;
  const halfD = depth * 0.5;
  const innerZ = halfD - r;
  const cornerSegs = 4;
  const bevelSegs = 4;
  const edgeSegs = 16;

  // 2D CCW rounded triangle contour in y-up XY space (corners at 90°, 210°, 330°)
  const cornerAngles = [Math.PI * 0.5, (7 * Math.PI) / 6, (11 * Math.PI) / 6];
  const innerR = R - 2 * r;
  const contour: { x: number; y: number; nx: number; ny: number }[] = [];

  for (let c = 0; c < 3; c++) {
    const ca = cornerAngles[c];
    const cx = Math.cos(ca) * innerR;
    const cy = Math.sin(ca) * innerR;
    const startA = ca - Math.PI / 3;
    const endA = ca + Math.PI / 3;

    for (let s = 0; s < cornerSegs; s++) {
      const a = startA + (s / cornerSegs) * (endA - startA);
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      contour.push({ x: cx + r * nx, y: cy + r * ny, nx, ny });
    }

    const nextCa = cornerAngles[(c + 1) % 3];
    const ncx = Math.cos(nextCa) * innerR;
    const ncy = Math.sin(nextCa) * innerR;
    const fnx = Math.cos(endA);
    const fny = Math.sin(endA);
    const p0x = cx + r * fnx;
    const p0y = cy + r * fny;
    const p1x = ncx + r * fnx;
    const p1y = ncy + r * fny;

    for (let e = 0; e < edgeSegs; e++) {
      const t = e / edgeSegs;
      contour.push({
        x: p0x + (p1x - p0x) * t,
        y: p0y + (p1y - p0y) * t,
        nx: fnx,
        ny: fny,
      });
    }
  }

  const N = contour.length;
  const maxTheta = Math.PI * 0.5 - 0.06;
  const ringSpecs: { z: number; inset: number; nr: number; nz: number }[] = [];

  for (let b = 0; b <= bevelSegs; b++) {
    const theta = maxTheta * (1 - b / bevelSegs);
    ringSpecs.push({
      z: -innerZ - r * Math.sin(theta),
      inset: r * (1 - Math.cos(theta)),
      nr: Math.cos(theta),
      nz: -Math.sin(theta),
    });
  }
  for (let b = 0; b <= bevelSegs; b++) {
    const theta = maxTheta * (b / bevelSegs);
    ringSpecs.push({
      z: innerZ + r * Math.sin(theta),
      inset: r * (1 - Math.cos(theta)),
      nr: Math.cos(theta),
      nz: Math.sin(theta),
    });
  }

  const ringCount = ringSpecs.length;
  const sideVertCount = ringCount * N;
  const capVertCount = (1 + N) * 2;
  const interleaved = new Float32Array((sideVertCount + capVertCount) * 6);
  let vOff = 0;

  const pushVert = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    interleaved[vOff++] = x;
    interleaved[vOff++] = y;
    interleaved[vOff++] = z;
    interleaved[vOff++] = nx;
    interleaved[vOff++] = ny;
    interleaved[vOff++] = nz;
  };

  for (let rIdx = 0; rIdx < ringCount; rIdx++) {
    const rs = ringSpecs[rIdx];
    for (let i = 0; i < N; i++) {
      const pt = contour[i];
      pushVert(
        pt.x - pt.nx * rs.inset,
        pt.y - pt.ny * rs.inset,
        rs.z,
        pt.nx * rs.nr,
        pt.ny * rs.nr,
        rs.nz,
      );
    }
  }

  const indicesList: number[] = [];
  for (let rIdx = 0; rIdx < ringCount - 1; rIdx++) {
    const baseA = rIdx * N;
    const baseB = (rIdx + 1) * N;
    for (let i = 0; i < N; i++) {
      const iNext = (i + 1) % N;
      const a = baseA + i;
      const b = baseA + iNext;
      const c = baseB + iNext;
      const d = baseB + i;
      indicesList.push(a, b, c, a, c, d);
    }
  }

  const frontRing = ringSpecs[ringCount - 1];
  const frontCenterIdx = sideVertCount;
  pushVert(0, 0, halfD, 0, 0, 1);
  for (let i = 0; i < N; i++) {
    const pt = contour[i];
    pushVert(pt.x - pt.nx * frontRing.inset, pt.y - pt.ny * frontRing.inset, frontRing.z, 0, 0, 1);
  }
  for (let i = 0; i < N; i++) {
    const iNext = (i + 1) % N;
    indicesList.push(frontCenterIdx, frontCenterIdx + 1 + i, frontCenterIdx + 1 + iNext);
  }

  const backRing = ringSpecs[0];
  const backCenterIdx = sideVertCount + 1 + N;
  pushVert(0, 0, -halfD, 0, 0, -1);
  for (let i = 0; i < N; i++) {
    const pt = contour[i];
    pushVert(pt.x - pt.nx * backRing.inset, pt.y - pt.ny * backRing.inset, backRing.z, 0, 0, -1);
  }
  for (let i = 0; i < N; i++) {
    const iNext = (i + 1) % N;
    indicesList.push(backCenterIdx, backCenterIdx + 1 + iNext, backCenterIdx + 1 + i);
  }

  const geometry = new THREE.BufferGeometry();
  const buffer = new THREE.InterleavedBuffer(interleaved, 6);
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  geometry.setAttribute('normal', new THREE.InterleavedBufferAttribute(buffer, 3, 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indicesList), 1));
  geometry.computeBoundingSphere();

  const inRadius = R * 0.5;
  const planes = [
    new THREE.Vector4(SQRT3 * 0.5, 0.5, 0, inRadius), // Right face
    new THREE.Vector4(-SQRT3 * 0.5, 0.5, 0, inRadius), // Left face
    new THREE.Vector4(0, -1, 0, inRadius), // Base face
    new THREE.Vector4(0, 0, 1, halfD), // Front cap
    new THREE.Vector4(0, 0, -1, halfD), // Back cap
  ];

  return { geometry, depth, planes };
}

const STUDIO_ENV_GLSL = /* glsl */ `
  vec3 srgbToLinear(vec3 c) {
    return pow(max(c, vec3(0.0)), vec3(2.2));
  }

  vec3 linearToSrgb(vec3 c) {
    return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
  }

  float rectPanel(vec3 dir, vec3 centerDir, vec2 halfSize, float feather) {
    vec3 fwd = normalize(centerDir);
    vec3 refUp = abs(fwd.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 right = normalize(cross(refUp, fwd));
    vec3 up = cross(fwd, right);
    float d = dot(dir, fwd);
    if (d <= 0.001) return 0.0;
    vec2 proj = vec2(dot(dir, right), dot(dir, up)) / d;
    vec2 dist = abs(proj) - halfSize;
    float edge = max(dist.x, dist.y);
    return 1.0 - smoothstep(-feather, feather, edge);
  }

  vec3 sampleStudioEnv(vec3 dir) {
    vec3 d = normalize(dir);
    // Deep studio dark room with subtle floor bounce and dark back wall
    float backMask = smoothstep(0.15, -0.75, d.z);
    float floorMask = smoothstep(0.05, -0.78, d.y);
    vec3 c = mix(vec3(0.018, 0.019, 0.022), vec3(0.007, 0.007, 0.009), backMask);
    c = mix(c, vec3(0.042, 0.044, 0.049), floorMask * 0.72);

    // Back-left soft wall panel
    float p1 = rectPanel(d, vec3(-0.82, 0.08, 0.57), vec2(1.35, 1.1) * 0.5, 0.22);
    c += vec3(0.82, 0.85, 0.90) * (0.045 * p1);

    // Soft bottom-front warm fill (catches lower crystal base & bottom bevel)
    float p2 = rectPanel(d, vec3(0.0, -0.707, 0.707), vec2(0.45, 0.68) * 0.5, 0.18);
    c += vec3(1.0, 0.97, 0.92) * (0.42 * p2);

    // Cool crisp key strip (catches diagonal crystal faces & sharp bevel edges)
    float p3 = rectPanel(d, vec3(0.612, 0.354, 0.707), vec2(0.55, 0.22) * 0.5, 0.045);
    c += vec3(0.82, 0.91, 1.0) * (20.0 * p3);

    // Secondary crisp opposite rim strip for RTL mirrored crystal bevel gleam
    float p4 = rectPanel(d, vec3(-0.62, 0.38, 0.68), vec2(0.48, 0.18) * 0.5, 0.05);
    c += vec3(0.85, 0.91, 1.0) * (9.5 * p4);

    // Overhead narrow specular strip for apex edge definition
    float p5 = rectPanel(d, vec3(0.0, 0.88, 0.46), vec2(0.7, 0.14) * 0.5, 0.06);
    c += vec3(0.92, 0.95, 1.0) * (3.2 * p5);

    // Analytic soft studio tone curve (vgpu dark crystal response)
    c = c / (1.0 + c);
    vec3 lifted = pow(max(c, vec3(0.0)), vec3(1.0 / 1.45));
    return lifted * 2.3;
  }

  float fresnelSchlick(float cosTheta, float f0) {
    return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  void marchToPlane(
    vec3 ro,
    vec3 rd,
    vec4 planes[5],
    int skipIdx,
    out float outT,
    out vec3 outNormal,
    out int outIdx
  ) {
    outT = 1e9;
    outNormal = vec3(0.0, 0.0, 1.0);
    outIdx = -1;
    for (int i = 0; i < 5; i++) {
      if (i == skipIdx) continue;
      vec3 pn = planes[i].xyz;
      float denom = dot(rd, pn);
      if (denom > 1e-5) {
        float t = (planes[i].w - dot(ro, pn)) / denom;
        if (t > 1e-3 && t < outT) {
          outT = t;
          outNormal = pn;
          outIdx = i;
        }
      }
    }
  }
`;

const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BG_BLEND_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uLightTex;
  uniform vec3 uBgSrgb;
  varying vec2 vUv;

  vec3 srgbToLinear(vec3 c) {
    return pow(max(c, vec3(0.0)), vec3(2.2));
  }

  void main() {
    vec4 light = texture2D(uLightTex, vUv);
    // Boost luminous screen blend so spectral bloom matches vivid P3 glow
    vec3 lightAdd = clamp(light.rgb * light.a * 1.12, 0.0, 1.0);
    vec3 screened = 1.0 - (1.0 - uBgSrgb) * (1.0 - lightAdd);
    gl_FragColor = vec4(srgbToLinear(screened), 1.0);
  }
`;

const COPY_SRGB_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uSourceTex;
  varying vec2 vUv;

  void main() {
    vec3 lin = texture2D(uSourceTex, vUv).rgb;
    vec3 srgb = pow(max(lin, vec3(0.0)), vec3(1.0 / 2.2));
    gl_FragColor = vec4(srgb, 1.0);
  }
`;

const GLASS_VERT = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GLASS_BACK_FRAG = /* glsl */ `
  precision highp float;
  uniform vec4 uPlanes[5];
  uniform float uIor;
  uniform float uF0;
  uniform float uReflection;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  ${STUDIO_ENV_GLSL}

  void main() {
    vec3 I = normalize(vWorldPos - cameraPosition);
    vec3 Nout = normalize(vWorldNormal);
    vec3 Nin = -Nout;

    int hitPlane = -1;
    float bestAlign = -2.0;
    for (int i = 0; i < 5; i++) {
      float al = dot(Nout, uPlanes[i].xyz);
      if (al > bestAlign) {
        bestAlign = al;
        hitPlane = i;
      }
    }

    float cosI = clamp(dot(-I, Nin), 0.0, 1.0);
    vec3 refr = refract(I, Nin, uIor);
    bool isTir = length(refr) < 0.001;
    float weight = isTir ? 1.0 : fresnelSchlick(cosI, uF0);

    // Follow inner-face reflection up to 3 bounces inside the glass crystal
    vec3 ro = vWorldPos;
    vec3 rd = reflect(I, Nin);
    int skip = hitPlane;
    vec3 envColor = vec3(0.0);

    for (int b = 0; b < 3; b++) {
      float tHit;
      vec3 pn;
      int idx;
      marchToPlane(ro, rd, uPlanes, skip, tHit, pn, idx);
      if (idx < 0) {
        envColor = sampleStudioEnv(rd);
        break;
      }
      vec3 pHit = ro + rd * tHit;
      vec3 innerN = -pn;
      vec3 exitDir = refract(rd, innerN, uIor);
      if (length(exitDir) > 0.001) {
        float cExit = clamp(dot(-rd, innerN), 0.0, 1.0);
        float fExit = fresnelSchlick(cExit, uF0);
        envColor = sampleStudioEnv(exitDir) * (1.0 - fExit);
        break;
      }
      ro = pHit;
      rd = reflect(rd, innerN);
      skip = idx;
    }

    // Add crisp internal edge catchlight on grazing back-wall bevels
    float edgeSheen = pow(1.0 - cosI, 3.0) * 0.22;
    vec3 outCol = (envColor * uReflection + vec3(edgeSheen)) * weight;
    gl_FragColor = vec4(outCol, weight * 0.88);
  }
`;

const GLASS_FRONT_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uBgTex;
  uniform mat4 uViewProj;
  uniform vec4 uPlanes[5];
  uniform float uIor;
  uniform float uF0;
  uniform float uReflection;
  uniform vec3 uAbsorption;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  ${STUDIO_ENV_GLSL}

  vec3 softShoulder(vec3 x) {
    vec3 hi = 0.82 + 0.18 * tanh((x - 0.82) / 0.18);
    return vec3(
      x.r > 0.82 ? hi.r : x.r,
      x.g > 0.82 ? hi.g : x.g,
      x.b > 0.82 ? hi.b : x.b
    );
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 I = -V;
    vec3 N = normalize(vWorldNormal);

    float facing = clamp(dot(V, N), 0.0, 1.0);
    float F = fresnelSchlick(facing, uF0);

    vec3 reflDir = reflect(I, N);
    vec3 envRefl = sampleStudioEnv(reflDir);
    vec3 reflected = envRefl * uReflection;

    int entryPlane = -1;
    float bestAlign = -2.0;
    for (int i = 0; i < 5; i++) {
      float al = dot(N, uPlanes[i].xyz);
      if (al > bestAlign) {
        bestAlign = al;
        entryPlane = i;
      }
    }

    vec3 refrDir = refract(I, N, 1.0 / uIor);
    float dist;
    vec3 exitN;
    int exitIdx;
    marchToPlane(vWorldPos, refrDir, uPlanes, entryPlane, dist, exitN, exitIdx);

    vec3 exitPos = exitIdx >= 0 ? (vWorldPos + refrDir * dist) : (vWorldPos + refrDir * 40.0);
    float pathDist = exitIdx >= 0 ? dist : 40.0;

    vec4 clip = uViewProj * vec4(exitPos, 1.0);
    vec2 uv = clamp((clip.xy / max(clip.w, 1e-4)) * 0.5 + 0.5, vec2(0.001), vec2(0.999));

    vec3 transmitted = texture2D(uBgTex, uv).rgb * exp(-uAbsorption * pathDist * 0.82);

    float lum = dot(envRefl, vec3(0.2126, 0.7152, 0.0722));
    float panelHl =
      smoothstep(0.45, 0.82, lum) *
      clamp(uReflection * 0.42, 0.0, 0.75) *
      (0.65 + 0.35 * pow(1.0 - facing, 1.5));

    // Subtle crisp glass bevel rim glint on slanted chamfer edges
    float bevelMask = 1.0 - smoothstep(0.55, 0.96, abs(N.z));
    float bevelRim = bevelMask * pow(1.0 - facing, 2.1) * 0.42;

    vec3 col = transmitted * (1.0 - F) + reflected * F + envRefl * panelHl + vec3(0.88, 0.92, 0.98) * bevelRim;
    col = softShoulder(max(col, vec3(0.0)));
    gl_FragColor = vec4(linearToSrgb(col), 1.0);
  }
`;

export interface PrismEngineOptions {
  glCanvas: HTMLCanvasElement;
  fxCanvas: HTMLCanvasElement;
  stageEl: HTMLElement;
  getCopyBottom: () => number;
  isRtl?: boolean;
}

export function mountPrismEngine(opts: PrismEngineOptions): () => void {
  const { glCanvas, fxCanvas, stageEl, getCopyBottom, isRtl = true } = opts;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fxCtx = fxCanvas.getContext('2d');
  if (!fxCtx) return () => {};

  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');
  if (!offCtx) return () => {};

  const filterSupported = (() => {
    try {
      fxCtx.filter = 'blur(2px)';
      const ok = fxCtx.filter === 'blur(2px)';
      fxCtx.filter = 'none';
      return ok;
    } catch {
      return false;
    }
  })();

  const blurBufs = filterSupported
    ? []
    : [16, 6, 2].map(() => {
        const c = document.createElement('canvas');
        return { canvas: c, ctx: c.getContext('2d')! };
      });

  let webgl2Available = false;
  let isSoftwareGl = false;
  try {
    const probe = document.createElement('canvas').getContext('webgl2');
    if (probe) {
      webgl2Available = true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param) || '');
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    }
  } catch {
    webgl2Available = false;
  }

  let layout: LayoutMetrics = computeLayout();
  const motes = createDustMotes();

  // Start in the exact iconic horizontal-rainbow-fan pose (matches frames 00:00 & 00:02)
  const aim = { curX: 0.44, curY: 0.52, tgtX: 0.44, tgtY: 0.52 };
  const orbit = { curX: 0, curY: 0, tgtX: 0, tgtY: 0 };
  let lastPointerMoveTime = performance.now() - 8000;
  let pointerInside = false;

  let renderer: THREE.WebGLRenderer | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let lightTex: THREE.CanvasTexture | null = null;
  let rt: THREE.WebGLRenderTarget | null = null;

  let bgScene: THREE.Scene | null = null;
  let bgMat: THREE.ShaderMaterial | null = null;
  let copyScene: THREE.Scene | null = null;
  let copyMat: THREE.ShaderMaterial | null = null;
  let orthoCam: THREE.OrthographicCamera | null = null;

  let backScene: THREE.Scene | null = null;
  let backMat: THREE.ShaderMaterial | null = null;
  let backMesh: THREE.Mesh | null = null;

  let frontScene: THREE.Scene | null = null;
  let frontMat: THREE.ShaderMaterial | null = null;
  let frontMesh: THREE.Mesh | null = null;
  let prismGeo: THREE.BufferGeometry | null = null;

  const viewProjMat = new THREE.Matrix4();
  const tmpVec3 = new THREE.Vector3();

  if (webgl2Available) {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;

      fxCanvas.style.display = 'none';
      glCanvas.style.display = 'block';

      camera = new THREE.PerspectiveCamera(48, 1, 1, 20000);
      orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      lightTex = new THREE.CanvasTexture(fxCanvas);
      lightTex.minFilter = THREE.LinearFilter;
      lightTex.magFilter = THREE.LinearFilter;
      lightTex.generateMipmaps = false;

      const quadGeo = new THREE.PlaneGeometry(2, 2);
      bgMat = new THREE.ShaderMaterial({
        uniforms: {
          uLightTex: { value: lightTex },
          uBgSrgb: { value: new THREE.Vector3(21 / 255, 21 / 255, 23 / 255) },
        },
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: BG_BLEND_FRAG,
        depthTest: false,
        depthWrite: false,
      });
      bgScene = new THREE.Scene();
      bgScene.add(new THREE.Mesh(quadGeo, bgMat));

      copyMat = new THREE.ShaderMaterial({
        uniforms: { uSourceTex: { value: null } },
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: COPY_SRGB_FRAG,
        depthTest: false,
        depthWrite: false,
      });
      copyScene = new THREE.Scene();
      copyScene.add(new THREE.Mesh(quadGeo, copyMat));

      const initialPrism = createPrismGeometry(layout.S);
      prismGeo = initialPrism.geometry;

      backMat = new THREE.ShaderMaterial({
        uniforms: {
          uPlanes: { value: initialPrism.planes },
          uIor: { value: GLASS_IOR },
          uF0: { value: GLASS_F0 },
          uReflection: { value: REFLECTION_STRENGTH },
        },
        vertexShader: GLASS_VERT,
        fragmentShader: GLASS_BACK_FRAG,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: true,
        depthWrite: true,
      });
      backMesh = new THREE.Mesh(prismGeo, backMat);
      backScene = new THREE.Scene();
      backScene.add(backMesh);

      frontMat = new THREE.ShaderMaterial({
        uniforms: {
          uBgTex: { value: null },
          uViewProj: { value: viewProjMat },
          uPlanes: { value: initialPrism.planes },
          uIor: { value: GLASS_IOR },
          uF0: { value: GLASS_F0 },
          uReflection: { value: REFLECTION_STRENGTH },
          uAbsorption: {
            value: new THREE.Vector3(
              (1.0 * 0.57) / layout.S,
              (1.0 * 0.57) / layout.S,
              (0.54 * 0.57) / layout.S,
            ),
          },
        },
        vertexShader: GLASS_VERT,
        fragmentShader: GLASS_FRONT_FRAG,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
      });
      frontMesh = new THREE.Mesh(prismGeo, frontMat);
      frontScene = new THREE.Scene();
      frontScene.add(frontMesh);
    } catch {
      renderer = null;
      glCanvas.style.display = 'none';
      fxCanvas.style.display = 'block';
    }
  } else {
    glCanvas.style.display = 'none';
    fxCanvas.style.display = 'block';
  }

  function computeLayout(): LayoutMetrics {
    const rect = stageEl.getBoundingClientRect();
    const W = Math.max(320, Math.round(rect.width || window.innerWidth));
    const H = Math.max(480, Math.round(rect.height || window.innerHeight));
    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const mobile = W < 820;
    const fxDpr = mobile ? Math.min(dpr, 1.5) : dpr;

    let S: number;
    let cx: number;
    let cy: number;

    if (!mobile) {
      S = Math.min(W * 0.37, H * 0.64);
      cx = isRtl ? 0.34 * W : 0.66 * W;
      cy = 0.54 * H;
    } else {
      S = Math.min(W * 0.72, H * 0.4, 400);
      const copyBottom = getCopyBottom();
      cx = W * 0.5;
      cy = Math.max(copyBottom + 30 + S * 0.62, (copyBottom + 30 + H) * 0.5);
    }

    const R = S / SQRT3;
    const top: Vec2 = { x: cx, y: cy - R };
    const right: Vec2 = { x: cx + S * 0.5, y: cy + R * 0.5 };
    const left: Vec2 = { x: cx - S * 0.5, y: cy + R * 0.5 };

    const normals: [Vec2, Vec2, Vec2] = [
      { x: SQRT3 * 0.5, y: -0.5 },
      { x: 0, y: 1 },
      { x: -SQRT3 * 0.5, y: -0.5 },
    ];

    return {
      W,
      H,
      dpr,
      fxDpr,
      mobile,
      S,
      R,
      cx,
      cy,
      verts: [top, right, left],
      normals,
      edges: [
        [top, right],
        [right, left],
        [left, top],
      ],
      diag: Math.hypot(W, H),
    };
  }

  function applyResize() {
    layout = computeLayout();
    const fxW = Math.max(1, Math.round(layout.W * layout.fxDpr));
    const fxH = Math.max(1, Math.round(layout.H * layout.fxDpr));

    fxCanvas.width = fxW;
    fxCanvas.height = fxH;
    offCanvas.width = fxW;
    offCanvas.height = fxH;

    if (!filterSupported && blurBufs.length === 3) {
      const scales = [16, 6, 2];
      scales.forEach((div, idx) => {
        blurBufs[idx].canvas.width = Math.max(1, Math.round(fxW / div));
        blurBufs[idx].canvas.height = Math.max(1, Math.round(fxH / div));
      });
    }

    if (renderer && camera && backMesh && frontMesh && backMat && frontMat && copyMat) {
      renderer.setPixelRatio(layout.dpr);
      renderer.setSize(layout.W, layout.H, false);

      const rtW = Math.max(1, Math.round(layout.W * layout.dpr));
      const rtH = Math.max(1, Math.round(layout.H * layout.dpr));
      if (rt) rt.dispose();
      rt = new THREE.WebGLRenderTarget(rtW, rtH, {
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false,
      });
      copyMat.uniforms.uSourceTex.value = rt.texture;
      frontMat.uniforms.uBgTex.value = rt.texture;

      if (prismGeo) prismGeo.dispose();
      const rebuilt = createPrismGeometry(layout.S);
      prismGeo = rebuilt.geometry;
      backMesh.geometry = prismGeo;
      frontMesh.geometry = prismGeo;
      backMat.uniforms.uPlanes.value = rebuilt.planes;
      frontMat.uniforms.uPlanes.value = rebuilt.planes;
      frontMat.uniforms.uAbsorption.value.set(
        (1.0 * 0.57) / layout.S,
        (1.0 * 0.57) / layout.S,
        (0.54 * 0.57) / layout.S,
      );

      camera.aspect = layout.W / layout.H;
      camera.setViewOffset(
        layout.W,
        layout.H,
        layout.W * 0.5 - layout.cx,
        layout.H * 0.5 - layout.cy,
        layout.W,
        layout.H,
      );
      camera.updateProjectionMatrix();
    }
  }

  function updateCamera() {
    if (!camera) return;
    const dist = (layout.H * 0.5) / Math.tan(THREE.MathUtils.degToRad(24));
    const maxAngle = THREE.MathUtils.degToRad(3.8);
    const yaw = layout.mobile ? 0 : orbit.curX * maxAngle;
    const pitch = layout.mobile ? 0 : -orbit.curY * maxAngle;

    const cosP = Math.cos(pitch);
    camera.position.set(
      dist * Math.sin(yaw) * cosP,
      dist * Math.sin(pitch),
      dist * Math.cos(yaw) * cosP,
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    viewProjMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  }

  function projectPlanePoint(pt: Vec2): Vec2 {
    if (!camera || !renderer) return pt;
    tmpVec3.set(pt.x - layout.cx, layout.cy - pt.y, 0);
    tmpVec3.applyMatrix4(viewProjMat);
    return {
      x: (tmpVec3.x * 0.5 + 0.5) * layout.W,
      y: (-tmpVec3.y * 0.5 + 0.5) * layout.H,
    };
  }

  function getLamp(aimY: number, aimX: number): {
    source: Vec2;
    entry: Vec2;
    dir: Vec2;
    entryEdge: number;
  } {
    // Incidence angle from pointer height y in [0,1]: -35° (top -> base TIR!) -> 60° (mid -> wide rainbow) -> 75° (bottom)
    const yClamped = Math.max(0, Math.min(1, aimY));
    const deg =
      yClamped < 0.5
        ? -35 + (yClamped / 0.5) * (60 - -35)
        : 60 + ((yClamped - 0.5) / 0.5) * (75 - 60);
    const rad = (deg * Math.PI) / 180;

    // On RTL desktop: beam enters from the LEFT face (edge 2) and fans right behind the Arabic Ruq'ah copy.
    // On mobile / LTR: beam enters from the RIGHT face (edge 0) and fans left.
    const fromLeft = isRtl && !layout.mobile;
    const entryEdge = fromLeft ? 2 : 0;
    const outN = layout.normals[entryEdge];
    const inN: Vec2 = { x: -outN.x, y: -outN.y };

    const rot = fromLeft ? -rad : rad;
    const cosA = Math.cos(rot);
    const sinA = Math.sin(rot);
    const dir: Vec2 = {
      x: inN.x * cosA - inN.y * sinA,
      y: inN.x * sinA + inN.y * cosA,
    };

    const [ea, eb] = layout.edges[entryEdge];
    const tEntry = 0.08 + Math.max(0, Math.min(1, aimX)) * (0.92 - 0.08);
    const entry: Vec2 = fromLeft
      ? { x: eb.x + (ea.x - eb.x) * tEntry, y: eb.y + (ea.y - eb.y) * tEntry }
      : { x: ea.x + (eb.x - ea.x) * tEntry, y: ea.y + (eb.y - ea.y) * tEntry };

    const far = layout.diag * 1.5;
    const source: Vec2 = {
      x: entry.x - dir.x * far,
      y: entry.y - dir.y * far,
    };
    return { source, entry, dir, entryEdge };
  }

  function drawLight(nowSec: number) {
    const scale = layout.fxDpr;
    const ctx = offCtx!;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, layout.W, layout.H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const lamp = getLamp(aim.curY, aim.curX);
    const farDist = layout.diag * 1.5;
    const mobileScale = layout.mobile ? 0.8 : 1;

    const groups = new Map<string, (RaySegment | null)[]>();
    const edgeHits: { edge: number; pos: Vec2; energy: number }[] = [];

    const recordSeg = (key: string, wIdx: number, seg: RaySegment) => {
      let arr = groups.get(key);
      if (!arr) {
        arr = new Array<RaySegment | null>(WAVELENGTH_COUNT).fill(null);
        groups.set(key, arr);
      }
      arr[wIdx] = seg;
    };

    for (let w = 0; w < WAVELENGTH_COUNT; w++) {
      const sample = SPECTRUM[w];

      const traceRay = (
        origin: Vec2,
        dir: Vec2,
        inside: boolean,
        energy: number,
        depth: number,
        pathKey: string,
        lastEdge: number,
      ) => {
        if (depth > 7) return;

        let bestT = Infinity;
        let bestEdge = -1;
        let bestPt: Vec2 | null = null;

        for (let e = 0; e < 3; e++) {
          if (e === lastEdge) continue;
          const hit = intersectRaySegment(origin, dir, layout.edges[e][0], layout.edges[e][1]);
          if (hit && hit.t < bestT) {
            bestT = hit.t;
            bestEdge = e;
            bestPt = hit.point;
          }
        }

        if (!bestPt || bestEdge < 0) {
          if (!inside) {
            const p1: Vec2 = { x: origin.x + dir.x * farDist, y: origin.y + dir.y * farDist };
            recordSeg(pathKey, w, { p0: origin, p1, energy, inside: false, outgoing: true });
          }
          return;
        }

        if (depth > 0) {
          recordSeg(pathKey, w, {
            p0: origin,
            p1: bestPt,
            energy,
            inside,
            outgoing: false,
          });
        }

        if (w === Math.floor(WAVELENGTH_COUNT * 0.5) && energy > 0.14) {
          edgeHits.push({ edge: bestEdge, pos: bestPt, energy });
        }

        const outN = layout.normals[bestEdge];
        const hitN: Vec2 = inside ? { x: -outN.x, y: -outN.y } : outN;
        const n1 = inside ? sample.n : 1.0;
        const n2 = inside ? 1.0 : sample.n;
        const cosI = Math.max(0, Math.min(1, -dot2(dir, hitN)));
        const F = fresnelUnpolarized(cosI, n1, n2);
        const refr = refract2D(dir, hitN, n1 / n2);
        const refl = reflect2D(dir, hitN);

        if (refr) {
          const tEnergy = energy * (1 - F);
          if (tEnergy > 0.08) {
            traceRay(bestPt, refr, !inside, tEnergy, depth + 1, `${pathKey}T${bestEdge}`, bestEdge);
          }
          const rEnergy = energy * F;
          if (rEnergy > 0.12) {
            traceRay(bestPt, refl, inside, rEnergy, depth + 1, `${pathKey}R${bestEdge}`, bestEdge);
          }
        } else {
          if (energy > 0.12) {
            traceRay(bestPt, refl, inside, energy, depth + 1, `${pathKey}R${bestEdge}`, bestEdge);
          }
        }
      };

      traceRay(lamp.source, lamp.dir, false, 1.0, 0, '', -1);
    }

    // 1. Incoming luminous white beam (wide halo + crisp white core)
    const pSrc = projectPlanePoint(lamp.source);
    const pEnt = projectPlanePoint(lamp.entry);
    ctx.strokeStyle = 'rgba(255,255,255,0.36)';
    ctx.lineWidth = 14 * mobileScale;
    ctx.beginPath();
    ctx.moveTo(pSrc.x, pSrc.y);
    ctx.lineTo(pEnt.x, pEnt.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,1.0)';
    ctx.lineWidth = 5 * mobileScale;
    ctx.beginPath();
    ctx.moveTo(pSrc.x, pSrc.y);
    ctx.lineTo(pEnt.x, pEnt.y);
    ctx.stroke();

    // 2. 70 drifting twinkling dust motes along incoming beam
    const bdx = pEnt.x - pSrc.x;
    const bdy = pEnt.y - pSrc.y;
    const bLen = Math.hypot(bdx, bdy) || 1;
    const perpX = -bdy / bLen;
    const perpY = bdx / bLen;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const prog = reducedMotion ? m.t : (m.t + nowSec * m.speed) % 1;
      const beamFrac = 0.52 + prog * 0.48;
      const distFromPrism = 1 - beamFrac;
      const width = (7 + distFromPrism * 82) * mobileScale;
      const mx = pSrc.x + bdx * beamFrac + perpX * m.spread * width;
      const my = pSrc.y + bdy * beamFrac + perpY * m.spread * width;
      if (mx < -10 || mx > layout.W + 10 || my < -10 || my > layout.H + 10) continue;
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(nowSec * m.freq + m.phase));
      ctx.fillStyle = `rgba(255,255,255,${(twinkle * 0.78).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(mx, my, m.radius * mobileScale, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Vivid spectral dispersion bands + luminous white-balanced cores
    groups.forEach((arr) => {
      for (let w = 0; w < WAVELENGTH_COUNT - 1; w++) {
        const s0 = arr[w];
        const s1 = arr[w + 1];
        if (!s0 || !s1) continue;

        const a0 = projectPlanePoint(s0.p0);
        const a1 = projectPlanePoint(s0.p1);
        const b1 = projectPlanePoint(s1.p1);
        const b0 = projectPlanePoint(s1.p0);

        const [vr, vg, vb] = SPECTRUM[w].vivid;
        const avgE = (s0.energy + s1.energy) * 0.5;
        const baseAlpha = Math.min(1, avgE * (s0.inside ? 0.68 : 0.96));

        if (s0.outgoing) {
          const mx0 = (a0.x + b0.x) * 0.5;
          const my0 = (a0.y + b0.y) * 0.5;
          const mx1 = (a1.x + b1.x) * 0.5;
          const my1 = (a1.y + b1.y) * 0.5;
          const grad = ctx.createLinearGradient(mx0, my0, mx1, my1);
          grad.addColorStop(0, `rgba(${vr},${vg},${vb},${baseAlpha.toFixed(3)})`);
          grad.addColorStop(0.32, `rgba(${vr},${vg},${vb},${(baseAlpha * 0.88).toFixed(3)})`);
          grad.addColorStop(0.72, `rgba(${vr},${vg},${vb},${(baseAlpha * 0.42).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${vr},${vg},${vb},0)`);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = `rgba(${vr},${vg},${vb},${baseAlpha.toFixed(3)})`;
        }

        ctx.beginPath();
        ctx.moveTo(a0.x, a0.y);
        ctx.lineTo(a1.x, a1.y);
        ctx.lineTo(b1.x, b1.y);
        ctx.lineTo(b0.x, b0.y);
        ctx.closePath();
        ctx.fill();
      }

      for (let w = 0; w < WAVELENGTH_COUNT; w++) {
        const seg = arr[w];
        if (!seg) continue;
        const p0 = projectPlanePoint(seg.p0);
        const p1 = projectPlanePoint(seg.p1);
        const sp = SPECTRUM[w];
        const alpha = Math.min(1, sp.weight * seg.energy * 2.65);
        const [cr, cg, cb] = sp.core;
        ctx.lineWidth = (seg.inside ? 4.8 : 4.0) * mobileScale;

        if (seg.outgoing) {
          const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`);
          grad.addColorStop(0.38, `rgba(${cr},${cg},${cb},${(alpha * 0.72).toFixed(3)})`);
          grad.addColorStop(0.75, `rgba(${cr},${cg},${cb},${(alpha * 0.24).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.strokeStyle = grad;
        } else {
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    });

    // 4. Edge glints where beam crosses prism faces
    const glintRadius = 0.22 * layout.S;
    for (let i = 0; i < edgeHits.length; i++) {
      const h = edgeHits[i];
      const [ea, eb] = layout.edges[h.edge];
      const pa = projectPlanePoint(ea);
      const pb = projectPlanePoint(eb);
      const ph = projectPlanePoint(h.pos);

      const rg = ctx.createRadialGradient(ph.x, ph.y, 0, ph.x, ph.y, glintRadius);
      const a = Math.min(1, h.energy * 0.95);
      rg.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
      rg.addColorStop(0.45, `rgba(255,255,255,${(a * 0.34).toFixed(3)})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.strokeStyle = rg;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(ph.x, ph.y, 3.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Soft 3-pass bloom composite into #fx (no unblurred pass)
    const dst = fxCtx!;
    dst.setTransform(1, 0, 0, 1, 0, 0);
    dst.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    dst.globalCompositeOperation = 'lighter';

    if (filterSupported) {
      const passes: [number, number][] = [
        [36 * scale, 0.72],
        [12.5 * scale, 0.96],
        [2.6 * scale, 1.0],
      ];
      for (const [blurPx, alpha] of passes) {
        dst.save();
        dst.globalAlpha = alpha;
        dst.filter = `blur(${blurPx.toFixed(1)}px)`;
        dst.drawImage(offCanvas, 0, 0);
        dst.restore();
      }
      dst.filter = 'none';
    } else {
      const alphas = [0.72, 0.96, 1.0];
      blurBufs.forEach((b, idx) => {
        b.ctx.clearRect(0, 0, b.canvas.width, b.canvas.height);
        b.ctx.drawImage(offCanvas, 0, 0, b.canvas.width, b.canvas.height);
        dst.save();
        dst.globalAlpha = alphas[idx];
        dst.drawImage(b.canvas, 0, 0, fxCanvas.width, fxCanvas.height);
        dst.restore();
      });
    }

    // 2D fallback outline if WebGL2 isn't active
    if (!renderer) {
      dst.save();
      dst.setTransform(scale, 0, 0, scale, 0, 0);
      dst.globalCompositeOperation = 'source-over';
      dst.strokeStyle = 'rgba(255,255,255,0.28)';
      dst.lineWidth = 1.8;
      dst.beginPath();
      dst.moveTo(layout.verts[0].x, layout.verts[0].y);
      dst.lineTo(layout.verts[1].x, layout.verts[1].y);
      dst.lineTo(layout.verts[2].x, layout.verts[2].y);
      dst.closePath();
      dst.stroke();
      dst.restore();
    }
  }

  function renderWebGL() {
    if (
      !renderer ||
      !camera ||
      !rt ||
      !orthoCam ||
      !lightTex ||
      !bgScene ||
      !backScene ||
      !copyScene ||
      !frontScene
    ) {
      return;
    }

    lightTex.needsUpdate = true;

    // 1. HalfFloat RT: screen-blend page bg #151517 with soft light canvas (stored linear)
    renderer.setRenderTarget(rt);
    renderer.clear(true, true, false);
    renderer.render(bgScene, orthoCam);

    // 2. Back faces into RT (depth-tested premultiplied internal crystal bounces)
    renderer.clearDepth();
    renderer.render(backScene, camera);

    // 3. Copy RT to screen (linear -> sRGB)
    renderer.setRenderTarget(null);
    renderer.clear(true, true, false);
    renderer.render(copyScene, orthoCam);

    // 4. Front faces to screen (refraction + Fresnel + studio highlight + bevel rim + soft shoulder)
    renderer.clearDepth();
    renderer.render(frontScene, camera);
  }

  function handlePointer(clientX: number, clientY: number) {
    const rect = stageEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    aim.tgtY = y;
    aim.tgtX = isRtl ? 1 - x : x;
    orbit.tgtX = x * 2 - 1;
    orbit.tgtY = y * 2 - 1;
    lastPointerMoveTime = performance.now();
    pointerInside = true;
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    handlePointer(e.clientX, e.clientY);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    handlePointer(e.clientX, e.clientY);
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onWindowLeave = () => {
    pointerInside = false;
    orbit.tgtX = 0;
    orbit.tgtY = 0;
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('mouseleave', onWindowLeave);

  let resizeTimer: number | null = null;
  const onResize = () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      applyResize();
    }, 60);
  };
  window.addEventListener('resize', onResize, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!disposed) applyResize();
    });
  }

  applyResize();

  let disposed = false;
  let rafId = 0;
  let timerId = 0;
  let prevTime = performance.now();

  function afterDraw(cb: () => void) {
    if (!renderer) {
      timerId = window.setTimeout(cb, 80);
      return;
    }
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 80);
        }
      };
      timerId = window.setTimeout(poll, 5);
    } else {
      timerId = window.setTimeout(cb, 80);
    }
  }

  function tick() {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;

    // Idle or mobile virtual pointer circles smoothly (period 16s, radius 0.36)
    // so the user immediately sees the full rainbow sweep + TIR base bounce like the reference video
    const isIdle = now - lastPointerMoveTime > 4500;
    if (!reducedMotion && (layout.mobile || isIdle)) {
      const ang = (now / 1000) * ((Math.PI * 2) / 16);
      aim.tgtX = 0.5 + Math.cos(ang) * 0.34;
      aim.tgtY = 0.48 + Math.sin(ang) * 0.42;
      if (!pointerInside || layout.mobile) {
        orbit.tgtX = layout.mobile ? 0 : Math.cos(ang) * 0.42;
        orbit.tgtY = layout.mobile ? 0 : Math.sin(ang) * 0.38;
      }
    }

    const frames = dt * 60;
    const kLamp = 1 - Math.pow(1 - 0.12, frames);
    const kCam = 1 - Math.pow(1 - 0.08, frames);

    aim.curX += (aim.tgtX - aim.curX) * kLamp;
    aim.curY += (aim.tgtY - aim.curY) * kLamp;
    orbit.curX += (orbit.tgtX - orbit.curX) * kCam;
    orbit.curY += (orbit.tgtY - orbit.curY) * kCam;

    updateCamera();
    drawLight(now / 1000);
    renderWebGL();

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    window.clearTimeout(timerId);
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('mouseleave', onWindowLeave);
    window.removeEventListener('resize', onResize);

    if (prismGeo) prismGeo.dispose();
    if (bgMat) bgMat.dispose();
    if (copyMat) copyMat.dispose();
    if (backMat) backMat.dispose();
    if (frontMat) frontMat.dispose();
    if (lightTex) lightTex.dispose();
    if (rt) rt.dispose();
    if (renderer) renderer.dispose();
  };
}
