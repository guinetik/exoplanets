import{j as o,r as n,b as l}from"./index-agfWtMau.js";import{C as m,a as f}from"./react-three-fiber.esm-5J2Felbe.js";const u=`
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,v=`
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
      sum += noise(p) * amp;
      p *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 nPos = normalize(vPosition);
    float longitude = atan(nPos.x, nPos.z) + uTime * 0.15;
    float latitude = asin(nPos.y);
    vec2 uv = vec2(longitude / 3.14159, latitude / 1.5708 + 0.5);

    // Ocean base
    vec3 oceanColor = vec3(0.02, 0.08, 0.15);

    // Land generation
    float landNoise = fbm(uv * 8.0);
    float landMask = smoothstep(0.45, 0.55, landNoise);

    vec3 landLow = vec3(0.08, 0.25, 0.05);
    vec3 landHigh = vec3(0.3, 0.2, 0.1);
    vec3 landColor = mix(landLow, landHigh, fbm(uv * 16.0));

    // Ice caps
    float iceMask = smoothstep(0.7, 0.9, abs(nPos.y));
    vec3 iceColor = vec3(0.9, 0.95, 1.0);

    // Clouds
    float cloudNoise = fbm(uv * 6.0 + uTime * 0.03);
    float cloudMask = smoothstep(0.5, 0.7, cloudNoise);

    // Combine
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);
    surfaceColor = mix(surfaceColor, iceColor, iceMask);
    surfaceColor = mix(surfaceColor, vec3(1.0), cloudMask * 0.5);

    // Lighting
    vec3 lightDir = normalize(vec3(0.5, 0.3, 1.0));
    float light = max(0.0, dot(vNormal, lightDir));
    float ambient = 0.1;

    // Atmosphere rim
    float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    vec3 rimGlow = vec3(0.3, 0.6, 1.0) * pow(rim, 3.0) * 0.4;

    vec3 finalColor = surfaceColor * (light + ambient) + rimGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;function h(){const a=n.useRef(null),r=n.useMemo(()=>({uTime:{value:0}}),[]);return f(e=>{r.uTime.value=e.clock.elapsedTime,a.current&&(a.current.rotation.y+=.001)}),o.jsxs("group",{position:[0,0,-3],children:[o.jsxs("mesh",{ref:a,children:[o.jsx("sphereGeometry",{args:[2,64,64]}),o.jsx("shaderMaterial",{vertexShader:u,fragmentShader:v,uniforms:r})]}),o.jsxs("mesh",{scale:[1.08,1.08,1.08],children:[o.jsx("sphereGeometry",{args:[2,32,32]}),o.jsx("meshBasicMaterial",{color:"#4488ff",transparent:!0,opacity:.15,side:l})]}),o.jsxs("mesh",{scale:[1.2,1.2,1.2],children:[o.jsx("sphereGeometry",{args:[2,32,32]}),o.jsx("meshBasicMaterial",{color:"#0066ff",transparent:!0,opacity:.05,side:l})]})]})}function d(){const a=n.useMemo(()=>{const e=new Float32Array(1500);for(let t=0;t<500;t++){const c=Math.random()*Math.PI*2,i=Math.acos(2*Math.random()-1),s=50;e[t*3]=s*Math.sin(i)*Math.cos(c),e[t*3+1]=s*Math.sin(i)*Math.sin(c),e[t*3+2]=s*Math.cos(i)}return e},[]);return o.jsxs("points",{children:[o.jsx("bufferGeometry",{children:o.jsx("bufferAttribute",{attach:"attributes-position",count:500,array:a,itemSize:3})}),o.jsx("pointsMaterial",{size:1.5,color:"#ffffff",transparent:!0,opacity:.6,sizeAttenuation:!1})]})}function g(){return o.jsx("div",{className:"tour-hero-canvas",children:o.jsxs(m,{camera:{fov:45,near:.1,far:100,position:[0,0,5]},gl:{antialias:!0,alpha:!0},children:[o.jsx("ambientLight",{intensity:.2}),o.jsx(d,{}),o.jsx(h,{})]})})}export{g as default};
