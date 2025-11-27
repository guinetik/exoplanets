import{r as o,j as e,s as D,u as K,a as Q,b as H,n as ee}from"./index-UIUtINQF.js";import{u as q,C as te,V as G,B as I,a as _,A as se,b as ae,c as X,d as ne}from"./react-three-fiber.esm-ojhMyjz4.js";import{s as oe,m as re,g as ie,f as ce,a as le,b as ue,c as de,L as U}from"./astronomy-CUSq6E6z.js";const me=500,$=20,he=40;function fe(){const l=document.createElement("canvas");l.width=128,l.height=128;const t=l.getContext("2d"),s=128/2;t.clearRect(0,0,128,128);const n=t.createRadialGradient(s,s,0,s,s,s);n.addColorStop(0,"rgba(255, 255, 255, 1)"),n.addColorStop(.1,"rgba(255, 255, 255, 0.8)"),n.addColorStop(.3,"rgba(255, 255, 255, 0.3)"),n.addColorStop(.5,"rgba(255, 255, 255, 0.1)"),n.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=n,t.fillRect(0,0,128,128),t.save(),t.translate(s,s);for(let c=0;c<4;c++){t.rotate(Math.PI/2);const r=t.createLinearGradient(0,0,0,-s);r.addColorStop(0,"rgba(255, 255, 255, 0.8)"),r.addColorStop(.3,"rgba(255, 255, 255, 0.3)"),r.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=r,t.beginPath(),t.moveTo(-2,0),t.lineTo(0,-s*.9),t.lineTo(2,0),t.closePath(),t.fill()}t.restore();const u=t.createRadialGradient(s,s,0,s,s,128*.15);u.addColorStop(0,"rgba(255, 255, 255, 1)"),u.addColorStop(.5,"rgba(255, 255, 255, 0.8)"),u.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=u,t.fillRect(0,0,128,128);const d=new ae(l);return d.needsUpdate=!0,d}function pe(a){let l=0;for(let t=0;t<a.length;t++){const s=a.charCodeAt(t);l=(l<<5)-l+s,l=l&l}return Math.abs(l)}const ge=`
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
`,ve=`
  uniform sampler2D uTexture;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vOpacity);
  }
`;function xe({stars:a,observer:l,date:t,onStarClick:s,onStarHover:n}){const u=o.useRef(null),d=o.useRef(null),c=o.useRef(null),[r,x]=o.useState(-1),g=o.useRef(null),{gl:v,camera:w}=q(),E=o.useMemo(()=>fe(),[]),m=o.useMemo(()=>{const i=[];for(const h of a){if(h.ra===null||h.dec===null)continue;const y=oe(h.ra,h.dec,l,t,me);if(!y.visible)continue;const C=pe(h.hostname);i.push({star:h,position:new G(y.x,y.y,y.z),color:new te(ie(h.star_class)),size:re(h.sy_vmag),twinkleSpeed:.5+C%100/50,twinklePhase:C%1e3/1e3*Math.PI*2,twinkleIntensity:.15+C%50/200})}return i},[a,l,t]),p=o.useMemo(()=>{const i=m.length,h=new Float32Array(i*3),y=new Float32Array(i*3),C=new Float32Array(i),N=new Float32Array(i),P=new Float32Array(i),R=new Float32Array(i),z=new Float32Array(i);return m.forEach((L,b)=>{h[b*3]=L.position.x,h[b*3+1]=L.position.y,h[b*3+2]=L.position.z,y[b*3]=L.color.r,y[b*3+1]=L.color.g,y[b*3+2]=L.color.b,C[b]=L.size,N[b]=L.twinkleSpeed,P[b]=L.twinklePhase,R[b]=L.twinkleIntensity,z[b]=0}),{positions:h,colors:y,sizes:C,twinkleSpeeds:N,twinklePhases:P,twinkleIntensities:R,isHovered:z}},[m]),A=o.useRef(null);o.useEffect(()=>{if(!c.current)return;const i=c.current;i.setAttribute("position",new I(p.positions,3)),i.setAttribute("starColor",new I(p.colors,3)),i.setAttribute("starSize",new I(p.sizes,1)),i.setAttribute("twinkleSpeed",new I(p.twinkleSpeeds,1)),i.setAttribute("twinklePhase",new I(p.twinklePhases,1)),i.setAttribute("twinkleIntensity",new I(p.twinkleIntensities,1));const h=new I(p.isHovered,1);i.setAttribute("isHovered",h),A.current=h,i.computeBoundingSphere()},[p]),_(i=>{if(d.current&&(d.current.uniforms.uTime.value=i.clock.elapsedTime),A.current){const h=A.current.array;let y=!1;for(let C=0;C<h.length;C++){const P=(C===r?1:0)-h[C];Math.abs(P)>.001&&(h[C]+=P*.15,y=!0)}y&&(A.current.needsUpdate=!0)}});const f=o.useCallback(i=>{if(m.length===0)return;const h=v.domElement.getBoundingClientRect(),y=i.clientX-h.left,C=i.clientY-h.top;let N=-1,P=1/0;const R=15;for(let z=0;z<m.length;z++){const L=m[z],b=L.position.clone().project(w);if(b.z>1)continue;const j=(b.x+1)/2*h.width,M=(1-b.y)/2*h.height,Y=y-j,V=C-M,O=Math.sqrt(Y*Y+V*V),J=R+L.size*$*.3;O<J&&O<P&&(N=z,P=O)}N!==r?(x(N),N>=0?(v.domElement.style.cursor="pointer",n==null||n(m[N].star,{x:i.clientX,y:i.clientY})):(v.domElement.style.cursor="grab",n==null||n(null))):N>=0&&(n==null||n(m[N].star,{x:i.clientX,y:i.clientY}))},[m,r,v,w,n]),S=o.useCallback(i=>{g.current={x:i.clientX,y:i.clientY}},[]),T=o.useCallback(i=>{if(g.current){const h=i.clientX-g.current.x,y=i.clientY-g.current.y;if(Math.sqrt(h*h+y*y)>5)return}r>=0&&m[r]&&(s==null||s(m[r].star))},[r,m,s]),k=o.useCallback(()=>{x(-1),v.domElement.style.cursor="grab",n==null||n(null)},[v,n]);return o.useEffect(()=>{const i=v.domElement;return i.addEventListener("pointerdown",S),i.addEventListener("pointermove",f),i.addEventListener("click",T),i.addEventListener("pointerleave",k),()=>{i.removeEventListener("pointerdown",S),i.removeEventListener("pointermove",f),i.removeEventListener("click",T),i.removeEventListener("pointerleave",k)}},[v,S,f,T,k]),o.useEffect(()=>()=>{E.dispose()},[E]),m.length===0?null:e.jsxs("points",{ref:u,frustumCulled:!1,children:[e.jsx("bufferGeometry",{ref:c}),e.jsx("shaderMaterial",{ref:d,vertexShader:ge,fragmentShader:ve,uniforms:{uTime:{value:0},uTexture:{value:E}},transparent:!0,depthWrite:!1,blending:se})]})}function ye({longitude:a=0}){const[l,t]=o.useState(!1),[s,n]=o.useState(null),u=o.useRef(0),d=o.useRef(0),c=o.useMemo(()=>({uRotation:{value:0}}),[]);return o.useEffect(()=>{const r=()=>{try{D.isLoaded()?(n({surfaceVert:D.get("earthSurfaceVert"),surfaceFrag:D.get("earthSurfaceFrag"),atmosphereVert:D.get("atmosphereVert"),atmosphereFrag:D.get("atmosphereFrag")}),t(!0)):setTimeout(r,100)}catch(x){console.warn("Earth shaders not available, using fallback:",x),t(!0)}};r()},[]),o.useEffect(()=>{u.current=-a*Math.PI/180},[a]),_(()=>{const r=u.current-d.current;d.current+=r*.05,c.uRotation.value=d.current}),!l||!s?e.jsx("group",{children:e.jsxs("mesh",{position:[0,-600,0],children:[e.jsx("sphereGeometry",{args:[580,64,32]}),e.jsx("meshBasicMaterial",{color:8432354})]})}):e.jsxs("group",{children:[e.jsxs("mesh",{position:[0,-600,0],children:[e.jsx("sphereGeometry",{args:[580,64,64]}),e.jsx("shaderMaterial",{vertexShader:s.surfaceVert,fragmentShader:s.surfaceFrag,uniforms:c})]}),e.jsxs("mesh",{position:[0,-600,0],scale:[1.02,1.02,1.02],children:[e.jsx("sphereGeometry",{args:[580,64,64]}),e.jsx("shaderMaterial",{vertexShader:s.atmosphereVert,fragmentShader:s.atmosphereFrag,transparent:!0,side:X,depthWrite:!1})]})]})}const W=5e3,Se=12e3,be=3,je=20,we=.8,F=80,Ce=15,B=[{name:"ISS",color:"#ffffff",size:1,panels:!0},{name:"Satellite",color:"#aaaaaa",size:.6,panels:!0},{name:"Debris",color:"#666666",size:.3,panels:!1}];function Me({satellite:a,onExpired:l}){const t=o.useRef(null),s=o.useRef(a.createdAt);_(u=>{if(!t.current)return;const d=u.clock.elapsedTime-s.current;if(d>je){l(a.id);return}const c=d*a.speed,r=a.startPosition.clone().add(a.direction.clone().multiplyScalar(c));t.current.position.copy(r),t.current.rotation.x+=.01,t.current.rotation.y+=.02});const n=we*a.type.size;return e.jsxs("group",{ref:t,position:a.startPosition,children:[e.jsxs("mesh",{children:[e.jsx("boxGeometry",{args:[n,n*.5,n*.5]}),e.jsx("meshBasicMaterial",{color:a.type.color})]}),a.type.panels&&e.jsxs(e.Fragment,{children:[e.jsxs("mesh",{position:[n*.8,0,0],children:[e.jsx("boxGeometry",{args:[n*.8,n*.05,n*.4]}),e.jsx("meshBasicMaterial",{color:"#1a3a5c"})]}),e.jsxs("mesh",{position:[-n*.8,0,0],children:[e.jsx("boxGeometry",{args:[n*.8,n*.05,n*.4]}),e.jsx("meshBasicMaterial",{color:"#1a3a5c"})]})]})]})}function Ee(){const[a,l]=o.useState([]),t=o.useRef(0),s=o.useRef(null);_(u=>{s.current||(s.current=u.clock)}),o.useEffect(()=>{const u=()=>{s.current&&l(r=>{var k;if(r.length>=be)return r;const x=Math.random()>.5,g=x?-F:F,v=10+Math.random()*40,w=-F*(.3+Math.random()*.7),E=x?1:-1,m=(Math.random()-.5)*.3,p=(Math.random()-.5)*.5,A=new G(E,m,p).normalize(),f=Math.random(),S=f<.15?B[0]:f<.7?B[1]:B[2],T={id:t.current++,type:S,startPosition:new G(g,v,w),direction:A,speed:Ce*(.8+Math.random()*.4),createdAt:((k=s.current)==null?void 0:k.elapsedTime)??0,altitude:F};return[...r,T]})},d=()=>{const r=W+Math.random()*(Se-W);return setTimeout(()=>{u(),c=d()},r)};let c=setTimeout(()=>{u(),c=d()},3e3);return()=>clearTimeout(c)},[]);const n=u=>{l(d=>d.filter(c=>c.id!==u))};return e.jsx("group",{children:a.map(u=>e.jsx(Me,{satellite:u,onExpired:n},u.id))})}function Z(a){return a<.5?4*a*a*a:1-Math.pow(-2*a+2,3)/2}function Ae(a){const t=2.5949095;return a<.5?Math.pow(2*a,2)*((t+1)*2*a-t)/2:(Math.pow(2*a-2,2)*((t+1)*(a*2-2)+t)+2)/2}const Te=`
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,ke=`
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
`;function Le({progress:a}){const l=o.useRef(null),t=o.useMemo(()=>({uTime:{value:0},uOpacity:{value:1}}),[]);if(_((d,c)=>{l.current&&(l.current.rotation.y+=c*.15),t.uTime.value=d.clock.elapsedTime}),a>=1)return null;const s=580,n=.35*(1-a),u=-600-a*500;return e.jsxs("group",{ref:l,position:[0,0,u],scale:[n,n,n],children:[e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[s,64,64]}),e.jsx("shaderMaterial",{vertexShader:Te,fragmentShader:ke,uniforms:t,transparent:!0})]}),e.jsxs("mesh",{scale:[1.05,1.05,1.05],children:[e.jsx("sphereGeometry",{args:[s,32,32]}),e.jsx("meshBasicMaterial",{color:4491519,transparent:!0,opacity:.15,side:X})]}),e.jsxs("mesh",{scale:[1.12,1.12,1.12],children:[e.jsx("sphereGeometry",{args:[s,32,32]}),e.jsx("meshBasicMaterial",{color:6728447,transparent:!0,opacity:.08,side:X})]})]})}function Ne({introState:a,onBearingChange:l,controlsEnabled:t}){const{camera:s,gl:n}=q(),u=o.useRef(!1),d=o.useRef({x:0,y:0}),c=o.useRef({azimuth:180,altitude:10});return _(()=>{const{phase:r}=a;if(r==="earth-spin"||r==="camera-swoop")s.position.set(0,0,0),s.lookAt(0,0,-100),s.updateProjectionMatrix();else if((r==="stars-fade"||r==="complete")&&!t){s.position.set(0,0,0);const x=c.current.azimuth*Math.PI/180,g=c.current.altitude*Math.PI/180;s.lookAt(-Math.sin(x)*Math.cos(g)*100,Math.sin(g)*100,-Math.cos(x)*Math.cos(g)*100),s.updateProjectionMatrix()}}),o.useEffect(()=>{if(!t)return;const r=n.domElement,x=()=>{const{azimuth:f,altitude:S}=c.current,T=f*Math.PI/180,k=S*Math.PI/180;s.position.set(0,0,0),s.lookAt(-Math.sin(T)*Math.cos(k)*100,Math.sin(k)*100,-Math.cos(T)*Math.cos(k)*100),s.updateProjectionMatrix(),l(f,S)},g=f=>{u.current=!0,d.current={x:f.clientX,y:f.clientY},r.style.cursor="grabbing"},v=()=>{u.current=!1,r.style.cursor="grab"},w=f=>{if(!u.current)return;const S=f.clientX-d.current.x,T=f.clientY-d.current.y;c.current.azimuth-=S*.3,c.current.altitude+=T*.3,c.current.azimuth=(c.current.azimuth%360+360)%360,c.current.altitude=Math.max(-10,Math.min(90,c.current.altitude)),d.current={x:f.clientX,y:f.clientY},x()},E=()=>{u.current=!1,r.style.cursor="grab"},m=f=>{if(f.touches.length!==1)return;u.current=!0;const S=f.touches[0];d.current={x:S.clientX,y:S.clientY}},p=()=>{u.current=!1},A=f=>{if(!u.current||f.touches.length!==1)return;f.preventDefault();const S=f.touches[0],T=S.clientX-d.current.x,k=S.clientY-d.current.y;c.current.azimuth-=T*.3,c.current.altitude+=k*.3,c.current.azimuth=(c.current.azimuth%360+360)%360,c.current.altitude=Math.max(-10,Math.min(90,c.current.altitude)),d.current={x:S.clientX,y:S.clientY},x()};return r.style.cursor="grab",r.addEventListener("mousedown",g),r.addEventListener("mouseup",v),r.addEventListener("mousemove",w),r.addEventListener("mouseleave",E),r.addEventListener("touchstart",m),r.addEventListener("touchend",p),r.addEventListener("touchmove",A,{passive:!1}),x(),()=>{r.removeEventListener("mousedown",g),r.removeEventListener("mouseup",v),r.removeEventListener("mousemove",w),r.removeEventListener("mouseleave",E),r.removeEventListener("touchstart",m),r.removeEventListener("touchend",p),r.removeEventListener("touchmove",A)}},[n,s,t,l]),null}function Pe({opacity:a}){const t=o.useMemo(()=>{const s=new Float32Array(9e3);for(let n=0;n<3e3;n++){const u=Math.random()*Math.PI*2,d=Math.acos(2*Math.random()-1),c=800;s[n*3]=c*Math.sin(d)*Math.cos(u),s[n*3+1]=c*Math.sin(d)*Math.sin(u),s[n*3+2]=c*Math.cos(d)}return s},[]);return e.jsxs("points",{children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{attach:"attributes-position",count:3e3,array:t,itemSize:3})}),e.jsx("pointsMaterial",{size:.8,color:8947848,transparent:!0,opacity:a*.5,sizeAttenuation:!1})]})}function ze(){const[a,l]=o.useState({phase:"earth-spin",progress:0}),t=o.useRef(Date.now()),s=5e3,n=2500,u=2e3,d=o.useCallback(()=>{l({phase:"complete",progress:1})},[]);o.useEffect(()=>{let g;const v=()=>{const w=Date.now(),E=w-t.current;l(m=>{if(m.phase==="complete")return m;if(m.phase==="earth-spin"){const p=Math.min(E/s,1);return p>=1?(t.current=w,{phase:"camera-swoop",progress:0}):{...m,progress:p}}if(m.phase==="camera-swoop"){const p=Math.min(E/n,1);return p>=1?(t.current=w,{phase:"stars-fade",progress:0}):{...m,progress:p}}if(m.phase==="stars-fade"){const p=Math.min(E/u,1);return p>=1?{phase:"complete",progress:1}:{...m,progress:p}}return m}),a.phase!=="complete"&&(g=requestAnimationFrame(v))};return g=requestAnimationFrame(v),()=>cancelAnimationFrame(g)},[a.phase]);const c=a.phase==="stars-fade"?Z(a.progress):a.phase==="complete"?1:0,r=a.phase==="camera-swoop"?Ae(a.progress):a.phase==="stars-fade"||a.phase==="complete"?1:0,x=a.phase==="complete";return{state:a,introEarthExitProgress:r,starsOpacity:c,controlsEnabled:x,skipIntro:d}}function Ie(a){const[l,t]=o.useState(a),[s,n]=o.useState(a),[u,d]=o.useState(!1),c=o.useRef(Date.now()),r=o.useRef(a),x=2e3;o.useEffect(()=>{if(!u)return;let v;const w=()=>{const E=Date.now()-c.current,m=Math.min(E/x,1),p=Z(m),A=r.current.latitude+(s.latitude-r.current.latitude)*p,f=r.current.longitude+(s.longitude-r.current.longitude)*p;t({latitude:A,longitude:f}),m<1?v=requestAnimationFrame(w):(d(!1),t(s))};return v=requestAnimationFrame(w),()=>cancelAnimationFrame(v)},[u,s]);const g=o.useCallback(v=>{r.current=l,c.current=Date.now(),n(v),d(!0)},[l]);return{currentLocation:l,changeLocation:g,isAnimating:u}}function Re({starCount:a,planetCount:l,onDismiss:t,isExiting:s}){const{t:n}=K();return e.jsx("div",{className:`welcome-card-container ${s?"exiting":""}`,children:e.jsxs("div",{className:"welcome-card",children:[e.jsx("h2",{className:"welcome-title",children:n("pages.home.infoCard.title")}),e.jsx("p",{className:"welcome-description",children:n("pages.home.infoCard.description")}),e.jsx("div",{className:"welcome-stats",children:n("pages.home.infoCard.stats",{starCount:a.toLocaleString(),planetCount:l.toLocaleString()})}),e.jsx("p",{className:"welcome-hint",children:n("pages.home.infoCard.hint")}),e.jsx("button",{className:"welcome-dismiss",onClick:t,children:n("pages.home.infoCard.dismiss")})]})})}function _e({stars:a,onStarClick:l}){const{currentLocation:t,changeLocation:s,isAnimating:n}=Ie(U["São Paulo"]),[u]=o.useState(()=>new Date),[d,c]=o.useState({azimuth:180,altitude:-10}),[r,x]=o.useState(!1),[g,v]=o.useState(null),[w,E]=o.useState(null),[m,p]=o.useState("São Paulo"),[A,f]=o.useState(!1),[S,T]=o.useState(!1),k=o.useRef(!1),{state:i,introEarthExitProgress:h,starsOpacity:y,controlsEnabled:C,skipIntro:N}=ze();o.useEffect(()=>{if(i.phase==="complete"&&!k.current&&!A){const j=setTimeout(()=>{f(!0)},300);return()=>clearTimeout(j)}},[i.phase,A]);const P=o.useCallback(()=>{k.current=!0,T(!0),setTimeout(()=>{f(!1),T(!1)},300)},[]),R=o.useCallback((j,M)=>{c({azimuth:j,altitude:M})},[]),z=o.useCallback((j,M)=>{s(M),p(j),x(!1)},[s]),L=o.useCallback((j,M)=>{v(j),E(M??null)},[]),b=i.phase==="complete";return e.jsxs("div",{className:"starfield-container",children:[e.jsxs(ne,{camera:{fov:60,near:.1,far:2e3,position:[0,50,400]},gl:{antialias:!0,alpha:!1},style:{background:"#000"},children:[e.jsx("color",{attach:"background",args:["#000000"]}),e.jsx(Ne,{introState:i,onBearingChange:R,controlsEnabled:C}),e.jsx("ambientLight",{intensity:.3}),e.jsx(Le,{progress:h}),(i.phase==="stars-fade"||i.phase==="complete")&&e.jsxs(e.Fragment,{children:[e.jsx(Pe,{opacity:1}),e.jsx(xe,{stars:a,observer:t,date:u,onStarClick:l,onStarHover:L}),e.jsx(ye,{longitude:t.longitude}),i.phase==="complete"&&e.jsx(Ee,{})]})]}),(i.phase==="stars-fade"||i.phase==="complete")&&e.jsx("div",{className:"scene-fade-overlay",style:{opacity:1-y,pointerEvents:y>=1?"none":"auto"}}),b&&e.jsxs("div",{className:"starfield-bearing",children:[e.jsx("div",{className:"bearing-title",children:"Telescope Bearing"}),e.jsxs("div",{className:"bearing-value",children:[e.jsx("span",{className:"bearing-icon",children:"↔"})," ",ce(d.azimuth)]}),e.jsxs("div",{className:"bearing-value",children:[e.jsx("span",{className:"bearing-icon",children:"↕"})," ",le(d.altitude)]})]}),g&&w&&b&&e.jsxs("div",{className:"starfield-tooltip",style:{left:w.x+20,top:w.y-10},children:[e.jsx("div",{className:"tooltip-name",children:g.hostname}),e.jsxs("div",{className:"tooltip-info",children:[g.sy_pnum," planet",g.sy_pnum!==1?"s":"",g.distance_ly&&e.jsxs(e.Fragment,{children:[" · ",g.distance_ly.toFixed(1)," ly"]})]}),e.jsx("div",{className:"tooltip-hint",children:"Click to explore"})]}),b&&e.jsxs("div",{className:"starfield-location",children:[n?e.jsxs("span",{className:"location-coords location-animating",children:["Traveling to ",m,"..."]}):e.jsxs("span",{className:"location-coords",children:[m," · ",ue(t.latitude),","," ",de(t.longitude)]}),e.jsx("button",{className:"location-button",onClick:()=>x(!r),disabled:n,children:"CHANGE LOCATION"}),r&&!n&&e.jsx("div",{className:"location-picker",children:Object.entries(U).map(([j,M])=>e.jsx("button",{className:"location-option",onClick:()=>z(j,M),children:j},j))})]}),b&&e.jsx("div",{className:"starfield-info",children:e.jsxs("span",{children:[a.length.toLocaleString()," exoplanet host stars"]})}),i.phase!=="complete"&&e.jsxs("div",{className:"intro-overlay",onClick:N,children:[i.phase==="earth-spin"&&e.jsx("div",{className:"intro-text",children:e.jsxs("div",{className:"intro-title-container",children:[e.jsx("div",{className:"intro-title-line intro-title-line-exo",children:"EXO".split("").map((j,M)=>e.jsx("span",{className:"intro-letter",style:{animationDelay:`${M*.25}s`},children:j},M))}),e.jsx("div",{className:"intro-title-line intro-title-line-planets",children:"PLANETS".split("").map((j,M)=>e.jsx("span",{className:"intro-letter",style:{animationDelay:`${3*.25+M*.25}s`},children:j},M))})]})}),(i.phase==="camera-swoop"||i.phase==="stars-fade")&&e.jsx("div",{className:"intro-text",style:{opacity:i.phase==="stars-fade"?1-y:1},children:e.jsx("span",{className:"intro-subtitle",children:"Explore the cosmos"})}),i.phase!=="stars-fade"&&e.jsx("div",{className:"intro-skip",children:"Click anywhere to skip"})]}),A&&e.jsx(Re,{starCount:a.length,planetCount:a.reduce((j,M)=>j+(M.sy_pnum||0),0),onDismiss:P,isExiting:S})]})}function Be(){const{getAllStars:a}=Q(),l=H(),t=a(),s=o.useCallback(n=>{l(`/stars/${ee(n.hostname)}`)},[l]);return e.jsx(_e,{stars:t,onStarClick:s})}export{Be as default};
