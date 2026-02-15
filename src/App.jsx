import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const W = 900, H = 500;
const GROUND_Y = 420;
const SR = 40, BR = 10;
const GW = 80, GH = 120;
const GRAV = 0.6, SPD = 5, JUMP = -12;
const BDAMP = 0.99, BBOUNCE = 0.78, MAX_BV = 13;
const MAX_GRAB = 45;

const COLORS = [
  { name:'Red',     main:'#FF2222', accent:'#AA0000' },
  { name:'Orange',  main:'#FF8C00', accent:'#CC5500' },
  { name:'Yellow',  main:'#FFD700', accent:'#B8860B' },
  { name:'Lime',    main:'#39FF14', accent:'#00AA00' },
  { name:'Green',   main:'#00AA44', accent:'#006622' },
  { name:'Cyan',    main:'#00CED1', accent:'#007B80' },
  { name:'Blue',    main:'#1E90FF', accent:'#0050AA' },
  { name:'Purple',  main:'#9B30FF', accent:'#5500CC' },
  { name:'Magenta', main:'#FF00FF', accent:'#990099' },
  { name:'Pink',    main:'#FF69B4', accent:'#CC1166' },
  { name:'White',   main:'#EEEEEE', accent:'#999999' },
  { name:'Black',   main:'#333333', accent:'#111111' },
];

const EXPLOSION_COLORS = [
  { name:'Fire',     colors:['#FF4500','#FF8C00','#FFD700','#FF2222'] },
  { name:'Ice',      colors:['#00FFFF','#00BFFF','#87CEEB','#FFFFFF'] },
  { name:'Electric', colors:['#FFD700','#FFFF00','#FFFFFF','#FFA500'] },
  { name:'Toxic',    colors:['#39FF14','#00FF7F','#ADFF2F','#00FA9A'] },
  { name:'Galaxy',   colors:['#9B30FF','#FF00FF','#00FFFF','#FFFFFF'] },
  { name:'Inferno',  colors:['#FF0000','#FF4500','#8B0000','#FF8C00'] },
  { name:'Ocean',    colors:['#006994','#00CED1','#40E0D0','#FFFFFF'] },
  { name:'Rose',     colors:['#FF69B4','#FF1493','#FFB6C1','#FFFFFF'] },
];

const AI_CFG = {
  easy:       { spd:0.35, jAcc:0.08, gDist:22, dRange:140, jCD:60 },
  medium:     { spd:0.55, jAcc:0.28, gDist:32, dRange:220, jCD:35 },
  hard:       { spd:0.75, jAcc:0.52, gDist:42, dRange:310, jCD:20 },
  impossible: { spd:0.92, jAcc:0.76, gDist:50, dRange:400, jCD:10 },
};

const mkSlime = x => ({ x, y:GROUND_Y, vx:0, vy:0, onGround:true, hasBall:false, grabFrames:0, grabCooldown:0, goalLineTime:0, penaltyGiven:false, penaltyImmunity:60, targetX:x, decCD:0, lastBallY:0, stuckC:0 });
const mkBall  = () => ({ x:W/2, y:200, vx:0, vy:0, grabbedBy:null, grabAngle:0, grabAV:0 });

// ── EXPLOSION PREVIEW ────────────────────────────────────────────────────────
function ExplosionPreview({ expColor }) {
  const cvRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef(null);
  const reset = useCallback(() => {
    stateRef.current = { phase:'fly', ball:{x:20,y:48,vx:3.2,vy:-0.8}, particles:[], rings:[], timer:0 };
  }, []);
  useEffect(() => {
    reset();
    const cv = cvRef.current; if(!cv) return;
    const ctx = cv.getContext('2d');
    const PW = cv.width, PH = cv.height;
    const spawnExp = (x,y) => {
      const s = stateRef.current; s.particles=[]; s.rings=[];
      for(let i=0;i<40;i++){
        const a=(Math.PI*2*i)/40+Math.random()*0.3, sp=1.5+Math.random()*3.5;
        s.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:0.018+Math.random()*0.022,size:2+Math.random()*4,color:expColor.colors[Math.floor(Math.random()*expColor.colors.length)]});
      }
      for(let i=0;i<3;i++) s.rings.push({x,y,r:4,maxR:28+i*16,life:1,color:expColor.colors[i%expColor.colors.length]});
    };
    const draw = () => {
      ctx.clearRect(0,0,PW,PH);
      ctx.fillStyle='#16182a'; ctx.fillRect(0,0,PW,PH);
      const nx=PW-26,nt=8,nb=PH-16;
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
      for(let x=nx;x<=PW;x+=8){ctx.beginPath();ctx.moveTo(x,nt);ctx.lineTo(x,nb);ctx.stroke();}
      for(let y=nt;y<=nb;y+=8){ctx.beginPath();ctx.moveTo(nx,y);ctx.lineTo(PW,y);ctx.stroke();}
      ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(nx,nt);ctx.lineTo(nx,nb);ctx.stroke();
      ctx.beginPath();ctx.moveTo(nx,nt);ctx.lineTo(PW,nt);ctx.stroke();
      const s = stateRef.current;
      if(s.phase==='fly'){
        s.ball.vy+=0.16; s.ball.x+=s.ball.vx; s.ball.y+=s.ball.vy;
        ctx.shadowBlur=8; ctx.shadowColor='#FFD700'; ctx.fillStyle='#FFD700';
        ctx.beginPath(); ctx.arc(s.ball.x,s.ball.y,6,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
        if(s.ball.x>=nx-4){s.phase='explode'; spawnExp(nx+8,s.ball.y); s.timer=0;}
      }
      if(s.phase==='explode'){
        s.timer++;
        s.rings.forEach(r=>{r.r+=(r.maxR-r.r)*0.12;r.life-=0.025;if(r.life<=0)return;ctx.strokeStyle=r.color+Math.floor(r.life*255).toString(16).padStart(2,'0');ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();});
        s.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.vx*=0.97;p.vy*=0.97;p.life-=p.decay;if(p.life<=0)return;ctx.shadowBlur=5;ctx.shadowColor=p.color;ctx.fillStyle=p.color+Math.floor(p.life*255).toString(16).padStart(2,'0');ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
        if(s.timer>80){s.phase='wait';s.timer=0;}
      }
      if(s.phase==='wait'){s.timer++;if(s.timer>35)reset();}
      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(rafRef.current);
  },[expColor,reset]);
  return <canvas ref={cvRef} width={120} height={80} className="rounded-lg border border-gray-600"/>;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Game() {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const lastT      = useRef(0);
  const keys       = useRef({});
  const gs         = useRef({ left:mkSlime(220), right:mkSlime(680), ball:mkBall() });
  const scoreRef   = useRef({ left:0, right:0 });
  const aiJumpCD   = useRef(0);
  const explosions = useRef([]);

  const [screen,     setScreen]     = useState('splash');
  const [showNameInput, setShowNameInput] = useState(false);
  const [username,   setUsername]   = useState('');
  const [inputVal,   setInputVal]   = useState('');
  const [pMode,      setPMode]      = useState(null);
  const [diff,       setDiff]       = useState(null);
  const [gMode,      setGMode]      = useState(null);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [score,      setScore]      = useState({ left:0, right:0 });
  const [running,    setRunning]    = useState(false);
  const [paused,     setPaused]     = useState(false);
  const [countdown,  setCountdown]  = useState(0);
  const [winner,     setWinner]     = useState(null);
  const [penMsg,     setPenMsg]     = useState('');
  const [goalMsg,    setGoalMsg]    = useState(null);
  const [myColor,    setMyColor]    = useState(COLORS[5]);
  const [oppColor,   setOppColor]   = useState(COLORS[1]);
  const [expColor,   setExpColor]   = useState(EXPLOSION_COLORS[0]);
  const [showStats,  setShowStats]  = useState(false);
  const [hoveredExp, setHoveredExp] = useState(null);
  const [stats,      setStats]      = useState({ 
    played:0, wins:0, losses:0, draws:0, gf:0, ga:0,
    matchHistory: [],
    bestWinStreak: 0, currentWinStreak: 0,
    bestLoseStreak: 0, currentLoseStreak: 0,
    totalMinutesPlayed: 0,
    explosionUsage: {},
    difficultyStats: { easy:{w:0,l:0}, medium:{w:0,l:0}, hard:{w:0,l:0}, impossible:{w:0,l:0} },
    achievements: []
  });
  const [matchStartTime, setMatchStartTime] = useState(null);

  const myColorRef  = useRef(myColor);
  const oppColorRef = useRef(oppColor);
  const expColorRef = useRef(expColor);
  const pModeRef    = useRef(pMode);
  const diffRef     = useRef(diff);
  const pausedRef   = useRef(paused);
  const cdRef       = useRef(countdown);
  const usernameRef = useRef(username);
  useEffect(()=>{ myColorRef.current=myColor; },[myColor]);
  useEffect(()=>{ oppColorRef.current=oppColor; },[oppColor]);
  useEffect(()=>{ expColorRef.current=expColor; },[expColor]);
  useEffect(()=>{ pModeRef.current=pMode; },[pMode]);
  useEffect(()=>{ diffRef.current=diff; },[diff]);
  useEffect(()=>{ pausedRef.current=paused; },[paused]);
  useEffect(()=>{ cdRef.current=countdown; },[countdown]);
  useEffect(()=>{ usernameRef.current=username; },[username]);

  useEffect(()=>{
    const dn=e=>{
      if(e.target.tagName==='INPUT')return;
      if(screen==='splash'&&!showNameInput){
        e.preventDefault();
        setShowNameInput(true);
        return;
      }
      e.preventDefault();
      keys.current[e.key.toLowerCase()]=true;
    };
    const up=e=>{if(e.target.tagName==='INPUT')return;e.preventDefault();keys.current[e.key.toLowerCase()]=false;};
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up);};
  },[screen,showNameInput]);

  useEffect(()=>{
    if(!running||paused||countdown>0)return;
    const id=setInterval(()=>setTimeLeft(t=>{if(t<=1){setRunning(false);return 0;}return t-1;}),1000);
    return()=>clearInterval(id);
  },[running,paused,countdown]);

  useEffect(()=>{
    if(!running&&gMode&&!winner&&timeLeft===0){
      const s=scoreRef.current;
      const rw=s.right>s.left,lw=s.left>s.right,dr=s.left===s.right;
      const name = usernameRef.current || 'You';
      
      const matchDuration = matchStartTime ? Math.floor((Date.now() - matchStartTime) / 60000) : 0;
      const currentDiff = diffRef.current || 'none';
      
      setStats(p=>{
        const newStats = {
          played:p.played+1,
          wins:p.wins+(rw?1:0),
          losses:p.losses+(lw?1:0),
          draws:p.draws+(dr?1:0),
          gf:p.gf+s.right,
          ga:p.ga+s.left,
          totalMinutesPlayed: p.totalMinutesPlayed + matchDuration,
          explosionUsage: p.explosionUsage
        };
        
        if(rw){
          newStats.currentWinStreak = p.currentWinStreak + 1;
          newStats.currentLoseStreak = 0;
          newStats.bestWinStreak = Math.max(p.bestWinStreak, newStats.currentWinStreak);
          newStats.bestLoseStreak = p.bestLoseStreak;
        } else if(lw){
          newStats.currentLoseStreak = p.currentLoseStreak + 1;
          newStats.currentWinStreak = 0;
          newStats.bestLoseStreak = Math.max(p.bestLoseStreak, newStats.currentLoseStreak);
          newStats.bestWinStreak = p.bestWinStreak;
        } else {
          newStats.currentWinStreak = 0;
          newStats.currentLoseStreak = 0;
          newStats.bestWinStreak = p.bestWinStreak;
          newStats.bestLoseStreak = p.bestLoseStreak;
        }
        
        newStats.difficultyStats = {...p.difficultyStats};
        if(pModeRef.current==='single' && currentDiff !== 'none'){
          if(!newStats.difficultyStats[currentDiff]) newStats.difficultyStats[currentDiff] = {w:0,l:0};
          if(rw) newStats.difficultyStats[currentDiff].w++;
          if(lw) newStats.difficultyStats[currentDiff].l++;
        }
        
        newStats.matchHistory = [
          { result: rw?'W':lw?'L':'D', score: `${s.left}-${s.right}`, mode: gMode, diff: currentDiff, date: Date.now() },
          ...(p.matchHistory || [])
        ].slice(0, 10);
        
        newStats.achievements = [...(p.achievements || [])];
        if(!newStats.achievements.includes('first_win') && newStats.wins === 1) newStats.achievements.push('first_win');
        if(!newStats.achievements.includes('perfect_game') && rw && s.left === 0) newStats.achievements.push('perfect_game');
        if(!newStats.achievements.includes('hat_trick') && s.right >= 3) newStats.achievements.push('hat_trick');
        if(!newStats.achievements.includes('comeback_kid') && rw && s.left > s.right - 3) newStats.achievements.push('comeback_kid');
        if(!newStats.achievements.includes('win_streak_5') && newStats.currentWinStreak >= 5) newStats.achievements.push('win_streak_5');
        if(!newStats.achievements.includes('veteran') && newStats.played >= 25) newStats.achievements.push('veteran');
        if(!newStats.achievements.includes('impossible_victor') && rw && currentDiff === 'impossible') newStats.achievements.push('impossible_victor');
        
        return newStats;
      });
      
      setWinner(rw?(pModeRef.current==='single'?name:'Player 2'):lw?(pModeRef.current==='single'?'AI':'Player 1'):'Draw');
    }
  },[running,matchStartTime]);

  useEffect(()=>{
    if(countdown<=0)return;
    const id=setTimeout(()=>setCountdown(c=>c-1),1000);
    return()=>clearTimeout(id);
  },[countdown]);

  const resetPos=useCallback(()=>{
    const newLeft = mkSlime(220);
    const newRight = mkSlime(680);
    const newBall = mkBall();
    
    newBall.frozen = true;
    
    gs.current.left = newLeft;
    gs.current.right = newRight;
    gs.current.ball = newBall;
    
    aiJumpCD.current=0; 
    explosions.current=[];
    setGoalMsg(null);
    setPenMsg('');
    
    setTimeout(() => {
      if(gs.current.ball) gs.current.ball.frozen = false;
    }, 1000);
  },[]);

  const resetGame=useCallback(()=>{ resetPos(); setScore({left:0,right:0}); scoreRef.current={left:0,right:0}; setWinner(null); },[resetPos]);

  const startGame=useCallback(mode=>{
    const times={'1min':60,'2min':120,'4min':240,'8min':480,'worldcup':300};
    resetGame(); setGMode(mode); setTimeLeft(times[mode]); setPaused(false); setCountdown(0); setRunning(true);
    setMatchStartTime(Date.now());
    
    setStats(p=>({
      ...p,
      explosionUsage: {
        ...p.explosionUsage,
        [expColorRef.current.name]: (p.explosionUsage[expColorRef.current.name] || 0) + 1
      }
    }));
  },[resetGame]);

  const showGoalMsg = useCallback((scorer, color) => {
    setGoalMsg({ scorer, color });
    setTimeout(() => setGoalMsg(null), 2000);
  }, []);

  const spawnExplosion=useCallback((x,y)=>{
    const col=expColorRef.current;
    const particles=[], rings=[];
    for(let i=0;i<60;i++){
      const a=(Math.PI*2*i)/60+Math.random()*0.3,sp=2+Math.random()*6;
      particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:0.012+Math.random()*0.018,size:3+Math.random()*6,color:col.colors[Math.floor(Math.random()*col.colors.length)]});
    }
    for(let i=0;i<4;i++) rings.push({x,y,r:8,maxR:60+i*30,life:1,speed:0.14-i*0.02,color:col.colors[i%col.colors.length]});
    explosions.current.push({particles,rings,flash:1,done:false});
  },[]);

  const goal=useCallback((side,bx,by)=>{
    spawnExplosion(bx,by);
    const name = usernameRef.current || 'You';
    const pm = pModeRef.current;
    if(side==='right'){
      const scorer = pm==='single' ? name : 'Player 2';
      const col = myColorRef.current.main;
      showGoalMsg(scorer, col);
    } else {
      const scorer = pm==='single' ? 'AI' : 'Player 1';
      const col = pm==='single' ? oppColorRef.current.main : myColorRef.current.main;
      showGoalMsg(scorer, col);
    }
    setTimeout(()=>{
      if(side==='right') setScore(p=>{const n={...p,right:p.right+1};scoreRef.current=n;return n;});
      else               setScore(p=>{const n={...p,left:p.left+1}; scoreRef.current=n;return n;});
      resetPos();
    },1200);
  },[resetPos,spawnExplosion,showGoalMsg]);

  const penalty=useCallback((side,bx,by)=>{
    spawnExplosion(bx,by);
    setPenMsg('⚠️ Goalie Penalty! Opponent scores!');
    setTimeout(()=>{
      if(side==='right') setScore(p=>{const n={...p,right:p.right+1};scoreRef.current=n;return n;});
      else               setScore(p=>{const n={...p,left:p.left+1}; scoreRef.current=n;return n;});
      resetPos();
      setPenMsg('');
    },1200);
  },[resetPos,spawnExplosion]);

  const doGrab=(slime,ball,name,want)=>{
    if(ball.frozen) return;
    if(slime.grabCooldown>0)slime.grabCooldown--;
    if(ball.grabbedBy===name){
      slime.grabFrames++;
      if(slime.grabFrames>=MAX_GRAB||!want)releaseBall(slime,ball,name,slime.grabFrames>=MAX_GRAB);
    }else if(ball.grabbedBy===null&&want&&slime.grabCooldown===0){
      const dx=ball.x-slime.x,dy=ball.y-slime.y;
      if(Math.sqrt(dx*dx+dy*dy)<SR+BR+8){ball.grabbedBy=name;ball.grabAngle=-Math.PI/2;ball.grabAV=0;slime.hasBall=true;slime.grabFrames=0;}
    }
  };

  const releaseBall=(slime,ball,name,forced)=>{
    const rs=Math.abs(ball.grabAV)*18;
    const tb=Math.abs(slime.vx)>0.5?slime.vx*1.8:0;
    ball.vx=slime.vx*1.4+Math.cos(ball.grabAngle)*(3+rs)+tb;
    ball.vy=slime.vy-2+Math.sin(ball.grabAngle)*rs*0.25;
    if(forced){ball.vx+=slime.vx*0.4;ball.vy-=2;}
    const sp=Math.sqrt(ball.vx**2+ball.vy**2);
    if(sp>MAX_BV){ball.vx*=MAX_BV/sp;ball.vy*=MAX_BV/sp;}
    ball.grabbedBy=null;ball.grabAngle=0;ball.grabAV=0;
    slime.hasBall=false;slime.grabFrames=0;slime.grabCooldown=forced?35:22;
  };

  const trySteal=(thief,holder,ball,holderName)=>{
    if(ball.grabbedBy!==holderName)return;
    const dx=ball.x-thief.x,dy=ball.y-thief.y;
    if(Math.sqrt(dx*dx+dy*dy)>SR+BR+6)return;
    if(Math.abs(holder.vx)<1.4&&Math.sqrt(thief.vx**2+thief.vy**2)>2.0){
      const a=Math.atan2(dy,dx);
      ball.vx=Math.cos(a)*9+thief.vx*0.7; ball.vy=Math.sin(a)*9+thief.vy*0.4-3;
      ball.grabbedBy=null;ball.grabAngle=0;ball.grabAV=0;
      holder.hasBall=false;holder.grabFrames=0;holder.grabCooldown=38;thief.grabCooldown=30;
    }
  };

  const runAI=useCallback(cfg=>{
    const{left:ai,ball}=gs.current;
    if(aiJumpCD.current>0)aiJumpCD.current--;
    if(ai.decCD>0)ai.decCD--;
    const gr=ai.onGround,db=Math.abs(ai.x-ball.x),bl=ball.vx<-1.5,oh=ball.x<W*0.35,bh=GROUND_Y-ball.y;
    const mv=Math.abs(ball.y-ai.lastBallY)>3||Math.abs(ball.vx)>1.5;
    ai.stuckC=mv?0:ai.stuckC+1; ai.lastBallY=ball.y;
    let st='CHASE';
    if(ai.hasBall&&ball.grabbedBy==='left')st='ATTACK';
    else if(oh||(bl&&ball.x<W*0.55))st='DEFEND';
    let wg=false;
    if(st==='ATTACK'){
      if(ball.x<W*0.38){ai.vx=SPD*cfg.spd;wg=false;}
      else{
        ai.vx=ai.x<W-GW-85?SPD*cfg.spd:SPD*cfg.spd*0.4;
        const gd=ai.x>W*0.62,lw=ball.y>GROUND_Y-85; wg=!(gd&&lw)&&ball.x>=W*0.42;
        if(ai.x>W*0.72&&ball.y<GROUND_Y-40&&gr&&aiJumpCD.current===0){ai.vy=JUMP;aiJumpCD.current=cfg.jCD;}
      }
    }else if(st==='DEFEND'){
      const dx=Math.max(ball.x*0.55,GW+SR+20);
      ai.vx=Math.abs(dx-ai.x)>12?Math.sign(dx-ai.x)*SPD*cfg.spd:0;
      if(gr&&aiJumpCD.current===0&&db<110&&bh>25&&(Math.abs(ball.vx)>2||Math.abs(ball.vy)>2))
        if(Math.random()<cfg.jAcc){ai.vy=JUMP;aiJumpCD.current=cfg.jCD;}
      wg=db<cfg.gDist&&Math.abs(ball.y-ai.y)<cfg.gDist;
    }else{
      if(ai.decCD<=0){
        let nt=ball.x-35;
        if(bh>55&&db<160)nt=ball.x-48;else if(bh<25&&db<90)nt=ball.x-22;
        if(Math.abs(nt-ai.targetX)>18){ai.targetX=nt;ai.decCD=10;}
      }
      const d=ai.targetX-ai.x,ad=Math.abs(d);
      ai.vx=ad>12?Math.sign(d)*SPD*cfg.spd*Math.min(ad/50,1):0;
      if(gr&&aiJumpCD.current===0&&db<95&&bh>28)
        if(Math.random()<cfg.jAcc){ai.vy=JUMP;aiJumpCD.current=cfg.jCD;}
      wg=db<cfg.gDist&&Math.abs(ball.y-ai.y)<cfg.gDist&&gr;
      if(ai.stuckC>35){if(gr&&aiJumpCD.current===0){ai.vy=JUMP;aiJumpCD.current=cfg.jCD;}ai.stuckC=0;}
    }
    doGrab(ai,gs.current.ball,'left',wg);
  },[]);

  const tick=useCallback(()=>{
    const{left,right,ball}=gs.current; const k=keys.current;
    if(pModeRef.current==='multi'){
      left.vx=k['a']?-SPD:k['d']?SPD:0;
      if(k['w']&&left.onGround&&!left.hasBall)left.vy=JUMP;
      doGrab(left,ball,'left',!!k['s']);
      right.vx=k['j']?-SPD:k['l']?SPD:0;
      if(k['i']&&right.onGround&&!right.hasBall)right.vy=JUMP;
      doGrab(right,ball,'right',!!k['k']);
    }else{
      runAI(AI_CFG[diffRef.current]||AI_CFG.medium);
      right.vx=(k['a']||k['arrowleft'])?-SPD:(k['d']||k['arrowright'])?SPD:0;
      if((k['w']||k['arrowup'])&&right.onGround&&!right.hasBall)right.vy=JUMP;
      doGrab(right,ball,'right',!!(k['s']||k['arrowdown']));
    }
    if(ball.grabbedBy==='left')trySteal(right,left,ball,'left');
    if(ball.grabbedBy==='right')trySteal(left,right,ball,'right');
    [left,right].forEach((s,i)=>{
      s.vy+=GRAV; s.x+=s.vx; s.y+=s.vy;
      s.x=Math.max(SR,Math.min(W-SR,s.x));
      if(s.y>=GROUND_Y){s.y=GROUND_Y;s.vy=0;s.onGround=true;}else s.onGround=false;
      if(s.y<SR){s.y=SR;s.vy=0;}
      
      if(s.penaltyImmunity>0) s.penaltyImmunity--;
      
      const il=i===0,cp=il?s.x<GW:s.x>W-GW;
      if(cp && s.penaltyImmunity===0){
        s.goalLineTime=(s.goalLineTime||0)+1/60;
        if(s.goalLineTime>=1&&!s.penaltyGiven){
          s.penaltyGiven=true;
          penalty(il?'right':'left',ball.x,ball.y);
        }
      } else {
        s.goalLineTime=0;
        s.penaltyGiven=false;
      }
    });
    if(ball.grabbedBy){
      const h=ball.grabbedBy==='left'?left:right,dir=ball.grabbedBy==='left'?1:-1;
      ball.grabAV+=-h.vx*0.008*dir; ball.grabAV*=0.85; ball.grabAngle+=ball.grabAV;
      if(ball.grabbedBy==='left'){ball.grabAngle=Math.max(-Math.PI/2,Math.min(Math.PI/2,ball.grabAngle));}
      else{while(ball.grabAngle<0)ball.grabAngle+=Math.PI*2;while(ball.grabAngle>Math.PI*2)ball.grabAngle-=Math.PI*2;if(ball.grabAngle<Math.PI/2){ball.grabAngle=Math.PI/2;ball.grabAV=0;}if(ball.grabAngle>3*Math.PI/2){ball.grabAngle=3*Math.PI/2;ball.grabAV=0;}}
      const hd=SR+BR-4;
      ball.x=h.x+Math.cos(ball.grabAngle)*hd; ball.y=h.y+Math.sin(ball.grabAngle)*hd;
      ball.vx=h.vx; ball.vy=h.vy;
    }else{ball.vy+=GRAV;ball.vx*=BDAMP;ball.x+=ball.vx;ball.y+=ball.vy;}
    if(ball.x<BR){ball.x=BR;ball.vx=Math.abs(ball.vx)*BBOUNCE;}
    if(ball.x>W-BR){ball.x=W-BR;ball.vx=-Math.abs(ball.vx)*BBOUNCE;}
    if(ball.y<BR){ball.y=BR;ball.vy=Math.abs(ball.vy)*BBOUNCE;}
    if(ball.y>GROUND_Y-BR){ball.y=GROUND_Y-BR;ball.vy=-Math.abs(ball.vy)*BBOUNCE;}
    if(ball.x<=BR&&ball.y>GROUND_Y-GH){goal('right',ball.x,ball.y);return;}
    if(ball.x>=W-BR&&ball.y>GROUND_Y-GH){goal('left',ball.x,ball.y);return;}
    if(!ball.grabbedBy){
      [left,right].forEach(s=>{
        const dx=ball.x-s.x,dy=ball.y-s.y,dist=Math.sqrt(dx*dx+dy*dy),minD=SR+BR;
        if(dist<minD&&dist>0.001){
          const nx=dx/dist,ny=dy/dist;
          ball.x=s.x+nx*minD; ball.y=s.y+ny*minD;
          const rv=ball.vx-s.vx,ry=ball.vy-s.vy,dot=rv*nx+ry*ny;
          if(dot<0){ball.vx-=1.7*dot*nx;ball.vy-=1.7*dot*ny;ball.vx+=s.vx*0.25;ball.vy+=s.vy*0.25;}
          const sp=Math.sqrt(ball.vx**2+ball.vy**2);
          if(sp>MAX_BV){ball.vx*=MAX_BV/sp;ball.vy*=MAX_BV/sp;}
          ball.x=Math.max(BR,Math.min(W-BR,ball.x)); ball.y=Math.max(BR,Math.min(GROUND_Y-BR,ball.y));
        }
      });
    }
    explosions.current.forEach(e=>{
      e.flash=Math.max(0,e.flash-0.06);
      e.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.vx*=0.97;p.vy*=0.97;p.life-=p.decay;});
      e.rings.forEach(r=>{r.r+=(r.maxR-r.r)*r.speed;r.life-=0.022;});
      if(e.particles.every(p=>p.life<=0)&&e.rings.every(r=>r.life<=0))e.done=true;
    });
    explosions.current=explosions.current.filter(e=>!e.done);
  },[runAI,goal,penalty]);

  const render=useCallback(()=>{
    const cv=canvasRef.current; if(!cv)return;
    const ctx=cv.getContext('2d');
    const{left,right,ball}=gs.current;
    ctx.shadowBlur=0;ctx.shadowColor='transparent';ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
    ctx.fillStyle='#16182a';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(100,100,160,0.1)';ctx.lineWidth=1;
    for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.fillStyle='#22243a';ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
    ctx.strokeStyle='rgba(160,160,210,0.35)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,GROUND_Y);ctx.lineTo(W,GROUND_Y);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.13)';ctx.lineWidth=2;ctx.setLineDash([12,8]);
    ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,GROUND_Y);ctx.stroke();
    ctx.setLineDash([]);
    const lCol=pModeRef.current==='multi'?myColorRef.current:oppColorRef.current;
    const rCol=myColorRef.current;
    const drawGoal=(side,col)=>{
      const nx=side==='left'?0:W-GW/2,ex=side==='left'?GW/2:W,post=side==='left'?GW/2:W-GW/2;
      ctx.strokeStyle=col.main+'44';ctx.lineWidth=1.5;
      for(let x=nx;x<=ex;x+=10){ctx.beginPath();ctx.moveTo(x,GROUND_Y-GH);ctx.lineTo(x,GROUND_Y);ctx.stroke();}
      for(let y=GROUND_Y-GH;y<=GROUND_Y;y+=10){ctx.beginPath();ctx.moveTo(nx,y);ctx.lineTo(ex,y);ctx.stroke();}
      ctx.strokeStyle='#fff';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(nx,GROUND_Y);ctx.lineTo(ex,GROUND_Y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(post,GROUND_Y);ctx.lineTo(post,GROUND_Y-GH);ctx.stroke();
    };
    drawGoal('left',lCol);drawGoal('right',rCol);
    const drawBar=(s,side)=>{if(!s.goalLineTime||s.goalLineTime<=0)return;const p=Math.min(s.goalLineTime,1);ctx.fillStyle=p>0.6?'#FF4444':'#FFD700';ctx.fillRect(side==='left'?0:W-GW,GROUND_Y+8,GW*p,5);};
    drawBar(left,'left');drawBar(right,'right');
    const drawRing=(s,name)=>{if(ball.grabbedBy!==name)return;const p=1-s.grabFrames/MAX_GRAB;ctx.strokeStyle=p>0.4?`rgba(0,220,255,${0.5+p*0.5})`:'rgba(255,80,80,0.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,SR+8,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();};
    drawRing(left,'left');drawRing(right,'right');
    explosions.current.forEach(e=>{
      if(e.flash>0){ctx.fillStyle=`rgba(255,255,255,${e.flash*0.35})`;ctx.fillRect(0,0,W,H);}
      e.rings.forEach(r=>{if(r.life<=0)return;ctx.strokeStyle=r.color+Math.floor(r.life*255).toString(16).padStart(2,'0');ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();});
      e.particles.forEach(p=>{if(p.life<=0)return;ctx.shadowBlur=8;ctx.shadowColor=p.color;ctx.fillStyle=p.color+Math.floor(p.life*255).toString(16).padStart(2,'0');ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.shadowColor='transparent';});
    });
    const drawSlime=(s,lr,col)=>{
      ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(s.x,GROUND_Y+4,SR*0.82,7,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=col.main;ctx.beginPath();ctx.arc(s.x,s.y,SR,Math.PI,0,false);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.18)';ctx.beginPath();ctx.arc(s.x,s.y,SR*0.72,Math.PI,Math.PI*1.82,false);ctx.closePath();ctx.fill();
      ctx.strokeStyle=col.accent;ctx.lineWidth=4.5;ctx.lineCap='round';ctx.beginPath();ctx.arc(s.x,s.y,SR*0.58,Math.PI+0.38,Math.PI*2-0.38,false);ctx.stroke();ctx.lineCap='butt';ctx.lineWidth=1;
      const ex=lr?s.x-SR*0.3:s.x+SR*0.3,ey=s.y-SR*0.42;
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey,5.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ex+(lr?-1.5:1.5),ey,2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(ex+(lr?-2.5:1),ey-1.5,1.2,0,Math.PI*2);ctx.fill();
    };
    drawSlime(left,false,lCol);drawSlime(right,true,rCol);
    ctx.shadowBlur=14;ctx.shadowColor='#FFD700';
    const bg=ctx.createRadialGradient(ball.x-3,ball.y-3,1,ball.x,ball.y,BR);
    bg.addColorStop(0,'#FFF176');bg.addColorStop(1,'#FFB300');
    ctx.fillStyle=bg;ctx.beginPath();ctx.arc(ball.x,ball.y,BR,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.shadowColor='transparent';
  },[]);

  const loop=useCallback(now=>{
    if(now-lastT.current>=1000/60){
      if(!pausedRef.current&&cdRef.current===0)tick();
      render();lastT.current=now;
    }
    rafRef.current=requestAnimationFrame(loop);
  },[tick,render]);

  useEffect(()=>{
    if(running){rafRef.current=requestAnimationFrame(loop);}
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[running,loop]);

  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const name = username || 'You';

  const Credits=()=>(
    <div className="flex items-center justify-center gap-2 select-none">
      <span className="text-sm text-gray-500">Built by</span>
      <span className="text-sm font-black tracking-widest" style={{background:'linear-gradient(135deg,#cc44ff,#aa00ff,#dd88ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 6px #cc44ff)'}}>nog</span>
      <span className="text-gray-600 text-sm">&amp;</span>
      <span className="text-sm font-black" style={{background:'linear-gradient(135deg,#ff8c00,#ff6b35,#ffb347)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 5px #ff6b35)'}}>Claude Sonnet 4</span>
    </div>
  );

  const ACHIEVEMENTS = {
    first_win: { icon: '🏆', name: 'First Victory', desc: 'Win your first match' },
    perfect_game: { icon: '🎯', name: 'Clean Sheet', desc: 'Win without conceding a goal' },
    hat_trick: { icon: '⚽', name: 'Hat Trick', desc: 'Score 3+ goals in a match' },
    comeback_kid: { icon: '💪', name: 'Comeback Kid', desc: 'Win after being down' },
    win_streak_5: { icon: '🔥', name: 'On Fire', desc: 'Win 5 games in a row' },
    veteran: { icon: '🎖️', name: 'Veteran', desc: 'Play 25+ matches' },
    impossible_victor: { icon: '💀', name: 'Giant Slayer', desc: 'Defeat Impossible AI' }
  };

  if(showStats){
    const wr=stats.played>0?((stats.wins/stats.played)*100).toFixed(1):0;
    const gd=stats.gf-stats.ga;
    const favExp = Object.entries(stats.explosionUsage || {}).sort((a,b)=>b[1]-a[1])[0];
    return(
      <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{background:'linear-gradient(135deg,#0d0d2b,#1a0a3e,#0a1628)'}}>
        <div className="bg-gray-800 p-8 rounded-2xl border-2 border-yellow-500 max-w-4xl w-full max-h-screen overflow-y-auto">
          <h2 className="text-4xl font-black text-yellow-400 text-center mb-2">📊 Career Stats</h2>
          <p className="text-center text-gray-400 mb-6">{name}'s complete record</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-900 p-4 rounded-xl border border-blue-500 text-center"><p className="text-gray-400 text-xs mb-1">Played</p><p className="text-3xl font-bold text-blue-400">{stats.played}</p></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-green-500 text-center"><p className="text-gray-400 text-xs mb-1">Win Rate</p><p className="text-3xl font-bold text-green-400">{wr}%</p></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-purple-500 text-center"><p className="text-gray-400 text-xs mb-1">Goal Diff</p><p className="text-3xl font-bold text-purple-400">{gd>0?'+':''}{gd}</p></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-cyan-500 text-center"><p className="text-gray-400 text-xs mb-1">Time Played</p><p className="text-3xl font-bold text-cyan-400">{stats.totalMinutesPlayed}m</p></div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900 p-4 rounded-xl border border-green-600 text-center"><p className="text-xs text-gray-400">Wins</p><p className="text-3xl font-bold text-green-400">{stats.wins}</p></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-red-600 text-center"><p className="text-xs text-gray-400">Losses</p><p className="text-3xl font-bold text-red-400">{stats.losses}</p></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-yellow-600 text-center"><p className="text-xs text-gray-400">Draws</p><p className="text-3xl font-bold text-yellow-400">{stats.draws}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-900 p-4 rounded-xl border border-orange-500 text-center"><p className="text-xs text-gray-400 mb-1">Best Win Streak</p><p className="text-2xl font-bold text-orange-400">🔥 {stats.bestWinStreak}</p></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-blue-500 text-center"><p className="text-xs text-gray-400 mb-1">Current Streak</p><p className="text-2xl font-bold text-blue-400">{stats.currentWinStreak>0?`🔥 ${stats.currentWinStreak}W`:stats.currentLoseStreak>0?`❄️ ${stats.currentLoseStreak}L`:'—'}</p></div>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-center mb-3 text-gray-300">📈 Difficulty Record</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['easy','medium','hard','impossible'].map(d=>{
                const ds=stats.difficultyStats[d]||{w:0,l:0};
                const total=ds.w+ds.l;
                const winRate=total>0?((ds.w/total)*100).toFixed(0):'0';
                return(
                  <div key={d} className="bg-black bg-opacity-40 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400 capitalize mb-1">{d}</p>
                    <p className="text-lg font-bold" style={{color:d==='easy'?'#66bb6a':d==='medium'?'#ffa726':d==='hard'?'#ef5350':'#ab47bc'}}>{ds.w}-{ds.l}</p>
                    <p className="text-xs text-gray-500">{winRate}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {favExp && (
            <div className="bg-gray-900 p-4 rounded-xl border border-yellow-500 mb-6 text-center">
              <p className="text-xs text-gray-400 mb-1">💥 Favorite Explosion</p>
              <p className="text-xl font-bold text-yellow-400">{favExp[0]}</p>
              <p className="text-sm text-gray-500">Used {favExp[1]} times</p>
            </div>
          )}

          <div className="bg-gray-900 p-4 rounded-xl border border-purple-500 mb-6">
            <h3 className="text-lg font-bold text-center mb-3 text-purple-400">🏆 Achievements ({(stats.achievements||[]).length}/{Object.keys(ACHIEVEMENTS).length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(ACHIEVEMENTS).map(([id,ach])=>{
                const unlocked=(stats.achievements||[]).includes(id);
                return(
                  <div key={id} className={`p-3 rounded-lg text-center ${unlocked?'bg-yellow-900 bg-opacity-30 border border-yellow-700':'bg-black bg-opacity-40 border border-gray-700'}`}>
                    <p className="text-2xl mb-1">{unlocked?ach.icon:'🔒'}</p>
                    <p className={`text-xs font-bold ${unlocked?'text-yellow-400':'text-gray-600'}`}>{ach.name}</p>
                    <p className="text-xs text-gray-500">{ach.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-cyan-500 mb-6">
            <h3 className="text-lg font-bold text-center mb-3 text-cyan-400">📜 Recent Matches</h3>
            {(stats.matchHistory||[]).length>0 ? (
              <div className="space-y-2">
                {stats.matchHistory.map((m,i)=>(
                  <div key={i} className="bg-black bg-opacity-40 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${m.result==='W'?'text-green-400':m.result==='L'?'text-red-400':'text-yellow-400'}`}>{m.result}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{m.score}</p>
                        <p className="text-xs text-gray-500">{m.mode} · {m.diff!=='none'?m.diff:'multiplayer'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm">No matches yet</p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={()=>{if(window.confirm('Reset all stats? This cannot be undone!'))setStats({played:0,wins:0,losses:0,draws:0,gf:0,ga:0,matchHistory:[],bestWinStreak:0,currentWinStreak:0,bestLoseStreak:0,currentLoseStreak:0,totalMinutesPlayed:0,explosionUsage:{},difficultyStats:{easy:{w:0,l:0},medium:{w:0,l:0},hard:{w:0,l:0},impossible:{w:0,l:0}},achievements:[]});}} className="flex-1 py-3 bg-red-700 hover:bg-red-600 rounded-xl font-bold transition-all">Reset All</button>
            <button onClick={()=>setShowStats(false)} className="flex-1 py-3 bg-blue-700 hover:bg-blue-600 rounded-xl font-bold transition-all">Back</button>
          </div>
        </div>
      </div>
    );
  }

  if(screen==='splash')return(
    <div className="flex flex-col items-center justify-center min-h-screen select-none" style={{background:'linear-gradient(135deg,#0d0d2b,#1a0a3e,#0a1628)'}}>
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <svg width="700" height="500" viewBox="0 0 700 500">
          <ellipse cx="350" cy="420" rx="220" ry="28" fill="#00CED1"/>
          <path d="M130 420 Q130 220 350 220 Q570 220 570 420 Z" fill="#00CED1" opacity="0.7"/>
          <circle cx="420" cy="280" r="28" fill="white"/>
          <circle cx="427" cy="283" r="14" fill="black"/>
          <circle cx="465" cy="345" r="44" fill="#FFD700" opacity="0.5"/>
        </svg>
      </div>
      <div className="relative z-10 text-center w-full max-w-md px-6">
        <p className="text-gray-400 tracking-widest text-sm uppercase mb-2">⚽ The Classic Returns ⚽</p>
        <h1 className="text-6xl font-black mb-1" style={{background:'linear-gradient(135deg,#00f5ff,#b347d9,#ff6b35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Slime Soccer</h1>
        <h2 className="text-4xl font-black mb-16" style={{background:'linear-gradient(135deg,#ff6b35,#ff3cac)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Sideswipe</h2>

        {!showNameInput ? (
          <div onClick={()=>setShowNameInput(true)} className="cursor-pointer">
            <div className="animate-bounce mb-8">
              <p className="text-3xl font-bold text-yellow-400 mb-2">CLICK TO PLAY</p>
              <p className="text-xl text-gray-300">⚽</p>
            </div>
          </div>
        ) : (
          <div className="bg-black bg-opacity-50 rounded-2xl p-6 border border-gray-700 mb-4" onClick={e=>e.stopPropagation()}>
            <p className="text-gray-300 font-bold mb-3 text-lg">Enter your name to play</p>
            <input
              type="text"
              maxLength={16}
              value={inputVal}
              onChange={e=>setInputVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&inputVal.trim()){setUsername(inputVal.trim());setScreen('garage');}}}
              placeholder="Your name..."
              className="w-full px-4 py-3 rounded-xl text-white text-lg font-bold text-center outline-none border-2 border-gray-600 focus:border-cyan-400 transition-all mb-4"
              style={{background:'rgba(255,255,255,0.07)'}}
              autoFocus
            />
            <button
              onClick={()=>{ if(inputVal.trim()){setUsername(inputVal.trim());setScreen('garage');}}}
              disabled={!inputVal.trim()}
              className="w-full py-3 rounded-xl font-black text-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{background:'linear-gradient(135deg,#00f5ff,#b347d9)'}}
            >
              Let's Play ▶
            </button>
            <p className="text-gray-600 text-xs mt-2">Press Enter or click to continue</p>
          </div>
        )}
      </div>
      <div className="absolute bottom-6 text-center">
        <p className="text-gray-500 text-sm mb-2">Inspired by Rocket League</p>
        <Credits/>
      </div>
    </div>
  );

  if(screen==='garage')return(
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{background:'linear-gradient(135deg,#0d0d2b,#1a0a3e,#0a1628)'}}>
      <div className="rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-700 overflow-hidden" style={{background:'rgba(20,20,40,0.97)'}}>
        <div className="p-5 text-center border-b border-gray-700" style={{background:'rgba(0,0,0,0.3)'}}>
          <h2 className="text-4xl font-black" style={{background:'linear-gradient(135deg,#00f5ff,#b347d9,#ff6b35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>🏎️ GARAGE</h2>
          <p className="text-gray-400 text-sm mt-1">Welcome, <span style={{color:myColor.main}} className="font-black">{name}</span>!</p>
        </div>
        <div className="grid grid-cols-3 border-b border-gray-700">
          <div className="p-5 border-r border-gray-700">
            <h3 className="text-base font-bold mb-3 text-center text-cyan-400">YOUR SLIME</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {COLORS.map(c=><button key={c.name} onClick={()=>setMyColor(c)} className="w-11 h-11 rounded-lg transition-all hover:scale-110" style={{backgroundColor:c.main,border:myColor.name===c.name?'3px solid #00f5ff':'3px solid rgba(255,255,255,0.1)',boxShadow:myColor.name===c.name?`0 0 10px ${c.main}`:'none'}}/>)}
            </div>
            <div className="text-center py-1 rounded-lg bg-black bg-opacity-40"><p className="text-xs text-gray-400">Selected</p><p className="font-bold text-sm" style={{color:myColor.main}}>{myColor.name}</p></div>
          </div>
          <div className="p-5 flex flex-col items-center justify-center bg-black bg-opacity-20">
            <div className="rounded-xl overflow-hidden mb-3 border border-gray-600" style={{background:'linear-gradient(to bottom,#1a1a2e,#22243a)'}}>
              <svg width="180" height="120" viewBox="0 0 180 120">
                <rect x="0" y="98" width="180" height="22" fill="#22243a"/>
                <line x1="0" y1="98" x2="180" y2="98" stroke="rgba(150,150,200,0.3)" strokeWidth="2"/>
                <ellipse cx="90" cy="103" rx="36" ry="7" fill="rgba(0,0,0,0.3)"/>
                <path d="M52 98 A38 38 0 0 1 128 98 Z" fill={myColor.main}/>
                <path d="M60 93 A28 28 0 0 1 108 83" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeLinecap="round"/>
                <path d="M64 90 A22 22 0 0 1 116 90" fill="none" stroke={myColor.accent} strokeWidth="4" strokeLinecap="round"/>
                <circle cx="105" cy="76" r="5.5" fill="white"/>
                <circle cx="107" cy="77" r="2.8" fill="#111"/>
                <circle cx="105" cy="75" r="1.1" fill="rgba(255,255,255,0.8)"/>
                <circle cx="140" cy="90" r="9" fill="#FFB300"/>
                <circle cx="137" cy="87" r="3" fill="#FFF176" opacity="0.7"/>
              </svg>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1"><div className="w-3 h-3 rounded-full border border-white" style={{backgroundColor:myColor.main}}/><span className="font-bold text-xs">{myColor.name}</span></div>
              <p className="text-xs text-gray-500">vs</p>
              <div className="flex items-center justify-center gap-2 mt-1"><div className="w-3 h-3 rounded-full border border-white" style={{backgroundColor:oppColor.main}}/><span className="font-bold text-xs" style={{color:oppColor.main}}>{oppColor.name}</span></div>
            </div>
          </div>
          <div className="p-5 border-l border-gray-700">
            <h3 className="text-base font-bold mb-3 text-center text-orange-400">OPPONENT</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {COLORS.map(c=><button key={c.name} onClick={()=>setOppColor(c)} className="w-11 h-11 rounded-lg transition-all hover:scale-110" style={{backgroundColor:c.main,border:oppColor.name===c.name?'3px solid #ff6b35':'3px solid rgba(255,255,255,0.1)',boxShadow:oppColor.name===c.name?`0 0 10px ${c.main}`:'none'}}/>)}
            </div>
            <div className="text-center py-1 rounded-lg bg-black bg-opacity-40"><p className="text-xs text-gray-400">Selected</p><p className="font-bold text-sm" style={{color:oppColor.main}}>{oppColor.name}</p></div>
          </div>
        </div>
        <div className="p-5 border-b border-gray-700">
          <h3 className="text-lg font-black mb-1 text-center" style={{background:'linear-gradient(135deg,#FFD700,#FF6B35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>💥 GOAL EXPLOSION</h3>
          <p className="text-xs text-gray-400 text-center mb-4">Hover to preview · Click to select</p>
          <div className="grid grid-cols-4 gap-3">
            {EXPLOSION_COLORS.map(ec=>(
              <div key={ec.name} onMouseEnter={()=>setHoveredExp(ec.name)} onMouseLeave={()=>setHoveredExp(null)} onClick={()=>setExpColor(ec)}
                className="cursor-pointer rounded-xl border-2 p-2 transition-all hover:scale-105"
                style={{borderColor:expColor.name===ec.name?'#FFD700':'rgba(255,255,255,0.1)',background:expColor.name===ec.name?'rgba(255,215,0,0.08)':'rgba(0,0,0,0.3)',boxShadow:expColor.name===ec.name?'0 0 14px rgba(255,215,0,0.4)':'none'}}>
                <div className="flex gap-1 justify-center mb-2">{ec.colors.map((c,i)=><div key={i} className="w-4 h-4 rounded-full border border-gray-600" style={{backgroundColor:c}}/>)}</div>
                <div className="flex justify-center mb-2" style={{height:80}}>
                  {hoveredExp===ec.name?<ExplosionPreview expColor={ec}/>:<div className="w-full rounded-lg border border-gray-700 flex items-center justify-center text-gray-600 text-xs" style={{background:'rgba(0,0,0,0.4)'}}>hover</div>}
                </div>
                <p className="text-xs font-bold text-center" style={{color:expColor.name===ec.name?'#FFD700':'#aaa'}}>{ec.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-black bg-opacity-30">
          <button onClick={()=>setScreen('menu')} className="w-full py-3 rounded-xl font-bold text-lg transition-all hover:scale-105" style={{background:'linear-gradient(135deg,#00b09b,#1565c0)'}}>✓ Continue to Menu</button>
        </div>
      </div>
    </div>
  );

  return(
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{background:'linear-gradient(135deg,#0d0d2b,#1a0a3e,#0a1628)'}}>
      {!running&&!winner&&!pMode&&screen==='menu'&&(
        <div className="text-center">
          <h1 className="text-5xl font-black mb-1" style={{background:'linear-gradient(135deg,#00f5ff,#b347d9,#ff6b35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Slime Soccer Sideswipe</h1>
          <p className="text-gray-500 text-sm mb-1">Inspired by Rocket League</p>
          <div className="mb-6"><Credits/></div>
          <p className="text-lg mb-6">Welcome back, <span className="font-black" style={{color:myColor.main}}>{name}</span>! 👋</p>
          <div className="flex flex-col gap-3 items-center">
            {[['🎮 Single Player',()=>setPMode('single'),'from-blue-700 to-blue-900'],['👥 Multiplayer',()=>setPMode('multi'),'from-orange-700 to-red-800'],['🏎️ Garage',()=>setScreen('garage'),'from-purple-700 to-pink-800'],['📊 Stats',()=>setShowStats(true),'from-yellow-700 to-orange-700']].map(([l,fn,g])=>(
              <button key={l} onClick={fn} className={`w-64 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r ${g}`}>{l}</button>
            ))}
          </div>
        </div>
      )}
      {pMode==='single'&&!diff&&!running&&(
        <div className="text-center">
          <h2 className="text-3xl font-black mb-6" style={{background:'linear-gradient(135deg,#00f5ff,#ff6b35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Select Difficulty</h2>
          <div className="flex flex-col gap-3 items-center">
            {[['easy','🟢 Easy','#2e7d32','#1b5e20'],['medium','🟡 Medium','#f9a825','#e65100'],['hard','🔴 Hard','#c62828','#b71c1c'],['impossible','💀 Impossible','#6a1b9a','#311b92']].map(([d,l,c1,c2])=>(
              <button key={d} onClick={()=>setDiff(d)} className="w-64 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105" style={{background:`linear-gradient(135deg,${c1},${c2})`}}>{l}</button>
            ))}
          </div>
          <button onClick={()=>setPMode(null)} className="mt-6 text-gray-400 hover:text-white text-sm">← Back</button>
        </div>
      )}
      {pMode&&(pMode==='multi'||diff)&&!running&&!winner&&(
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4" style={{background:'linear-gradient(135deg,#00f5ff,#ff6b35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Select Duration</h2>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {[['1min','1 Min'],['2min','2 Min'],['4min','4 Min'],['8min','8 Min'],['worldcup','Championship']].map(([m,l])=>(
              <button key={m} onClick={()=>startGame(m)} className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105" style={{background:'linear-gradient(135deg,#6a1b9a,#1565c0)'}}>{l}</button>
            ))}
          </div>
          <div className="text-sm text-gray-400 bg-gray-800 bg-opacity-50 p-3 rounded-lg max-w-sm mx-auto mb-4">
            {pMode==='multi'?<><p>P1: W jump · A/D move · S grab</p><p>P2: I jump · J/L move · K grab</p></>:<><p>WASD or Arrows to move/jump</p><p>S / ↓ to grab · move while grabbing to aim throw</p></>}
          </div>
          <button onClick={()=>pMode==='single'?setDiff(null):setPMode(null)} className="text-gray-400 hover:text-white text-sm">← Back</button>
        </div>
      )}
      {(running||winner)&&(
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between px-6 py-3 rounded-t-xl" style={{width:W,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)'}}>
            <div className="text-center min-w-28">
              <div className="text-xs font-bold mb-1" style={{color:pMode==='multi'?myColor.main:oppColor.main}}>{pMode==='multi'?'PLAYER 1':'AI'}</div>
              <div className="text-4xl font-black">{score.left}</div>
            </div>
            <div className="text-center flex flex-col items-center gap-2">
              <div className="text-2xl font-mono font-bold text-yellow-400">{fmt(timeLeft)}</div>
              <div className="flex gap-2">
                <button onClick={()=>{if(paused){setCountdown(3);setPaused(false);}else setPaused(true);}} className="px-4 py-1 rounded text-sm font-bold" style={{background:'linear-gradient(135deg,#1565c0,#0d47a1)'}}>{paused?'▶ Resume':'⏸ Pause'}</button>
                <button onClick={()=>{setRunning(false);setGMode(null);setPMode(null);setDiff(null);setWinner(null);setPaused(false);setCountdown(0);explosions.current=[];}} className="px-4 py-1 rounded text-sm font-bold" style={{background:'linear-gradient(135deg,#c62828,#b71c1c)'}}>✕ Quit</button>
              </div>
            </div>
            <div className="text-center min-w-28">
              <div className="text-xs font-bold mb-1" style={{color:myColor.main}}>{pMode==='multi'?'PLAYER 2':name.toUpperCase()}</div>
              <div className="text-4xl font-black">{score.right}</div>
            </div>
          </div>

          <div className="relative">
            <canvas ref={canvasRef} width={W} height={H} className="block border-b-4 border-l-4 border-r-4 border-gray-700"/>

            {goalMsg && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <div className="text-center animate-bounce">
                  <div className="px-10 py-5 rounded-2xl" style={{background:'rgba(0,0,0,0.82)',border:`3px solid ${goalMsg.color}`,boxShadow:`0 0 40px ${goalMsg.color}88`}}>
                    <p className="text-5xl font-black mb-1" style={{color:goalMsg.color,textShadow:`0 0 20px ${goalMsg.color}`}}>GOAL!</p>
                    <p className="text-xl font-bold text-white">{goalMsg.scorer} scored! 🎉</p>
                  </div>
                </div>
              </div>
            )}

            {penMsg&&<div className="absolute inset-0 flex items-start justify-center pointer-events-none select-none" style={{paddingTop:'22%'}}><div className="px-8 py-4 rounded-2xl text-center" style={{background:'rgba(180,0,0,0.88)',border:'3px solid #FF4444',boxShadow:'0 0 30px rgba(255,68,68,0.6)'}}><p className="text-2xl font-black text-white">{penMsg}</p><p className="text-sm text-red-200 mt-1">Don't camp in your own goal!</p></div></div>}
            {paused&&<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 select-none pointer-events-none"><div className="text-center"><h2 className="text-7xl font-black text-white">PAUSED</h2><p className="text-gray-300 mt-2">Click Resume to continue</p></div></div>}
            {countdown>0&&<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 select-none pointer-events-none"><div className="text-9xl font-black text-yellow-400" style={{textShadow:'0 0 40px #FFD700'}}>{countdown}</div></div>}
          </div>

          <div className="py-2" style={{width:W,background:'rgba(0,0,0,0.6)'}}><Credits/></div>

          {winner&&(
            <div className="mt-4 text-center rounded-2xl p-8 border border-gray-700" style={{width:W,background:'rgba(10,10,30,0.97)'}}>
              <h2 className="text-4xl font-black mb-5" style={{background:'linear-gradient(135deg,#FFD700,#FF6B35)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                {winner==='Draw'?"🤝 It's a Draw!":`🏆 ${winner} Wins!`}
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-800 rounded-xl p-4"><p className="text-gray-400 text-xs mb-1">Score</p><p className="text-2xl font-bold text-yellow-400">{score.left} – {score.right}</p></div>
                <div className="bg-gray-800 rounded-xl p-4"><p className="text-gray-400 text-xs mb-1">Duration</p><p className="text-2xl font-bold text-cyan-400">{gMode==='1min'?'1:00':gMode==='2min'?'2:00':gMode==='4min'?'4:00':gMode==='8min'?'8:00':'5:00'}</p></div>
                <div className="bg-gray-800 rounded-xl p-4"><p className="text-gray-400 text-xs mb-1">W/L</p><p className="text-2xl font-bold text-green-400">{stats.wins}/{stats.losses}</p></div>
              </div>
              <div className="flex gap-4">
                <button onClick={()=>{resetGame();startGame(gMode);}} className="flex-1 py-3 rounded-xl font-bold hover:scale-105 transition-all" style={{background:'linear-gradient(135deg,#2e7d32,#1b5e20)'}}>🔄 Rematch</button>
                <button onClick={()=>{setGMode(null);setPMode(null);setDiff(null);setWinner(null);}} className="flex-1 py-3 rounded-xl font-bold hover:scale-105 transition-all" style={{background:'linear-gradient(135deg,#1565c0,#6a1b9a)'}}>🏠 Menu</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
