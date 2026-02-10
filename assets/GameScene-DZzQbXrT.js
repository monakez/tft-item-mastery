import{S as G,T as S,b as P,G as b,c as I,d as _,C as v,P as D,B as E,f as x}from"./index-CPZa50bd.js";class y extends G{constructor(t,n=64,e=64){super(S.EMPTY),this.item=t,this.width=n,this.height=e,this.texture=S.from(`/tft-item-mastery/items/${t.icon}`)}updateData(t){this.item=t,this.texture=S.from(`/tft-item-mastery/items/${t.icon}`),this.glow&&(this.glow.outerStrength=0)}setPosition(t,n){return this.position.set(t,n),this}makeInteractive(){return this.interactive=!0,this.cursor="pointer",this}}var O=`in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`,F=`struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>
  };

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

fn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  
}

fn getSize() -> vec2<f32>
{
  return gfu.uGlobalFrame.zw;
}
  
@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>, 
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition)
  );
}`,z=`precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 uStrength;
uniform vec3 uColor;
uniform float uKnockout;
uniform float uAlpha;

uniform vec4 uInputSize;
uniform vec4 uInputClamp;

const float PI = 3.14159265358979323846264;

// Hard-assignment of DIST and ANGLE_STEP_SIZE instead of using uDistance and uQuality to allow them to be use on GLSL loop conditions
const float DIST = __DIST__;
const float ANGLE_STEP_SIZE = min(__ANGLE_STEP_SIZE__, PI * 2.);
const float ANGLE_STEP_NUM = ceil(PI * 2. / ANGLE_STEP_SIZE);
const float MAX_TOTAL_ALPHA = ANGLE_STEP_NUM * DIST * (DIST + 1.) / 2.;

void main(void) {
    vec2 px = vec2(1.) / uInputSize.xy;

    float totalAlpha = 0.;

    vec2 direction;
    vec2 displaced;
    vec4 curColor;

    for (float angle = 0.; angle < PI * 2.; angle += ANGLE_STEP_SIZE) {
      direction = vec2(cos(angle), sin(angle)) * px;

      for (float curDistance = 0.; curDistance < DIST; curDistance++) {
          displaced = clamp(vTextureCoord + direction * (curDistance + 1.), uInputClamp.xy, uInputClamp.zw);
          curColor = texture(uTexture, displaced);
          totalAlpha += (DIST - curDistance) * curColor.a;
      }
    }
    
    curColor = texture(uTexture, vTextureCoord);

    vec4 glowColor = vec4(uColor, uAlpha);
    bool knockout = uKnockout > .5;
    float innerStrength = uStrength[0];
    float outerStrength = uStrength[1];

    float alphaRatio = totalAlpha / MAX_TOTAL_ALPHA;
    float innerGlowAlpha = (1. - alphaRatio) * innerStrength * curColor.a * uAlpha;
    float innerGlowStrength = min(1., innerGlowAlpha);
    
    vec4 innerColor = mix(curColor, glowColor, innerGlowStrength);
    float outerGlowAlpha = alphaRatio * outerStrength * (1. - curColor.a) * uAlpha;
    float outerGlowStrength = min(1. - innerColor.a, outerGlowAlpha);
    vec4 outerGlowColor = outerGlowStrength * glowColor.rgba;

    if (knockout) {
      float resultAlpha = outerGlowAlpha + innerGlowAlpha;
      finalColor = vec4(glowColor.rgb * resultAlpha, resultAlpha);
    }
    else {
      finalColor = innerColor + outerGlowColor;
    }
}
`,k=`struct GlowUniforms {
  uDistance: f32,
  uStrength: vec2<f32>,
  uColor: vec3<f32>,
  uAlpha: f32,
  uQuality: f32,
  uKnockout: f32,
};

struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

@group(0) @binding(1) var uTexture: texture_2d<f32>; 
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> glowUniforms : GlowUniforms;

@fragment
fn mainFragment(
  @builtin(position) position: vec4<f32>,
  @location(0) uv : vec2<f32>
) -> @location(0) vec4<f32> {
  let quality = glowUniforms.uQuality;
  let distance = glowUniforms.uDistance;

  let dist: f32 = glowUniforms.uDistance;
  let angleStepSize: f32 = min(1. / quality / distance, PI * 2.0);
  let angleStepNum: f32 = ceil(PI * 2.0 / angleStepSize);

  let px: vec2<f32> = vec2<f32>(1.0 / gfu.uInputSize.xy);

  var totalAlpha: f32 = 0.0;

  var direction: vec2<f32>;
  var displaced: vec2<f32>;
  var curColor: vec4<f32>;

  for (var angle = 0.0; angle < PI * 2.0; angle += angleStepSize) {
    direction = vec2<f32>(cos(angle), sin(angle)) * px;
    for (var curDistance = 0.0; curDistance < dist; curDistance+=1) {
      displaced = vec2<f32>(clamp(uv + direction * (curDistance + 1.0), gfu.uInputClamp.xy, gfu.uInputClamp.zw));
      curColor = textureSample(uTexture, uSampler, displaced);
      totalAlpha += (dist - curDistance) * curColor.a;
    }
  }
    
  curColor = textureSample(uTexture, uSampler, uv);

  let glowColorRGB = glowUniforms.uColor;
  let glowAlpha = glowUniforms.uAlpha;
  let glowColor = vec4<f32>(glowColorRGB, glowAlpha);
  let knockout: bool = glowUniforms.uKnockout > 0.5;
  let innerStrength = glowUniforms.uStrength[0];
  let outerStrength = glowUniforms.uStrength[1];

  let alphaRatio: f32 = (totalAlpha / (angleStepNum * dist * (dist + 1.0) / 2.0));
  let innerGlowAlpha: f32 = (1.0 - alphaRatio) * innerStrength * curColor.a * glowAlpha;
  let innerGlowStrength: f32 = min(1.0, innerGlowAlpha);
  
  let innerColor: vec4<f32> = mix(curColor, glowColor, innerGlowStrength);
  let outerGlowAlpha: f32 = alphaRatio * outerStrength * (1. - curColor.a) * glowAlpha;
  let outerGlowStrength: f32 = min(1.0 - innerColor.a, outerGlowAlpha);
  let outerGlowColor: vec4<f32> = outerGlowStrength * glowColor.rgba;
  
  if (knockout) {
    let resultAlpha: f32 = outerGlowAlpha + innerGlowAlpha;
    return vec4<f32>(glowColor.rgb * resultAlpha, resultAlpha);
  }
  else {
    return innerColor + outerGlowColor;
  }
}

const PI: f32 = 3.14159265358979323846264;`,U=Object.defineProperty,M=(l,t,n)=>t in l?U(l,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):l[t]=n,w=(l,t,n)=>(M(l,typeof t!="symbol"?t+"":t,n),n);const T=class A extends P{constructor(t){t={...A.DEFAULT_OPTIONS,...t};const n=t.distance??10,e=t.quality??.1,o=b.from({vertex:{source:F,entryPoint:"mainVertex"},fragment:{source:k,entryPoint:"mainFragment"}}),r=I.from({vertex:O,fragment:z.replace(/__ANGLE_STEP_SIZE__/gi,`${(1/e/n).toFixed(7)}`).replace(/__DIST__/gi,`${n.toFixed(0)}.0`),name:"glow-filter"});super({gpuProgram:o,glProgram:r,resources:{glowUniforms:{uDistance:{value:n,type:"f32"},uStrength:{value:[t.innerStrength,t.outerStrength],type:"vec2<f32>"},uColor:{value:new Float32Array(3),type:"vec3<f32>"},uAlpha:{value:t.alpha,type:"f32"},uQuality:{value:e,type:"f32"},uKnockout:{value:t?.knockout??!1?1:0,type:"f32"}}},padding:n}),w(this,"uniforms"),w(this,"_color"),this.uniforms=this.resources.glowUniforms.uniforms,this._color=new _,this.color=t.color??16777215}get distance(){return this.uniforms.uDistance}set distance(t){this.uniforms.uDistance=this.padding=t}get innerStrength(){return this.uniforms.uStrength[0]}set innerStrength(t){this.uniforms.uStrength[0]=t}get outerStrength(){return this.uniforms.uStrength[1]}set outerStrength(t){this.uniforms.uStrength[1]=t}get color(){return this._color.value}set color(t){this._color.setValue(t);const[n,e,o]=this._color.toArray();this.uniforms.uColor[0]=n,this.uniforms.uColor[1]=e,this.uniforms.uColor[2]=o}get alpha(){return this.uniforms.uAlpha}set alpha(t){this.uniforms.uAlpha=t}get quality(){return this.uniforms.uQuality}set quality(t){this.uniforms.uQuality=t}get knockout(){return this.uniforms.uKnockout===1}set knockout(t){this.uniforms.uKnockout=t?1:0}};w(T,"DEFAULT_OPTIONS",{distance:10,outerStrength:4,innerStrength:0,color:16777215,alpha:1,quality:.1,knockout:!1});let L=T;class N extends v{constructor(t,n){super(),this.ctx=t,this.onCombine=n,this.draggingSprite=null,this.dragOffset={x:0,y:0},this.baseSprites=[],this.drawItems(),this.disableGlow()}glow(t){const n=this.baseSprites.filter(e=>e?.item?.id===t&&e?.glow?.outerStrength===0);n[0]?.glow&&(n[0].glow.outerStrength=2)}disableGlow(){this.baseSprites.forEach(t=>{t.glow.outerStrength=0})}drawItems(){const t=this.ctx.currentSet?.base||[],n=[...t,...t].sort(()=>Math.random()-.5),e=70,o=15,r=2,u=Math.ceil(n.length/r),m=((this.parent?.width||this.ctx.app.screen.width)-(u*(e+o)-o))/2,d=0;this.baseSprites.forEach(s=>{s.off(),s.destroy({children:!0,texture:!1})}),this.baseSprites=[],n.forEach((s,h)=>{const g=Math.floor(h/r),f=h%r,c=m+g*(e+o),p=d+f*(e+o),a=new y(s,e,e).makeInteractive().setPosition(c,p);a.originalX=c,a.originalY=p,a.on("pointerdown",this.onDragStart,this).on("globalpointermove",this.onDragMove,this).on("pointerup",this.onDragEnd,this).on("pointerupoutside",this.onDragEnd,this),this.addChild(a),this.baseSprites.push(a),this.applyGlowFilter(a)})}applyGlowFilter(t){const n=new L({distance:5,outerStrength:0,innerStrength:0,color:30464,quality:1});t.glow=n,t.filters=[n]}onDragStart(t){const n=t.currentTarget;this.draggingSprite=n,this.dragOffset={x:t.global.x-n.x,y:t.global.y-n.y},n.cursor="grabbing",n.alpha=.8,this.addChild(n)}onDragMove(t){this.draggingSprite&&(this.draggingSprite.x=t.global.x-this.dragOffset.x,this.draggingSprite.y=t.global.y-this.dragOffset.y)}onDragEnd(){if(!this.draggingSprite)return;const t=this.draggingSprite;t.alpha=1,t.cursor="grab";let n=null;for(const i of this.baseSprites)if(i!==t&&this.isColliding(t,i)){n=i;break}if(this.draggingSprite=null,!n){t.x=t.originalX,t.y=t.originalY;return}const e=new D((t.x+n.x)/2,(t.y+n.y)/2),o=this.toGlobal(e),r={x:o.x,y:o.y},u=this.combineItems(t.item,n.item);t.x=t.originalX,t.y=t.originalY,this.onCombine&&u&&this.onCombine({itemA:t.item,itemB:n.item,result:u,position:r})}isColliding(t,n){const e=t.getBounds(),o=n.getBounds();return e.x+e.width>o.x&&e.x<o.x+o.width&&e.y+e.height>o.y&&e.y<o.y+o.height}combineItems(t,n){const e=[t.id,n.id].sort(),o=this.ctx.currentSet.findItemByRecipe(e)||this.ctx.sets.all.findItemByRecipe(e);if(!o)throw new Error("recipe not found");return o}destroy(){super.destroy({children:!0})}}const C=96;class R extends E{constructor(t){super(t);const n=.5;this.hudContainer=new v,this.gameAreaContainer=new v,this.container.addChild(this.hudContainer,this.gameAreaContainer),this.gameArea={x:0,y:0,width:this.ctx.app.screen.width,height:this.ctx.app.screen.height*n};const{width:e,height:o}=t.app.screen,r=new x().rect(0,0,this.gameArea.width,this.gameArea.height).fill({color:1710638,alpha:.7}),u=new x().moveTo(0,this.gameArea.height).lineTo(this.gameArea.width,this.gameArea.height).stroke({width:2,color:4473958});this.gameAreaContainer.addChild(r,u);const i=new x().rect(0,o*.8,e,o*.2).fill({color:1450302,alpha:.9});this.hudContainer.addChild(i),this.createCommonHud(),this.hudContainer.y=o*n}createCommonHud(){this.dragPanel=new N(this.ctx,t=>this.onCombine(t)),this.hudContainer.addChild(this.dragPanel)}onCombine(t){const n=new y(t.result,C,C);n.x=t.position.x,n.y=t.position.y,this.gameAreaContainer.addChild(n);const e=this.findTargetTftItem(t.result);if(e){const o=e.getGlobalPosition();this.animateToTarget(n,()=>({x:o.x,y:o.y}),()=>this.onHit(t.result,e))}else this.animateToTarget(n,()=>({x:0,y:0}),()=>this.onMiss(t.result))}animateToTarget(t,n,e){let o=0;const r=.02,u=1.5,i=()=>{const m=this.ctx.app.ticker.deltaMS;o=Math.min(o+r*m,u);const d=n(),s=d.x,h=d.y,g=s-t.x,f=h-t.y,c=Math.sqrt(g*g+f*f),p=o*m;if(c<=p&&c>0)t.x=s,t.y=h,this.ctx.app.ticker.remove(i),e(),setTimeout(()=>{t.parent&&t.destroy()},100);else{const a=p/c;t.x+=g*a,t.y+=f*a}};this.ctx.app.ticker.add(i)}onHit(t,n){console.log("onHit")}onMiss(){console.log("onMiss")}findTargetTftItem(t){return null}}export{R as G,y as T,C as a};
