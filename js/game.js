const cv=document.getElementById('g'),ctx=cv.getContext('2d'),W=800,GY=340;
const levels = JSON.parse(document.getElementById('level-data').textContent);
let state="start",L=0,plats=[],ens=[],shots=[],scrolls=[],parts=[],score=0,t=0,msgTimer=0;
const P={x:50,y:GY,w:40,h:40,vy:0,hp:100,max:100,face:1,atk:0,cd:0,hurt:0,sp:0,ground:true,walk:0};
const keys={};
addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault()});
addEventListener("keyup",e=>keys[e.code]=false);
document.querySelectorAll('.pad button').forEach(b=>{
 const k=b.dataset.k;
 b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});
 ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));
});
function load(i){
 const l=levels[i];
 plats=l.platforms.map(p=>({...p,height:12}));
 scrolls=l.scrolls.map(s=>({...s,w:16,h:20,got:false}));
 ens=l.enemies.map(e=>({type:e.type,x:e.x,y:GY,w:40,h:40,hp:e.health,max:e.health,speed:e.speed,dir:-1,timer:90,flash:0}));
 shots=[];parts=[];P.x=50;P.y=GY;P.vy=0;msgTimer=0;
}
function start(){score=0;L=0;P.hp=P.max;P.sp=0;P.cd=0;P.hurt=0;load(0);state="play"}
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function boom(x,y,c){for(let i=0;i<10;i++)parts.push({x,y,vx:(Math.random()-.5)*6,vy:(Math.random()-.8)*6,life:25,c})}
function hurtP(d){if(P.hurt<=0){P.hp-=d;P.hurt=60;boom(P.x+20,P.y+20,"#f33")}}
function strike(w,h,ox,dmg){
 const b={x:P.face===1?P.x+P.w:P.x-w,y:P.y-ox,w:w,h:h};
 ens.forEach(e=>{if(e.hp>0&&hit(b,e)){e.hp-=dmg;e.flash=8;boom(e.x+20,e.y+20,"#ff0");if(e.hp<=0)score+=100}});
}
function update(){
 t++;
 if(keys.ArrowRight){P.x+=5;P.face=1;P.walk++}
 if(keys.ArrowLeft){P.x-=5;P.face=-1;P.walk++}
 if(keys.Space&&P.ground){P.vy=-15;P.ground=false}
 const ob=P.y+P.h;P.vy+=0.8;P.y+=P.vy;P.ground=false;
 plats.forEach(p=>{const nb=P.y+P.h;
  if(P.vy>=0&&ob<=p.y+1&&nb>=p.y&&P.x+P.w>p.x&&P.x<p.x+p.width){P.y=p.y-P.h;P.vy=0;P.ground=true}});
 if(P.y>=GY){P.y=GY;P.vy=0;P.ground=true}
 P.x=Math.max(0,Math.min(W-P.w,P.x));
 if(P.atk>0)P.atk--;if(P.cd>0)P.cd--;if(P.hurt>0)P.hurt--;if(P.sp>0)P.sp--;
 if(keys.KeyX&&P.cd<=0){P.atk=10;P.cd=30;strike(50,P.h,0,25)}
 if(keys.KeyC&&P.sp<=0){P.atk=15;P.sp=180;strike(130,P.h+20,20,40)}
 ens.forEach(e=>{
  if(e.hp<=0)return;if(e.flash>0)e.flash--;
  if(e.type==="patrol"){e.x+=e.speed*e.dir;if(e.x<250||e.x>720)e.dir*=-1}
  else{e.timer--;if(e.timer<=0){const d=P.x<e.x?-1:1;shots.push({x:e.x,y:e.y+14,w:14,h:14,vx:5*d});e.timer=90}}
  if(hit(P,e))hurtP(10);
 });
 for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx;
  if(hit(P,s)){hurtP(10);shots.splice(i,1)}else if(s.x<-20||s.x>W+20)shots.splice(i,1)}
 scrolls.forEach(s=>{if(!s.got&&hit(P,s)){s.got=true;score+=50;P.hp=Math.min(P.max,P.hp+10);boom(s.x,s.y,"#fc0")}});
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.3;if(--p.life<=0)parts.splice(i,1)}
 if(P.hp<=0)state="over";
 if(ens.every(e=>e.hp<=0)){
  if(msgTimer===0)msgTimer=90;
  if(--msgTimer===1){if(L<levels.length-1){L++;load(L)}else state="won"}
 }
}
function bar(x,y,v,m,c,w=100){ctx.fillStyle="#444";ctx.fillRect(x,y,w,8);ctx.fillStyle=c;ctx.fillRect(x,y,Math.max(0,v)/m*w,8)}
function txt(s,x,y,size,c="#fff"){ctx.fillStyle=c;ctx.font="bold "+size+"px Arial";ctx.textAlign="center";ctx.fillText(s,x,y);ctx.textAlign="left"}
function drawNinja(){
 if(P.hurt%10>=5)return;
 const x=P.x,y=P.y,f=P.face,leg=P.ground?Math.sin(P.walk*.6)*6:0;
 ctx.fillStyle="#111";ctx.fillRect(x+8,y+14,24,18);               // Körper
 ctx.fillRect(x+10+leg,y+30,8,10);ctx.fillRect(x+22-leg,y+30,8,10); // Beine
 ctx.beginPath();ctx.arc(x+20,y+10,10,0,7);ctx.fill();               // Kopf
 ctx.fillStyle="#d22";ctx.fillRect(x+9,y+6,22,4);                    // Stirnband
 ctx.fillRect(f===1?x+4:x+32,y+8,4,8);                               // Band-Ende
 ctx.fillStyle="#fff";ctx.fillRect(f===1?x+21:x+13,y+11,7,2);        // Augen
 if(P.atk>0){ctx.strokeStyle=P.atk>10?"#ff0":"#ddd";ctx.lineWidth=4;ctx.beginPath();
  const r=P.atk>10?60:35;ctx.arc(x+20,y+22,r,f===1?-1:Math.PI-1,f===1?1:Math.PI+1);ctx.stroke()}
}
function drawEnemy(e){
 const c=e.flash>0?"#fff":(e.type==="patrol"?"#c33":"#e80");
 ctx.fillStyle=c;ctx.fillRect(e.x,e.y+10,e.w,30);
 ctx.beginPath();ctx.arc(e.x+20,e.y+10,11,0,7);ctx.fill();
 ctx.fillStyle="#000";ctx.fillRect(e.x+8,e.y+8,24,5);
 ctx.fillStyle="#ff0";ctx.fillRect(e.x+12,e.y+9,5,3);ctx.fillRect(e.x+23,e.y+9,5,3);
 bar(e.x-30,e.y-14,e.hp,e.max,"#e33");
}
function draw(){
 const l=levels[L],g=ctx.createLinearGradient(0,0,0,400);g.addColorStop(0,l.sky[0]);g.addColorStop(1,l.sky[1]);
 ctx.fillStyle=g;ctx.fillRect(0,0,W,400);
 ctx.fillStyle="#fffbe0";ctx.beginPath();ctx.arc(650,70,32,0,7);ctx.fill();                 // Mond
 ctx.fillStyle="rgba(0,0,0,.35)";                                                           // Berge
 ctx.beginPath();ctx.moveTo(0,380);ctx.lineTo(150,230);ctx.lineTo(300,380);ctx.lineTo(450,200);ctx.lineTo(620,380);ctx.lineTo(740,250);ctx.lineTo(800,380);ctx.fill();
 ctx.fillStyle="#1d5c2e";ctx.fillRect(0,380,W,20);ctx.fillStyle="#2f8f46";ctx.fillRect(0,380,W,5);
 ctx.fillStyle="#7a4a24";plats.forEach(p=>{ctx.fillRect(p.x,p.y,p.width,p.height);ctx.fillStyle="#9a6a3c";ctx.fillRect(p.x,p.y,p.width,3);ctx.fillStyle="#7a4a24"});
 scrolls.forEach(s=>{if(s.got)return;ctx.fillStyle="#f5e6b3";ctx.fillRect(s.x,s.y+Math.sin(t/12)*3,s.w,s.h);ctx.fillStyle="#b22";ctx.fillRect(s.x,s.y+Math.sin(t/12)*3,s.w,3);ctx.fillRect(s.x,s.y+17+Math.sin(t/12)*3,s.w,3)});
 ens.forEach(e=>{if(e.hp>0)drawEnemy(e)});
 ctx.fillStyle="#b4f";shots.forEach(s=>{ctx.save();ctx.translate(s.x+7,s.y+7);ctx.rotate(t/3);ctx.fillRect(-7,-7,14,14);ctx.rotate(.78);ctx.fillRect(-7,-7,14,14);ctx.restore()});
 drawNinja();
 parts.forEach(p=>{ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,4,4)});
 // HUD
 bar(10,10,P.hp,P.max,"#3b8cff",120);bar(10,22,180-P.sp,180,"#fc0",120);
 txt("Level "+l.number+": "+l.name,400,26,18);txt("Punkte: "+score,730,26,18);
 if(msgTimer>0)txt(L<2?"Level geschafft!":"Alle Gegner besiegt!",400,200,34,"#ff0");
 if(state==="start"){ctx.fillStyle="rgba(0,0,0,.7)";ctx.fillRect(0,0,W,400);txt("NINJA ARASHI",400,150,56,"#e33");txt("Besiege alle Gegner in 3 Leveln",400,200,22);txt("Drücke Enter zum Starten",400,260,22,"#ff0")}
 if(state==="over"){ctx.fillStyle="rgba(0,0,0,.7)";ctx.fillRect(0,0,W,400);txt("Game Over",400,180,52,"#e33");txt("Punkte: "+score+" · Enter = Neustart",400,235,22)}
 if(state==="won"){ctx.fillStyle="rgba(0,0,0,.7)";ctx.fillRect(0,0,W,400);txt("Du hast gewonnen! 🏆",400,180,48,"#ff0");txt("Punkte: "+score+" · Enter = Neu spielen",400,235,22)}
}
function loop(){
 if(state==="play")update();
 else if(keys.Enter){keys.Enter=false;start()}
 draw();requestAnimationFrame(loop);
}
load(0);loop();
