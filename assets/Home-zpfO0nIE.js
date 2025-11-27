import{r as n,j as e,s as D,u as K,a as Q,b as H,n as ee}from"./index-DFXkWtwF.js";import{u as q,C as te,V as G,B as R,a as _,A as se,b as ae,c as X,d as oe}from"./react-three-fiber.esm-D45o6kR3.js";import{s as ne,m as re,g as ie,f as ce,a as le,b as ue,c as de,L as Y}from"./astronomy-CUSq6E6z.js";const me=500,$=20,he=40;function fe(){const c=document.createElement("canvas");c.width=128,c.height=128;const t=c.getContext("2d"),s=128/2;t.clearRect(0,0,128,128);const o=t.createRadialGradient(s,s,0,s,s,s);o.addColorStop(0,"rgba(255, 255, 255, 1)"),o.addColorStop(.1,"rgba(255, 255, 255, 0.8)"),o.addColorStop(.3,"rgba(255, 255, 255, 0.3)"),o.addColorStop(.5,"rgba(255, 255, 255, 0.1)"),o.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=o,t.fillRect(0,0,128,128),t.save(),t.translate(s,s);for(let u=0;u<4;u++){t.rotate(Math.PI/2);const i=t.createLinearGradient(0,0,0,-s);i.addColorStop(0,"rgba(255, 255, 255, 0.8)"),i.addColorStop(.3,"rgba(255, 255, 255, 0.3)"),i.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=i,t.beginPath(),t.moveTo(-2,0),t.lineTo(0,-s*.9),t.lineTo(2,0),t.closePath(),t.fill()}t.restore();const d=t.createRadialGradient(s,s,0,s,s,128*.15);d.addColorStop(0,"rgba(255, 255, 255, 1)"),d.addColorStop(.5,"rgba(255, 255, 255, 0.8)"),d.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=d,t.fillRect(0,0,128,128);const m=new ae(c);return m.needsUpdate=!0,m}function pe(a){let c=0;for(let t=0;t<a.length;t++){const s=a.charCodeAt(t);c=(c<<5)-c+s,c=c&c}return Math.abs(c)}const ge=`
  attribute vec3 starColor;
  attribute float starSize;
  attribute float twinkleSpeed;
  attribute float twinklePhase;
  attribute float twinkleIntensity;
  attribute float isHovered;

  uniform float uTime;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = starColor;

    // Subtle twinkle - very gentle brightness variation
    float twinkle = sin(uTime * twinkleSpeed * 0.3 + twinklePhase);
    float twinkleScale = 1.0 + twinkle * twinkleIntensity * 0.15;

    // Stable opacity - minimal twinkle effect
    float baseOpacity = isHovered > 0.5 ? 1.0 : 0.95;
    vOpacity = baseOpacity;

    // Calculate final size - interpolate between base and hover scale
    float baseScale = starSize * ${$.toFixed(1)};
    float hoverScale = ${he.toFixed(1)};
    float targetScale = mix(baseScale, hoverScale, isHovered);
    float finalSize = targetScale * twinkleScale;

    // Position
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation - scale by distance from camera
    // Using higher multiplier to match original sprite sizes
    gl_PointSize = finalSize * (1500.0 / -mvPosition.z);
  }
`,xe=`
  uniform sampler2D uTexture;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vOpacity);
  }
`;function ve({stars:a,observer:c,date:t,onStarClick:s,onStarHover:o}){const d=n.useRef(null),m=n.useRef(null),u=n.useRef(null),[i,v]=n.useState(-1),p=n.useRef(null),{gl:g,camera:S}=q(),j=n.useMemo(()=>fe(),[]),l=n.useMemo(()=>{const r=[];for(const h of a){if(h.ra===null||h.dec===null)continue;const x=ne(h.ra,h.dec,c,t,me);if(!x.visible)continue;const w=pe(h.hostname);r.push({star:h,position:new G(x.x,x.y,x.z),color:new te(ie(h.star_class)),size:re(h.sy_vmag),twinkleSpeed:.5+w%100/50,twinklePhase:w%1e3/1e3*Math.PI*2,twinkleIntensity:.15+w%50/200})}return r},[a,c,t]),f=n.useMemo(()=>{const r=l.length,h=new Float32Array(r*3),x=new Float32Array(r*3),w=new Float32Array(r),k=new Float32Array(r),T=new Float32Array(r),z=new Float32Array(r),P=new Float32Array(r);return l.forEach((E,y)=>{h[y*3]=E.position.x,h[y*3+1]=E.position.y,h[y*3+2]=E.position.z,x[y*3]=E.color.r,x[y*3+1]=E.color.g,x[y*3+2]=E.color.b,w[y]=E.size,k[y]=E.twinkleSpeed,T[y]=E.twinklePhase,z[y]=E.twinkleIntensity,P[y]=0}),{positions:h,colors:x,sizes:w,twinkleSpeeds:k,twinklePhases:T,twinkleIntensities:z,isHovered:P}},[l]),b=n.useRef(null);n.useEffect(()=>{if(!u.current)return;const r=u.current;r.setAttribute("position",new R(f.positions,3)),r.setAttribute("starColor",new R(f.colors,3)),r.setAttribute("starSize",new R(f.sizes,1)),r.setAttribute("twinkleSpeed",new R(f.twinkleSpeeds,1)),r.setAttribute("twinklePhase",new R(f.twinklePhases,1)),r.setAttribute("twinkleIntensity",new R(f.twinkleIntensities,1));const h=new R(f.isHovered,1);r.setAttribute("isHovered",h),b.current=h,r.computeBoundingSphere()},[f]),_(r=>{if(m.current&&(m.current.uniforms.uTime.value=r.clock.elapsedTime),b.current){const h=b.current.array;let x=!1;for(let w=0;w<h.length;w++){const T=(w===i?1:0)-h[w];Math.abs(T)>.001&&(h[w]+=T*.15,x=!0)}x&&(b.current.needsUpdate=!0)}});const M=n.useCallback(r=>{if(l.length===0)return;const h=g.domElement.getBoundingClientRect(),x=r.clientX-h.left,w=r.clientY-h.top;let k=-1,T=1/0;const z=15;for(let P=0;P<l.length;P++){const E=l[P],y=E.position.clone().project(S);if(y.z>1)continue;const C=(y.x+1)/2*h.width,A=(1-y.y)/2*h.height,V=x-C,U=w-A,O=Math.sqrt(V*V+U*U),J=z+E.size*$*.3;O<J&&O<T&&(k=P,T=O)}k!==i?(v(k),k>=0?(g.domElement.style.cursor="pointer",o==null||o(l[k].star,{x:r.clientX,y:r.clientY})):(g.domElement.style.cursor="grab",o==null||o(null))):k>=0&&(o==null||o(l[k].star,{x:r.clientX,y:r.clientY}))},[l,i,g,S,o]),I=n.useCallback(r=>{p.current={x:r.clientX,y:r.clientY}},[]),N=n.useCallback(r=>{if(p.current){const h=r.clientX-p.current.x,x=r.clientY-p.current.y;if(Math.sqrt(h*h+x*x)>5)return}i>=0&&l[i]&&(s==null||s(l[i].star))},[i,l,s]),L=n.useCallback(()=>{v(-1),g.domElement.style.cursor="grab",o==null||o(null)},[g,o]);return n.useEffect(()=>{const r=g.domElement;return r.addEventListener("pointerdown",I),r.addEventListener("pointermove",M),r.addEventListener("click",N),r.addEventListener("pointerleave",L),()=>{r.removeEventListener("pointerdown",I),r.removeEventListener("pointermove",M),r.removeEventListener("click",N),r.removeEventListener("pointerleave",L)}},[g,I,M,N,L]),n.useEffect(()=>()=>{j.dispose()},[j]),l.length===0?null:e.jsxs("points",{ref:d,frustumCulled:!1,children:[e.jsx("bufferGeometry",{ref:u}),e.jsx("shaderMaterial",{ref:m,vertexShader:ge,fragmentShader:xe,uniforms:{uTime:{value:0},uTexture:{value:j}},transparent:!0,depthWrite:!1,blending:se})]})}function ye({longitude:a=0}){const[c,t]=n.useState(!1),[s,o]=n.useState(null),d=n.useRef(0),m=n.useRef(0),u=n.useMemo(()=>({uRotation:{value:0}}),[]);return n.useEffect(()=>{const i=()=>{try{D.isLoaded()?(o({surfaceVert:D.get("earthSurfaceVert"),surfaceFrag:D.get("earthSurfaceFrag"),atmosphereVert:D.get("atmosphereVert"),atmosphereFrag:D.get("atmosphereFrag")}),t(!0)):setTimeout(i,100)}catch(v){console.warn("Earth shaders not available, using fallback:",v),t(!0)}};i()},[]),n.useEffect(()=>{d.current=-a*Math.PI/180},[a]),_(()=>{const i=d.current-m.current;m.current+=i*.05,u.uRotation.value=m.current}),!c||!s?e.jsx("group",{children:e.jsxs("mesh",{position:[0,-600,0],children:[e.jsx("sphereGeometry",{args:[580,64,32]}),e.jsx("meshBasicMaterial",{color:8432354})]})}):e.jsxs("group",{children:[e.jsxs("mesh",{position:[0,-600,0],children:[e.jsx("sphereGeometry",{args:[580,64,64]}),e.jsx("shaderMaterial",{vertexShader:s.surfaceVert,fragmentShader:s.surfaceFrag,uniforms:u})]}),e.jsxs("mesh",{position:[0,-600,0],scale:[1.02,1.02,1.02],children:[e.jsx("sphereGeometry",{args:[580,64,64]}),e.jsx("shaderMaterial",{vertexShader:s.atmosphereVert,fragmentShader:s.atmosphereFrag,transparent:!0,side:X,depthWrite:!1})]})]})}const W=5e3,Se=12e3,be=3,we=20,Ce=.8,F=80,je=15,B=[{name:"ISS",color:"#ffffff",size:1,panels:!0},{name:"Satellite",color:"#aaaaaa",size:.6,panels:!0},{name:"Debris",color:"#666666",size:.3,panels:!1}];function Me({satellite:a,onExpired:c}){const t=n.useRef(null),s=n.useRef(a.createdAt);_(d=>{if(!t.current)return;const m=d.clock.elapsedTime-s.current;if(m>we){c(a.id);return}const u=m*a.speed,i=a.startPosition.clone().add(a.direction.clone().multiplyScalar(u));t.current.position.copy(i),t.current.rotation.x+=.01,t.current.rotation.y+=.02});const o=Ce*a.type.size;return e.jsxs("group",{ref:t,position:a.startPosition,children:[e.jsxs("mesh",{children:[e.jsx("boxGeometry",{args:[o,o*.5,o*.5]}),e.jsx("meshBasicMaterial",{color:a.type.color})]}),a.type.panels&&e.jsxs(e.Fragment,{children:[e.jsxs("mesh",{position:[o*.8,0,0],children:[e.jsx("boxGeometry",{args:[o*.8,o*.05,o*.4]}),e.jsx("meshBasicMaterial",{color:"#1a3a5c"})]}),e.jsxs("mesh",{position:[-o*.8,0,0],children:[e.jsx("boxGeometry",{args:[o*.8,o*.05,o*.4]}),e.jsx("meshBasicMaterial",{color:"#1a3a5c"})]})]})]})}function Ee(){const[a,c]=n.useState([]),t=n.useRef(0),s=n.useRef(null);_(d=>{s.current||(s.current=d.clock)}),n.useEffect(()=>{const d=()=>{s.current&&c(i=>{var L;if(i.length>=be)return i;const v=Math.random()>.5,p=v?-F:F,g=10+Math.random()*40,S=-F*(.3+Math.random()*.7),j=v?1:-1,l=(Math.random()-.5)*.3,f=(Math.random()-.5)*.5,b=new G(j,l,f).normalize(),M=Math.random(),I=M<.15?B[0]:M<.7?B[1]:B[2],N={id:t.current++,type:I,startPosition:new G(p,g,S),direction:b,speed:je*(.8+Math.random()*.4),createdAt:((L=s.current)==null?void 0:L.elapsedTime)??0,altitude:F};return[...i,N]})},m=()=>{const i=W+Math.random()*(Se-W);return setTimeout(()=>{d(),u=m()},i)};let u=setTimeout(()=>{d(),u=m()},3e3);return()=>clearTimeout(u)},[]);const o=d=>{c(m=>m.filter(u=>u.id!==d))};return e.jsx("group",{children:a.map(d=>e.jsx(Me,{satellite:d,onExpired:o},d.id))})}function Z(a){return a<.5?4*a*a*a:1-Math.pow(-2*a+2,3)/2}function Ae(a){const t=2.5949095;return a<.5?Math.pow(2*a,2)*((t+1)*2*a-t)/2:(Math.pow(2*a-2,2)*((t+1)*(a*2-2)+t)+2)/2}const ke=`
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Te=`
  uniform float uTime;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Simple noise function
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
    // Convert position to spherical coordinates for texture mapping
    vec3 nPos = normalize(vPosition);
    float longitude = atan(nPos.x, nPos.z) + uTime * 0.1;
    float latitude = asin(nPos.y);
    vec2 uv = vec2(longitude / 3.14159, latitude / 1.5708 + 0.5);

    // Ocean base color
    vec3 oceanColor = vec3(0.02, 0.08, 0.15);
    vec3 oceanHighlight = vec3(0.05, 0.15, 0.3);

    // Land generation using noise
    float landNoise = fbm(uv * 8.0);
    float landMask = smoothstep(0.45, 0.55, landNoise);

    // Land colors
    vec3 landLow = vec3(0.08, 0.25, 0.05); // Green lowlands
    vec3 landHigh = vec3(0.3, 0.2, 0.1);   // Brown highlands
    vec3 landColor = mix(landLow, landHigh, fbm(uv * 16.0));

    // Ice caps at poles
    float iceMask = smoothstep(0.7, 0.9, abs(nPos.y));
    vec3 iceColor = vec3(0.9, 0.95, 1.0);

    // Clouds
    float cloudNoise = fbm(uv * 6.0 + uTime * 0.05);
    float cloudMask = smoothstep(0.5, 0.7, cloudNoise);
    vec3 cloudColor = vec3(1.0, 1.0, 1.0);

    // Combine layers
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);
    surfaceColor = mix(surfaceColor, iceColor, iceMask);
    surfaceColor = mix(surfaceColor, cloudColor, cloudMask * 0.7);

    // Simple lighting from camera direction
    vec3 lightDir = normalize(vec3(0.5, 0.3, 1.0));
    float light = max(0.0, dot(vNormal, lightDir));
    float ambient = 0.15;

    // Atmosphere rim lighting
    float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
    vec3 rimGlow = atmosphereColor * pow(rim, 3.0) * 0.5;

    vec3 finalColor = surfaceColor * (light + ambient) + rimGlow;

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;function Le({progress:a}){const c=n.useRef(null),t=n.useMemo(()=>({uTime:{value:0},uOpacity:{value:1}}),[]);if(_((m,u)=>{c.current&&(c.current.rotation.y+=u*.15),t.uTime.value=m.clock.elapsedTime}),a>=1)return null;const s=580,o=.35*(1-a),d=-600-a*500;return e.jsxs("group",{ref:c,position:[0,0,d],scale:[o,o,o],children:[e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[s,64,64]}),e.jsx("shaderMaterial",{vertexShader:ke,fragmentShader:Te,uniforms:t,transparent:!0})]}),e.jsxs("mesh",{scale:[1.05,1.05,1.05],children:[e.jsx("sphereGeometry",{args:[s,32,32]}),e.jsx("meshBasicMaterial",{color:4491519,transparent:!0,opacity:.15,side:X})]}),e.jsxs("mesh",{scale:[1.12,1.12,1.12],children:[e.jsx("sphereGeometry",{args:[s,32,32]}),e.jsx("meshBasicMaterial",{color:6728447,transparent:!0,opacity:.08,side:X})]})]})}function Pe({introState:a,onBearingChange:c,controlsEnabled:t}){const{camera:s,gl:o}=q(),d=n.useRef(!1),m=n.useRef({x:0,y:0}),u=n.useRef({azimuth:180,altitude:10});return _(()=>{const{phase:i}=a;if(i==="earth-spin"||i==="camera-swoop")s.position.set(0,0,0),s.lookAt(0,0,-100),s.updateProjectionMatrix();else if((i==="stars-fade"||i==="complete")&&!t){s.position.set(0,0,0);const v=u.current.azimuth*Math.PI/180,p=u.current.altitude*Math.PI/180;s.lookAt(-Math.sin(v)*Math.cos(p)*100,Math.sin(p)*100,-Math.cos(v)*Math.cos(p)*100),s.updateProjectionMatrix()}}),n.useEffect(()=>{if(!t)return;const i=o.domElement,v=()=>{const{azimuth:l,altitude:f}=u.current,b=l*Math.PI/180,M=f*Math.PI/180;s.position.set(0,0,0),s.lookAt(-Math.sin(b)*Math.cos(M)*100,Math.sin(M)*100,-Math.cos(b)*Math.cos(M)*100),s.updateProjectionMatrix(),c(l,f)},p=l=>{d.current=!0,m.current={x:l.clientX,y:l.clientY},i.style.cursor="grabbing"},g=()=>{d.current=!1,i.style.cursor="grab"},S=l=>{if(!d.current)return;const f=l.clientX-m.current.x,b=l.clientY-m.current.y;u.current.azimuth-=f*.3,u.current.altitude+=b*.3,u.current.azimuth=(u.current.azimuth%360+360)%360,u.current.altitude=Math.max(-10,Math.min(90,u.current.altitude)),m.current={x:l.clientX,y:l.clientY},v()},j=()=>{d.current=!1,i.style.cursor="grab"};return i.style.cursor="grab",i.addEventListener("mousedown",p),i.addEventListener("mouseup",g),i.addEventListener("mousemove",S),i.addEventListener("mouseleave",j),v(),()=>{i.removeEventListener("mousedown",p),i.removeEventListener("mouseup",g),i.removeEventListener("mousemove",S),i.removeEventListener("mouseleave",j)}},[o,s,t,c]),null}function Ne({opacity:a}){const t=n.useMemo(()=>{const s=new Float32Array(9e3);for(let o=0;o<3e3;o++){const d=Math.random()*Math.PI*2,m=Math.acos(2*Math.random()-1),u=800;s[o*3]=u*Math.sin(m)*Math.cos(d),s[o*3+1]=u*Math.sin(m)*Math.sin(d),s[o*3+2]=u*Math.cos(m)}return s},[]);return e.jsxs("points",{children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{attach:"attributes-position",count:3e3,array:t,itemSize:3})}),e.jsx("pointsMaterial",{size:.8,color:8947848,transparent:!0,opacity:a*.5,sizeAttenuation:!1})]})}function Ie(){const[a,c]=n.useState({phase:"earth-spin",progress:0}),t=n.useRef(Date.now()),s=5e3,o=2500,d=2e3,m=n.useCallback(()=>{c({phase:"complete",progress:1})},[]);n.useEffect(()=>{let p;const g=()=>{const S=Date.now(),j=S-t.current;c(l=>{if(l.phase==="complete")return l;if(l.phase==="earth-spin"){const f=Math.min(j/s,1);return f>=1?(t.current=S,{phase:"camera-swoop",progress:0}):{...l,progress:f}}if(l.phase==="camera-swoop"){const f=Math.min(j/o,1);return f>=1?(t.current=S,{phase:"stars-fade",progress:0}):{...l,progress:f}}if(l.phase==="stars-fade"){const f=Math.min(j/d,1);return f>=1?{phase:"complete",progress:1}:{...l,progress:f}}return l}),a.phase!=="complete"&&(p=requestAnimationFrame(g))};return p=requestAnimationFrame(g),()=>cancelAnimationFrame(p)},[a.phase]);const u=a.phase==="stars-fade"?Z(a.progress):a.phase==="complete"?1:0,i=a.phase==="camera-swoop"?Ae(a.progress):a.phase==="stars-fade"||a.phase==="complete"?1:0,v=a.phase==="complete";return{state:a,introEarthExitProgress:i,starsOpacity:u,controlsEnabled:v,skipIntro:m}}function Re(a){const[c,t]=n.useState(a),[s,o]=n.useState(a),[d,m]=n.useState(!1),u=n.useRef(Date.now()),i=n.useRef(a),v=2e3;n.useEffect(()=>{if(!d)return;let g;const S=()=>{const j=Date.now()-u.current,l=Math.min(j/v,1),f=Z(l),b=i.current.latitude+(s.latitude-i.current.latitude)*f,M=i.current.longitude+(s.longitude-i.current.longitude)*f;t({latitude:b,longitude:M}),l<1?g=requestAnimationFrame(S):(m(!1),t(s))};return g=requestAnimationFrame(S),()=>cancelAnimationFrame(g)},[d,s]);const p=n.useCallback(g=>{i.current=c,u.current=Date.now(),o(g),m(!0)},[c]);return{currentLocation:c,changeLocation:p,isAnimating:d}}function ze({starCount:a,planetCount:c,onDismiss:t,isExiting:s}){const{t:o}=K();return e.jsx("div",{className:`welcome-card-container ${s?"exiting":""}`,children:e.jsxs("div",{className:"welcome-card",children:[e.jsx("h2",{className:"welcome-title",children:o("pages.home.infoCard.title")}),e.jsx("p",{className:"welcome-description",children:o("pages.home.infoCard.description")}),e.jsx("div",{className:"welcome-stats",children:o("pages.home.infoCard.stats",{starCount:a.toLocaleString(),planetCount:c.toLocaleString()})}),e.jsx("p",{className:"welcome-hint",children:o("pages.home.infoCard.hint")}),e.jsx("button",{className:"welcome-dismiss",onClick:t,children:o("pages.home.infoCard.dismiss")})]})})}function _e({stars:a,onStarClick:c}){const{currentLocation:t,changeLocation:s,isAnimating:o}=Re(Y["São Paulo"]),[d]=n.useState(()=>new Date),[m,u]=n.useState({azimuth:180,altitude:-10}),[i,v]=n.useState(!1),[p,g]=n.useState(null),[S,j]=n.useState(null),[l,f]=n.useState("São Paulo"),[b,M]=n.useState(!1),[I,N]=n.useState(!1),L=n.useRef(!1),{state:r,introEarthExitProgress:h,starsOpacity:x,controlsEnabled:w,skipIntro:k}=Ie();n.useEffect(()=>{if(r.phase==="complete"&&!L.current&&!b){const C=setTimeout(()=>{M(!0)},300);return()=>clearTimeout(C)}},[r.phase,b]);const T=n.useCallback(()=>{L.current=!0,N(!0),setTimeout(()=>{M(!1),N(!1)},300)},[]),z=n.useCallback((C,A)=>{u({azimuth:C,altitude:A})},[]),P=n.useCallback((C,A)=>{s(A),f(C),v(!1)},[s]),E=n.useCallback((C,A)=>{g(C),j(A??null)},[]),y=r.phase==="complete";return e.jsxs("div",{className:"starfield-container",children:[e.jsxs(oe,{camera:{fov:60,near:.1,far:2e3,position:[0,50,400]},gl:{antialias:!0,alpha:!1},style:{background:"#000"},children:[e.jsx("color",{attach:"background",args:["#000000"]}),e.jsx(Pe,{introState:r,onBearingChange:z,controlsEnabled:w}),e.jsx("ambientLight",{intensity:.3}),e.jsx(Le,{progress:h}),(r.phase==="stars-fade"||r.phase==="complete")&&e.jsxs(e.Fragment,{children:[e.jsx(Ne,{opacity:1}),e.jsx(ve,{stars:a,observer:t,date:d,onStarClick:c,onStarHover:E}),e.jsx(ye,{longitude:t.longitude}),r.phase==="complete"&&e.jsx(Ee,{})]})]}),(r.phase==="stars-fade"||r.phase==="complete")&&e.jsx("div",{className:"scene-fade-overlay",style:{opacity:1-x,pointerEvents:x>=1?"none":"auto"}}),y&&e.jsxs("div",{className:"starfield-bearing",children:[e.jsx("div",{className:"bearing-title",children:"Telescope Bearing"}),e.jsxs("div",{className:"bearing-value",children:[e.jsx("span",{className:"bearing-icon",children:"↔"})," ",ce(m.azimuth)]}),e.jsxs("div",{className:"bearing-value",children:[e.jsx("span",{className:"bearing-icon",children:"↕"})," ",le(m.altitude)]})]}),p&&S&&y&&e.jsxs("div",{className:"starfield-tooltip",style:{left:S.x+20,top:S.y-10},children:[e.jsx("div",{className:"tooltip-name",children:p.hostname}),e.jsxs("div",{className:"tooltip-info",children:[p.sy_pnum," planet",p.sy_pnum!==1?"s":"",p.distance_ly&&e.jsxs(e.Fragment,{children:[" · ",p.distance_ly.toFixed(1)," ly"]})]}),e.jsx("div",{className:"tooltip-hint",children:"Click to explore"})]}),y&&e.jsxs("div",{className:"starfield-location",children:[o?e.jsxs("span",{className:"location-coords location-animating",children:["Traveling to ",l,"..."]}):e.jsxs("span",{className:"location-coords",children:[l," · ",ue(t.latitude),","," ",de(t.longitude)]}),e.jsx("button",{className:"location-button",onClick:()=>v(!i),disabled:o,children:"CHANGE LOCATION"}),i&&!o&&e.jsx("div",{className:"location-picker",children:Object.entries(Y).map(([C,A])=>e.jsx("button",{className:"location-option",onClick:()=>P(C,A),children:C},C))})]}),y&&e.jsx("div",{className:"starfield-info",children:e.jsxs("span",{children:[a.length.toLocaleString()," exoplanet host stars"]})}),r.phase!=="complete"&&e.jsxs("div",{className:"intro-overlay",onClick:k,children:[r.phase==="earth-spin"&&e.jsx("div",{className:"intro-text",children:e.jsx("span",{className:"intro-title",children:"EXOPLANETS".split("").map((C,A)=>e.jsx("span",{className:"intro-letter",style:{animationDelay:`${A*.3}s`},children:C},A))})}),(r.phase==="camera-swoop"||r.phase==="stars-fade")&&e.jsx("div",{className:"intro-text",style:{opacity:r.phase==="stars-fade"?1-x:1},children:e.jsx("span",{className:"intro-subtitle",children:"Explore the cosmos"})}),r.phase!=="stars-fade"&&e.jsx("div",{className:"intro-skip",children:"Click anywhere to skip"})]}),b&&e.jsx(ze,{starCount:a.length,planetCount:a.reduce((C,A)=>C+(A.sy_pnum||0),0),onDismiss:T,isExiting:I})]})}function Be(){const{getAllStars:a}=Q(),c=H(),t=a(),s=n.useCallback(o=>{c(`/stars/${ee(o.hostname)}`)},[c]);return e.jsx(_e,{stars:t,onStarClick:s})}export{Be as default};
