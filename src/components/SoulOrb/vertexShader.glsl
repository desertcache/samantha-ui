uniform float uTime;
uniform float uAmplitude;
uniform float uNoiseFrequency;
uniform float uNoiseAmplitude;
uniform float uShapeMorph; // 0.0 = Blob, 1.0 = Liquid Silk

varying vec3 vNormal;
varying vec3 vPosition;
varying float vPattern;
varying vec3 vViewPosition;

// 
// Description : Array and textureless GLSL 2D/3D/4D simplex 
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
// 7*7*6 = 294, which is close to 343 = 7*7*7
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }

void main() {
  vNormal = normalMatrix * normal;
  vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

  // Pattern for fragment shader
  float noise = snoise(position * uNoiseFrequency + uTime * 0.2);
  vPattern = noise;

  // --- 1. EXISTING BLOB LOGIC (Thinking/Idle) ---
  float baseDisplacement = noise * uNoiseAmplitude;

  // Amplitude-driven displacement for Blob
  float speechNoise1 = snoise(position * 3.0 + uTime * 6.0);
  float speechNoise2 = snoise(position * 1.5 + uTime * 4.0);
  float speechNoise3 = snoise(position * 5.0 + uTime * 8.0);
  float speechNoise4 = snoise(position * 0.8 + uTime * 2.0);

  float blobSpeechDisplacement = uAmplitude * 1.1 * (
    speechNoise1 * 0.35 +
    speechNoise2 * 0.25 +
    speechNoise3 * 0.15 +
    speechNoise4 * 0.25
  );
  
  float totalBlobDisplacement = baseDisplacement + blobSpeechDisplacement;

  // --- 2. NEW LIQUID SILK LOGIC (Speaking) ---
  // Domain warping for fluid look
  vec3 warp = position + vec3(sin(uTime), cos(uTime), 0.0) * 0.5;
  float flow = snoise(warp * 1.5);
  float ripples = sin(position.y * 10.0 + uTime * 5.0 + flow * 2.0);
  
  // Silk displacement: Flow (base) + Ripples (amplitude reactive)
  
  // High-pass filter on the flow to get the "tips" or outward edges
  float tips = smoothstep(0.0, 0.8, flow); // 0 to 1, isolating the peaks
  
  // Reactivity: Push the tips out based on amplitude
  // Base flow (0.1) + Dynamic Tips expansion
  // We reduce the 'ripples' influence and focus on the 'flow' peaks
  float silkDisplacement = (flow * 0.1) + (uAmplitude * tips * 0.3) + (uAmplitude * ripples * 0.02);
  // Note: Tips get 0.3 scaling, basic ripples kept very subtle (0.02) for texture

  // --- 3. BLEND ---
  // Mix between Blob and Silk based on uShapeMorph (0.0 = Blob, 1.0 = Silk)
  float finalDisplacement = mix(totalBlobDisplacement, silkDisplacement, uShapeMorph);

  vec3 newPosition = position + normal * finalDisplacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
