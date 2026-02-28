uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uEmissiveIntensity;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vPattern;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(-vViewPosition);
  
  // Fresnel
  float fresnel = pow(1.0 - abs(dot(viewDir, normal)), uFresnelPower);
  
  // Mix colors
  vec3 color = mix(uColorPrimary, uColorSecondary, vPattern * 0.5 + 0.5);
  color = mix(color, uColorSecondary, fresnel);
  
  // Emissive glow centered on fresnel/pattern
  vec3 emissive = uColorSecondary * uEmissiveIntensity * (fresnel + vPattern * 0.2);

  gl_FragColor = vec4(color + emissive, 1.0);
}
