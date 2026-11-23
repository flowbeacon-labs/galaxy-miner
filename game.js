/* Galaxy Miner — original Three.js / WebGL arcade game. MIT licensed. */
(async () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const overlay=$('overlay'), panelTitle=$('panel-title'), panelDesc=$('panel-desc');
  const instructions=$('instructions'), primary=$('primary'), eyebrow=$('panel-eyebrow');
  const defaultInstructions=instructions.innerHTML;
  let THREE;
  try { THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js'); }
  catch (err) { console.error('Three.js could not load',err); $('error').hidden=false;overlay.style.display='none';return; }
  let renderer;
  try {renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:false,powerPreference:'high-performance'});}
  catch(err) {console.error(err);$('error').hidden=false;overlay.style.display='none';return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.4;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#050b20');scene.fog=new THREE.FogExp2(0x080c24,.0031);
  const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.1,2000);
  camera.position.set(0,4,30);
  const clock=new THREE.Clock();
  scene.add(new THREE.HemisphereLight(0x93c5ff,0x19102e,2.0));
  const sun=new THREE.DirectionalLight(0xffdfa3,2.9);sun.position.set(-55,90,-130);scene.add(sun);
  const cyanLight=new THREE.PointLight(0x46baff,40,110);cyanLight.position.set(18,4,-30);scene.add(cyanLight);
  const mat=(color,metalness=.15,roughness=.56)=>new THREE.MeshStandardMaterial({color,metalness,roughness,flatShading:true});
  const hullMat=mat(0xe4edf9,.75,.27),wingMat=mat(0x438fa9,.63,.33),darkMat=mat(0x121d39,.46,.35);
  const fireMat=new THREE.MeshBasicMaterial({color:0x73f5ff,transparent:true,opacity:.85});
  const ship=new THREE.Group(),shipBody=new THREE.Group();ship.add(shipBody);scene.add(ship);
  const addMesh=(parent,geom,m,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geom,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
  const cone=addMesh(shipBody,new THREE.ConeGeometry(.98,4.35,6),hullMat,0,0,-.1);cone.rotation.x=-Math.PI/2;
  const cockpit=addMesh(shipBody,new THREE.SphereGeometry(.7,12,9),mat(0x66defa,.7,.15),0,.53,-.38);cockpit.scale.set(.8,.6,1.5);
  const leftWing=addMesh(shipBody,new THREE.BoxGeometry(3.4,.17,1.8),wingMat,-1.95,-.28,.8);leftWing.rotation.z=-.13;
  const rightWing=addMesh(shipBody,new THREE.BoxGeometry(3.4,.17,1.8),wingMat,1.95,-.28,.8);rightWing.rotation.z=.13;
  addMesh(shipBody,new THREE.BoxGeometry(.85,.85,1.8),darkMat,-1.1,-.2,1.2);
  addMesh(shipBody,new THREE.BoxGeometry(.85,.85,1.8),darkMat,1.1,-.2,1.2);
  for(const x of [-1.1,1.1]){const engine=addMesh(shipBody,new THREE.CylinderGeometry(.34,.53,1.1,10),fireMat,x,-.25,2.2);engine.rotation.x=Math.PI/2;}
  const engineGlow=new THREE.PointLight(0x47d9ff,13,28);engineGlow.position.set(0,-.3,3);ship.add(engineGlow);
  const thrusters=[];
  for(const x of [-1.1,1.1]){const flame=addMesh(ship,new THREE.ConeGeometry(.31,2.2,9),new THREE.MeshBasicMaterial({color:0x40dafa,transparent:true,opacity:.85}),x,-.25,3.25);flame.rotation.x=Math.PI/2;thrusters.push(flame);}
  const planetGroup=new THREE.Group();scene.add(planetGroup);
  const planet=addMesh(planetGroup,new THREE.SphereGeometry(83,32,20),mat(0x3e74bc,.18,.85),210,68,-590);
  const atmosphere=addMesh(planetGroup,new THREE.SphereGeometry(90,32,20),new THREE.MeshBasicMaterial({color:0x4e96ed,transparent:true,opacity:.14,depthWrite:false}),210,68,-590);
  const ring=addMesh(planetGroup,new THREE.RingGeometry(104,137,76),new THREE.MeshBasicMaterial({color:0xa8c1ff,side:THREE.DoubleSide,transparent:true,opacity:.44,depthWrite:false}),210,68,-590);
  ring.rotation.x=1.2;ring.rotation.y=.38;
  const beacon=new THREE.PointLight(0x637eff,32,160);beacon.position.set(140,0,-240);scene.add(beacon);
  const starsCount=1100,starPos=new Float32Array(starsCount*3);
  function initStars(){for(let i=0;i<starsCount;i++){starPos[i*3]=(Math.random()-.5)*480;starPos[i*3+1]=(Math.random()-.5)*300;starPos[i*3+2]=-Math.random()*920+40;}}
  initStars();const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
  const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xcee9ff,size:.75,sizeAttenuation:true,transparent:true,opacity:.88}));scene.add(stars);
  const rockMaterials=[mat(0x788399,.05,.96),mat(0x847c9e,.15,.85),mat(0x6e8b9d,.08,.9),mat(0x977e74,.1,.88)];
  const oreMat=[new THREE.MeshStandardMaterial({color:0x76f5f4,emissive:0x13aac2,emissiveIntensity:1.7,metalness:.3,roughness:.24}),new THREE.MeshStandardMaterial({color:0xffd46e,emissive:0xb8751f,emissiveIntensity:1.6,metalness:.35,roughness:.24})];
  const asteroids=[],pickups=[],sparks=[];let nextRockZ=-30;
  const rand=(min,max)=>min+Math.random()*(max-min);
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const rockGeoCache=[];
  for(let i=0;i<10;i++){
    const geo=new THREE.IcosahedronGeometry(1,1);const pos=geo.attributes.position;
    for(let p=0;p<pos.count;p++){const v=new THREE.Vector3().fromBufferAttribute(pos,p);v.multiplyScalar(rand(.78,1.21));pos.setXYZ(p,v.x,v.y,v.z);}
    geo.computeVertexNormals();rockGeoCache.push(geo);
  }
  function spawnRock(z){
    const r=rand(2.0,4.6),mesh=new THREE.Mesh(rockGeoCache[Math.floor(rand(0,rockGeoCache.length))],rockMaterials[Math.floor(rand(0,rockMaterials.length))]);
    const x=rand(-15,15),y=rand(-9,9);mesh.position.set(x,y,z);mesh.scale.setScalar(r);mesh.rotation.set(rand(0,6),rand(0,6),rand(0,6));scene.add(mesh);
    const hp=rand(48,72);const obj={mesh,r,hp,maxHp:hp,rot:rand(-.18,.18),ore:Math.round(rand(5,10))};
    asteroids.push(obj);return obj;
  }
  const pickupGeo=new THREE.OctahedronGeometry(.85,0);
  function spawnPickup(pos,value){
    const mesh=new THREE.Mesh(pickupGeo,oreMat[Math.random()<.82?0:1]);mesh.position.copy(pos);mesh.position.x+=rand(-1.2,1.2);mesh.position.y+=rand(-1.2,1.2);scene.add(mesh);
    pickups.push({mesh,value,age:0});
  }
  function explodeRock(rock){
    const pos=rock.mesh.position.clone();scene.remove(rock.mesh);asteroids.splice(asteroids.indexOf(rock),1);
    for(let i=0;i<3;i++)spawnPickup(pos.clone().add(new THREE.Vector3(rand(-2.1,2.1),rand(-2,2),rand(-1.7,1.7))),Math.ceil(rock.ore/3));
    for(let i=0;i<10;i++)sparks.push({pos:pos.clone(),vel:new THREE.Vector3(rand(-12,12),rand(-12,12),rand(-12,12)),life:rand(.25,.6)});
    score+=12;playTone(210,.09,'sawtooth');notify('ASTEROID MINED  +12');
  }
  const laserMaterial=new THREE.LineBasicMaterial({color:0x7ffaff,transparent:true,opacity:.94});
  const laserLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),laserMaterial);scene.add(laserLine);laserLine.visible=false;
  const crosshairLight=new THREE.PointLight(0x53efff,15,35);scene.add(crosshairLight);crosshairLight.visible=false;
  const key={up:false,down:false,left:false,right:false,mine:false,boost:false};
  const touch={x:0,y:0,active:false,mine:false,boost:false};let stickPointer=null;
  let state='menu',sector=1,sectorOre=0,totalOre=0,score=0,hull=100,maxHull=100,energy=100,laserPower=1,magnetRadius=4,velocity=24,flightDistance=0,sectorDistance=0;
  let shipX=0,shipY=0,shipZ=0,invulnerable=0,laserClock=0,toastTimeout=0,muted=false,ctx;
  const missionTargets=[0,60,85,110];
  const savedKey='galaxy-miner-v1-best';let bestScore=0;
  try{bestScore=Number(localStorage.getItem(savedKey))||0;}catch{}
  const joystick=$('joystick'),stick=$('stick'),mineButton=$('mine'),boostButton=$('boost');
  function setPointerControl(element,action){
    const end=()=>{touch[action]=false;element.classList.remove('active');};
    element.addEventListener('pointerdown',e=>{if(state!=='playing')return;e.preventDefault();touch[action]=true;element.classList.add('active');try{element.setPointerCapture(e.pointerId);}catch{}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,end);
  }
  setPointerControl(mineButton,'mine');setPointerControl(boostButton,'boost');
  function moveStick(e){const box=joystick.getBoundingClientRect();const cx=box.left+box.width/2,cy=box.top+box.height/2;const radius=box.width*.3;const dx=e.clientX-cx,dy=e.clientY-cy,scale=Math.max(1,Math.hypot(dx,dy)/radius);touch.x=clamp(dx/scale/radius,-1,1);touch.y=clamp(dy/scale/radius,-1,1);stick.style.transform=`translate(${touch.x*radius}px,${touch.y*radius}px)`;}
  const resetStick=()=>{touch.active=false;touch.x=touch.y=0;stickPointer=null;stick.style.transform='translate(0,0)';};
  joystick.addEventListener('pointerdown',e=>{if(state!=='playing'||stickPointer!==null)return;stickPointer=e.pointerId;touch.active=true;moveStick(e);try{joystick.setPointerCapture(e.pointerId);}catch{}});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)moveStick(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,e=>{if(e.pointerId===stickPointer)resetStick();});
  const keymap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'mine',ShiftLeft:'boost',ShiftRight:'boost'};
  document.addEventListener('keydown',e=>{const action=keymap[e.code];if(action){e.preventDefault();key[action]=true;}if(e.code==='KeyP'&&!e.repeat)togglePause();});
  document.addEventListener('keyup',e=>{const action=keymap[e.code];if(action){e.preventDefault();key[action]=false;}});
  const clearControls=()=>{for(const k in key)key[k]=false;touch.mine=touch.boost=false;mineButton.classList.remove('active');boostButton.classList.remove('active');resetStick();};
  window.addEventListener('blur',()=>{if(state==='playing')togglePause();clearControls();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause();if(document.hidden)clearControls();});
  $('pause').addEventListener('click',togglePause);
  $('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'♪̸':'♫';});
  function playTone(freq,duration=.07,type='sine'){
    if(muted)return;
    try{ctx??=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,ctx.currentTime);gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);}catch{}
  }
  function notify(message){$('toast').textContent=message;$('toast').style.opacity='1';toastTimeout=performance.now()+1100;}
  function showPanel(title,description,button,eyebrowText,extra){panelTitle.textContent=title;panelDesc.textContent=description;primary.textContent=button;eyebrow.textContent=eyebrowText;instructions.innerHTML=extra??defaultInstructions;overlay.style.display='grid';}
  function togglePause(){if(state==='playing'){state='paused';clearControls();showPanel('Expedition Paused','Your spacecraft is holding position. Resume when ready.','RESUME FLIGHT','MISSION PAUSED');}else if(state==='paused'){state='playing';overlay.style.display='none';}}
  function startGame(){clearControls();for(const a of asteroids)scene.remove(a.mesh);for(const p of pickups)scene.remove(p.mesh);asteroids.length=0;pickups.length=0;sparks.length=0;
    sector=1;sectorOre=0;totalOre=0;score=0;hull=100;maxHull=100;energy=100;laserPower=1;magnetRadius=4;shipX=0;shipY=0;shipZ=0;flightDistance=0;sectorDistance=0;velocity=24;invulnerable=1.5;nextRockZ=-40;laserLine.visible=false;
    for(let i=0;i<42;i++){spawnRock(nextRockZ);nextRockZ-=rand(13,24);}
    state='playing';overlay.style.display='none';clock.getDelta();playTone(460,.12);notify('SECTOR 1 — THE BLUE BELT');
  }
  function finishSector(){
    clearControls();laserLine.visible=false;
    if(sector===3){state='won';try{bestScore=Math.max(bestScore,score);localStorage.setItem(savedKey,String(bestScore));}catch{}
      showPanel('Expedition Complete!','You conquered all three asteroid sectors and recovered '+totalOre+' units of ore. Final score: '+score+'. Personal best: '+bestScore+'.','FLY AGAIN','GALAXY MINER — VICTORY', '');return;}
    state='upgrade';
    const upgrades=[['⚡ LASER MK II','Mine asteroids 35% faster',()=>laserPower*=1.35],['🧲 ORE MAGNET','Collect minerals from farther away',()=>magnetRadius+=3],['🛡️ REINFORCED HULL','Increase armor and repair your ship',()=>{maxHull+=30;hull=Math.min(maxHull,hull+55);}]];
    const upgradeMarkup='<p style="grid-column:1/-1;color:#b7dafa;margin:2px 0">Choose one permanent ship upgrade:</p>'+upgrades.map(([title,description])=>'<button class="upgrade-option" type="button"><strong>'+title+'</strong><span>'+description+'</span></button>').join('');
    primary.hidden=true;
    showPanel('Sector '+sector+' Cleared!','You collected '+missionTargets[sector]+' ore and earned a ship upgrade. Which system will you improve?','', 'SHIPYARD — CHOOSE YOUR UPGRADE',upgradeMarkup);
    instructions.style.gridTemplateColumns='1fr';
    // Attach upgrade actions after the panel content is rendered.
    instructions.querySelectorAll('.upgrade-option').forEach((button,index)=>button.addEventListener('click',()=>{upgrades[index][2]();sector++;sectorOre=0;sectorDistance=0;energy=100;hull=Math.min(maxHull,hull+20);invulnerable=2;state='playing';overlay.style.display='none';primary.hidden=false;instructions.style.gridTemplateColumns='';notify('SECTOR '+sector+' — UPGRADE INSTALLED');playTone(820,.3,'triangle');}));
  }
  primary.addEventListener('click',()=>{if(state==='paused'){togglePause();return;}if(state==='menu'||state==='lost'||state==='won')startGame();});
  function lose(){state='lost';clearControls();laserLine.visible=false;try{bestScore=Math.max(score,bestScore);localStorage.setItem(savedKey,String(bestScore));}catch{}showPanel('Ship Disabled','Your mining vessel needs repairs. You recovered '+totalOre+' ore, scoring '+score+' points. Best: '+bestScore+'.','TRY AGAIN','EXPEDITION ENDED','');}
  function updateHud(){
    $('ore').textContent=sectorOre;$('target').textContent=missionTargets[sector];$('sector').textContent=sector+' / 3';$('score').textContent=score;
    const hp=Math.round(100*hull/maxHull);$('hull-fill').style.width=hp+'%';$('hull-label').textContent=hp+'%';
    $('energy-fill').style.width=Math.round(energy)+'%';$('energy-label').textContent=Math.round(energy)+'%';
    $('mission').textContent=sectorOre>=missionTargets[sector]?'Sector complete!':'Mine '+Math.max(0,missionTargets[sector]-sectorOre)+' more ore';
  }
  function move(dt){
    const axisX=clamp((key.right?1:0)-(key.left?1:0)+touch.x,-1,1),axisY=clamp((key.up?1:0)-(key.down?1:0)-touch.y,-1,1);
    const boosting=(key.boost||touch.boost)&&energy>1;const speed=velocity*(boosting?1.75:1);
    if(boosting)energy=Math.max(0,energy-25*dt);else energy=Math.min(100,energy+15*dt);
    shipX=clamp(shipX+axisX*21*dt,-18.5,18.5);shipY=clamp(shipY+axisY*17*dt,-10.5,10.5);
    const advance=speed*dt;shipZ-=advance;flightDistance+=advance;sectorDistance+=advance;
    ship.position.set(shipX,shipY,shipZ);
    const lerp=1-Math.exp(-8*dt);shipBody.rotation.z=THREE.MathUtils.lerp(shipBody.rotation.z,-axisX*.34,lerp);
    shipBody.rotation.x=THREE.MathUtils.lerp(shipBody.rotation.x,axisY*.16,lerp);
    thrusters.forEach((flame,i)=>{flame.scale.y=(boosting?2.1:1)*(.85+.16*Math.sin(performance.now()*.014+i));});
    camera.position.lerp(new THREE.Vector3(shipX*.5,shipY*.52+5,shipZ+25),1-Math.exp(-3*dt));
    camera.lookAt(shipX*.75,shipY*.7,shipZ-34);
    planetGroup.position.z=shipZ*.28;beacon.position.z=shipZ-160;
    if(invulnerable>0)invulnerable-=dt;ship.visible=!(invulnerable>0&&Math.floor(invulnerable*11)%2===0);
  }
  function targetRock(){let result=null,min=Infinity;
    for(const rock of asteroids){const p=rock.mesh.position,dz=shipZ-p.z;
      if(dz<2||dz>50)continue;
      const dx=p.x-shipX,dy=p.y-shipY;const aimDistance=Math.hypot(dx,dy);
      if(aimDistance<6.5+rock.r*.2&&aimDistance+dz*.11<min){result=rock;min=aimDistance+dz*.11;}
    }return result;
  }
  function updateMining(dt){
    laserLine.visible=false;crosshairLight.visible=false;
    const selected=targetRock(),mining=key.mine||touch.mine;
    $('target-hint').textContent=selected?(mining?'MINING ASTEROID':'HOLD MINE TO EXTRACT ORE'):'Steer toward an asteroid to mine';
    $('target-hint').style.color=selected?'#8effed':'#cfecff';
    if(!selected||!mining)return;
    selected.hp-=47*laserPower*dt;
    const p=selected.mesh.position;
    laserLine.geometry.dispose();laserLine.geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(shipX,shipY-.1,shipZ-2.2),p]);laserLine.visible=true;
    crosshairLight.position.copy(p);crosshairLight.visible=true;
    laserClock+=dt;if(laserClock>.13){playTone(380+Math.random()*70,.035);laserClock=0;}
    if(selected.hp<=0)explodeRock(selected);
  }
  function updateWorld(dt){
    for(let i=asteroids.length-1;i>=0;i--){const rock=asteroids[i],p=rock.mesh.position;rock.mesh.rotation.x+=rock.rot*dt;rock.mesh.rotation.y+=.12*dt;
      if(p.z>shipZ+20){scene.remove(rock.mesh);asteroids.splice(i,1);continue;}
      if(invulnerable<=0&&Math.abs(p.z-shipZ)<rock.r+1.4&&Math.hypot(p.x-shipX,p.y-shipY)<rock.r+1.3){hull=Math.max(0,hull-28);invulnerable=1.7;notify('HULL DAMAGED  −28');playTone(126,.22,'square');if(hull<=0){lose();return;}}
    }
    while(asteroids.length<42&&nextRockZ>shipZ-850){spawnRock(nextRockZ);nextRockZ-=rand(13,24);}
    while(asteroids.length<38){nextRockZ=Math.min(nextRockZ,shipZ-550);spawnRock(nextRockZ);nextRockZ-=rand(13,24);}
    for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.age+=dt;p.mesh.rotation.y+=dt*2;p.mesh.rotation.x+=dt*.8;
      const dx=shipX-p.mesh.position.x,dy=shipY-p.mesh.position.y,dz=shipZ-p.mesh.position.z;
      const dist=Math.hypot(dx,dy,dz);
      if(dist<magnetRadius+3){const attraction=Math.min(1,dt*5.5);p.mesh.position.lerp(ship.position,attraction);}
      if(dist<2.5){score+=p.value*10;sectorOre+=p.value;totalOre+=p.value;scene.remove(p.mesh);pickups.splice(i,1);playTone(840,.07,'triangle');continue;}
      if(p.mesh.position.z>shipZ+15||p.age>24){scene.remove(p.mesh);pickups.splice(i,1);}
    }
    if(sectorOre>=missionTargets[sector]&&sectorDistance>190)finishSector();
    const starsPos=starsGeo.attributes.position;
    for(let i=0;i<starsCount;i++){let z=starsPos.getZ(i);if(z>shipZ+45){starsPos.setZ(i,shipZ-rand(520,880));starsPos.setX(i,rand(-240,240));starsPos.setY(i,rand(-145,145));}}
    starsPos.needsUpdate=true;
    for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.life-=dt;p.pos.addScaledVector(p.vel,dt);if(p.life<=0)sparks.splice(i,1);}
  }
  const sparkGeo=new THREE.BufferGeometry();const sparkPositions=new Float32Array(100*3);sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));
  const sparkPts=new THREE.Points(sparkGeo,new THREE.PointsMaterial({color:0xffd788,size:1.35,transparent:true,opacity:.9,depthWrite:false}));scene.add(sparkPts);
  function drawSparks(){for(let i=0;i<100;i++){const p=sparks[i];sparkPositions[i*3]=p?p.pos.x:10000;sparkPositions[i*3+1]=p?p.pos.y:10000;sparkPositions[i*3+2]=p?p.pos.z:10000;}sparkGeo.attributes.position.needsUpdate=true;}
  function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=h>w?74:67;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  window.addEventListener('resize',resize);
  // A slow animation loop is displayed behind the title screen; gameplay updates only while playing.
  let frameTime=performance.now();
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-frameTime)/1000,.04);frameTime=now;
    if(state==='playing'){
      move(dt);updateMining(dt);
      if(state==='playing')updateWorld(dt);
      updateHud();
    }
    if(state==='menu'||state==='paused'||state==='upgrade'||state==='won'||state==='lost'){
      planet.rotation.y+=dt*.015;shipBody.rotation.y+=dt*.025;
    }
    if(performance.now()>toastTimeout)$('toast').style.opacity='0';
    drawSparks();renderer.render(scene,camera);
  }
  resize();updateHud();requestAnimationFrame(frame);
  // Expose a small, non-mutating diagnostic object for optional automated smoke checks.
  Object.defineProperty(window,'galaxyMinerStatus',{get:()=>({ready:true,state,sector,ore:sectorOre,asteroids:asteroids.length,score})});
})();