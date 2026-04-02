import { useState, useRef, useEffect } from "react";

// ============================================================
// HEARTHSTONE v2 — Modular Lesson Plan Studio
// Block-based: drag, reorder, add, remove, save templates
// ============================================================

const T = {
  bg: "#f8f5f0", bg2: "#f0ebe3", surface: "#fffcf7", surfaceAlt: "#faf6ee",
  border: "#e2d8c8", borderFocus: "#c8a878",
  text: "#2a2218", textMid: "#5c4e3a", textDim: "#8a7c68", textFaint: "#b8a890",
  hearth: "#b85c2a", hearthGlow: "rgba(184,92,42,0.1)",
  sage: "#4a7a56", slate: "#5a7088", plum: "#7a5a88",
  gold: "#a08a2a", rose: "#a05a5a", sky: "#4a88a0",
  shadow: "0 1px 6px rgba(42,34,24,0.07)",
  shadowLift: "0 4px 16px rgba(42,34,24,0.1)",
};

const BLOCK_TYPES = {
  text: { icon: "📝", label: "Text / Notes", color: T.textMid, desc: "Rich notes, descriptions" },
  list: { icon: "📋", label: "List", color: T.hearth, desc: "Objectives, materials, questions" },
  activity: { icon: "🎯", label: "Activity", color: T.sage, desc: "Structured activity block" },
  reflection: { icon: "🪞", label: "Reflection", color: T.plum, desc: "Student reflection prompts" },
  timer: { icon: "⏱️", label: "Timer / Pacing", color: T.gold, desc: "Duration and pacing" },
  resource: { icon: "🔗", label: "Resources", color: T.sky, desc: "Links and references" },
  assessment: { icon: "🌱", label: "Assessment", color: T.slate, desc: "Observations and criteria" },
  parent: { icon: "💌", label: "Parent Comms", color: T.rose, desc: "Message home" },
  outdoor: { icon: "🌿", label: "Field / Outdoor", color: T.plum, desc: "Outdoor component" },
  compliance: { icon: "📁", label: "Compliance", color: T.sky, desc: "Archival documentation" },
  custom: { icon: "✨", label: "Custom", color: T.gold, desc: "Your own section" },
  divider: { icon: "—", label: "Divider", color: T.textFaint, desc: "Section separator" },
};

const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

function makeBlock(type) {
  const b = { id: gid(), type, collapsed: false };
  const m = { text: {title:"Notes",content:""}, list: {title:"List",items:[""]},
    activity: {title:"Activity",objective:"",procedure:"",notes:""},
    reflection: {title:"Reflection",prompts:[""],notes:""},
    timer: {title:"Pacing",duration:"",notes:""},
    resource: {title:"Resources",links:[{label:"",url:""}],notes:""},
    assessment: {title:"Assessment",observations:"",criteria:[""],reflectionPrompt:""},
    parent: {title:"Parent Communication",message:"",takeHome:""},
    outdoor: {title:"Field / Outdoor",location:"",activity:"",connection:""},
    compliance: {title:"Compliance",setting:"",notes:""},
    custom: {title:"Custom Section",content:""}, divider: {title:""} };
  return { ...b, ...(m[type]||{title:"Block",content:""}) };
}

const DEFAULT_BLOCKS = () => [
  {...makeBlock("text"),title:"Lesson Overview"},
  {...makeBlock("list"),title:"Learning Objectives",items:[""]},
  {...makeBlock("list"),title:"Materials Needed",items:[""]},
  {...makeBlock("divider"),title:"Activities & Procedures"},
  {...makeBlock("text"),title:"Opening Discussion"},
  {...makeBlock("activity"),title:"Activity 1"},
  {...makeBlock("text"),title:"Wrap-Up Discussion"},
  {...makeBlock("divider"),title:"Assessment & Documentation"},
  {...makeBlock("assessment"),title:"Assessment"},
  {...makeBlock("outdoor"),title:"Field / Outdoor Component"},
  {...makeBlock("text"),title:"Documentation & Reflection"},
  {...makeBlock("parent"),title:"Parent Communication"},
  {...makeBlock("compliance"),title:"Compliance / Archiving"},
];

// ── Inputs ──
function Inp({value,onChange,placeholder,big,mono,style}) {
  const Tag = big ? "textarea" : "input";
  return <Tag value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    rows={big?4:undefined} style={{width:"100%",padding:big?"10px 12px":"8px 12px",borderRadius:"5px",
    border:`1.5px solid ${T.border}`,background:T.bg,fontSize:"13px",
    fontFamily:mono?"'DM Sans',monospace":"'Libre Baskerville',Georgia,serif",
    color:T.text,outline:"none",resize:big?"vertical":"none",lineHeight:big?"1.7":"1.4",
    transition:"border-color 0.2s",...style}}
    onFocus={e=>e.target.style.borderColor=T.borderFocus}
    onBlur={e=>e.target.style.borderColor=T.border} />;
}

function Lbl({children,color}) {
  return <label style={{fontSize:"10px",fontWeight:600,color:color||T.textMid,
    letterSpacing:"0.05em",display:"block",marginBottom:"3px",fontFamily:"'DM Sans',sans-serif"}}>{children}</label>;
}

function ListEd({items,onChange,ph,addLabel}) {
  const up=(i,v)=>{const n=[...items];n[i]=v;onChange(n);};
  return <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
    {items.map((it,i)=><div key={i} style={{display:"flex",gap:"6px",alignItems:"center"}}>
      <span style={{fontSize:"10px",color:T.textFaint,minWidth:"16px",textAlign:"right"}}>{i+1}</span>
      <Inp value={it} onChange={v=>up(i,v)} placeholder={ph} style={{flex:1}} />
      {items.length>1&&<button onClick={()=>onChange(items.filter((_,j)=>j!==i))} style={{
        background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"15px",padding:"0 2px"}}>×</button>}
    </div>)}
    <button onClick={()=>onChange([...items,""])} style={{background:"none",border:`1px dashed ${T.border}`,
      borderRadius:"5px",padding:"5px 10px",fontSize:"10px",color:T.textDim,cursor:"pointer",
      fontFamily:"'DM Sans',sans-serif"}}>+ {addLabel||"Add"}</button>
  </div>;
}

// ── Block Content Renderers ──
function BlockBody({block,update}) {
  const s=(k,v)=>update({...block,[k]:v});
  switch(block.type) {
    case "text": case "custom":
      return <Inp value={block.content} big onChange={v=>s("content",v)} placeholder="Start writing..." />;
    case "list":
      return <ListEd items={block.items} onChange={v=>s("items",v)} ph="Item" addLabel="Add item" />;
    case "activity": return <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <div><Lbl color={T.sage}>Objective</Lbl><Inp value={block.objective} onChange={v=>s("objective",v)} placeholder="What will students learn?" /></div>
      <div><Lbl color={T.sage}>Procedure</Lbl><Inp value={block.procedure} big onChange={v=>s("procedure",v)} placeholder="Step by step..." /></div>
      <div><Lbl>Notes</Lbl><Inp value={block.notes} onChange={v=>s("notes",v)} placeholder="Modifications, tips..." /></div>
    </div>;
    case "reflection": return <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <Lbl color={T.plum}>Prompts</Lbl>
      <ListEd items={block.prompts} onChange={v=>s("prompts",v)} ph="Ask students..." addLabel="Add prompt" />
      <Lbl>Notes</Lbl><Inp value={block.notes} onChange={v=>s("notes",v)} placeholder="Facilitation notes..." />
    </div>;
    case "timer": return <div style={{display:"flex",gap:"8px"}}>
      <div style={{width:"90px"}}><Lbl color={T.gold}>Duration</Lbl><Inp value={block.duration} onChange={v=>s("duration",v)} placeholder="15 min" /></div>
      <div style={{flex:1}}><Lbl>Pacing Notes</Lbl><Inp value={block.notes} onChange={v=>s("notes",v)} placeholder="Transitions, checkpoints..." /></div>
    </div>;
    case "resource": return <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      {block.links.map((lk,i)=><div key={i} style={{display:"flex",gap:"6px",alignItems:"center"}}>
        <Inp value={lk.label} onChange={v=>{const n=[...block.links];n[i]={...n[i],label:v};s("links",n);}} placeholder="Label" style={{flex:1}} />
        <Inp value={lk.url} onChange={v=>{const n=[...block.links];n[i]={...n[i],url:v};s("links",n);}} placeholder="URL" mono style={{flex:2}} />
        {block.links.length>1&&<button onClick={()=>s("links",block.links.filter((_,j)=>j!==i))} style={{
          background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"15px"}}>×</button>}
      </div>)}
      <button onClick={()=>s("links",[...block.links,{label:"",url:""}])} style={{background:"none",
        border:`1px dashed ${T.border}`,borderRadius:"5px",padding:"5px 10px",fontSize:"10px",
        color:T.textDim,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add resource</button>
      <Lbl>Notes</Lbl><Inp value={block.notes} onChange={v=>s("notes",v)} placeholder="Context..." />
    </div>;
    case "assessment": return <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <div><Lbl color={T.slate}>Observations</Lbl><Inp value={block.observations} big onChange={v=>s("observations",v)} placeholder="What to watch for..." /></div>
      <div><Lbl>Criteria</Lbl><ListEd items={block.criteria} onChange={v=>s("criteria",v)} ph="e.g. Depth of understanding" addLabel="Add criterion" /></div>
      <div><Lbl>Reflection Prompt</Lbl><Inp value={block.reflectionPrompt} onChange={v=>s("reflectionPrompt",v)} placeholder="Optional student prompt..." /></div>
    </div>;
    case "parent": return <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <div><Lbl color={T.rose}>Message to Parents</Lbl><Inp value={block.message} big onChange={v=>s("message",v)} placeholder="Today's lesson focused on..." /></div>
      <div><Lbl>Take-Home Activity</Lbl><Inp value={block.takeHome} big onChange={v=>s("takeHome",v)} placeholder="Optional family activity..." /></div>
    </div>;
    case "outdoor": return <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <div><Lbl color={T.plum}>Location</Lbl><Inp value={block.location} onChange={v=>s("location",v)} placeholder="Garden, forest..." /></div>
      <div><Lbl>Activity</Lbl><Inp value={block.activity} big onChange={v=>s("activity",v)} placeholder="What will students do?" /></div>
      <div><Lbl>Connection to Lesson</Lbl><Inp value={block.connection} big onChange={v=>s("connection",v)} placeholder="How does this connect?" /></div>
    </div>;
    case "compliance": return <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <div><Lbl color={T.sky}>Setting</Lbl><Inp value={block.setting} onChange={v=>s("setting",v)} placeholder="e.g. Outdoors, private" /></div>
      <div><Lbl>Notes</Lbl><Inp value={block.notes} big onChange={v=>s("notes",v)} placeholder="Minimal documentation..." /></div>
    </div>;
    case "divider": return null;
    default: return <Inp value={block.content||""} big onChange={v=>s("content",v)} placeholder="Content..." />;
  }
}

// ── Block Component ──
function Block({block,index,total,onUpdate,onRemove,onMove,onToggle,onLock}) {
  const meta = BLOCK_TYPES[block.type]||BLOCK_TYPES.custom;
  const locked = block.locked || false;
  if (block.type==="divider") return <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 0",margin:"6px 0"}}>
    <div style={{flex:1,height:"1px",background:T.border}} />
    <input value={block.title} onChange={e=>onUpdate({...block,title:e.target.value})} placeholder="Section heading..."
      disabled={locked}
      style={{background:"none",border:"none",textAlign:"center",fontSize:"10px",letterSpacing:"0.15em",
        textTransform:"uppercase",color:locked?T.textFaint:T.textDim,fontWeight:600,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"200px"}} />
    <div style={{flex:1,height:"1px",background:T.border}} />
    <button onClick={()=>onLock?.()} style={{background:"none",border:"none",color:locked?T.gold:T.textFaint,cursor:"pointer",fontSize:"12px"}}>{locked?"🔒":"🔓"}</button>
    {!locked&&<button onClick={onRemove} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"12px"}}>×</button>}
  </div>;

  return <div style={{background:T.surface,border:`1px solid ${locked?T.gold:T.border}`,borderLeft:`3px solid ${meta.color}`,
    borderRadius:"7px",boxShadow:T.shadow,marginBottom:"8px",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",
      background:block.collapsed?T.surfaceAlt:"transparent",
      borderBottom:block.collapsed?"none":`1px solid ${T.border}`}}>
      {!locked&&<span style={{fontSize:"12px",color:T.textFaint,cursor:"grab",userSelect:"none",padding:"0 2px"}}>⠿</span>}
      {locked&&<span style={{fontSize:"12px",color:T.gold,padding:"0 2px"}}>⠿</span>}
      <span style={{fontSize:"14px"}}>{meta.icon}</span>
      <input value={block.title} onChange={e=>onUpdate({...block,title:e.target.value})}
        disabled={locked}
        style={{flex:1,background:"none",border:"none",fontSize:"13px",fontWeight:700,color:meta.color,
          outline:"none",fontFamily:"'Libre Baskerville',Georgia,serif",opacity:locked?0.8:1}} />
      <div style={{display:"flex",gap:"2px",alignItems:"center"}}>
        {!locked&&index>0&&<button onClick={()=>onMove(-1)} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"14px",padding:"0 3px"}}>↑</button>}
        {!locked&&index<total-1&&<button onClick={()=>onMove(1)} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"14px",padding:"0 3px"}}>↓</button>}
        <button onClick={()=>onLock?.()} style={{background:"none",border:"none",color:locked?T.gold:T.textFaint,cursor:"pointer",fontSize:"12px",padding:"0 4px"}}>{locked?"🔒":"🔓"}</button>
        <button onClick={onToggle} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"11px",padding:"0 4px",
          transform:block.collapsed?"rotate(-90deg)":"rotate(0)",transition:"transform 0.2s"}}>▾</button>
        {!locked&&<button onClick={onRemove} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:"14px",padding:"0 4px"}}>×</button>}
      </div>
    </div>
    {!block.collapsed&&<div style={{padding:"12px",animation:"fadeIn 0.15s ease"}}><BlockBody block={block} update={onUpdate} /></div>}
  </div>;
}

// ── Block Palette ──
function Palette({onAdd,onClose}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(42,34,24,0.4)",
    display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100,animation:"fadeIn 0.15s ease"}} onClick={onClose}>
    <div style={{background:T.surface,borderRadius:"12px 12px 0 0",padding:"16px",width:"100%",maxWidth:"500px",
      maxHeight:"70vh",overflowY:"auto",boxShadow:T.shadowLift}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:"10px",letterSpacing:"0.15em",textTransform:"uppercase",color:T.textFaint,fontWeight:600,
        marginBottom:"12px",fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>Add Block</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
        {Object.entries(BLOCK_TYPES).map(([k,m])=><button key={k} onClick={()=>{onAdd(k);onClose();}}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",borderRadius:"6px",
            border:`1px solid ${T.border}`,background:T.bg,cursor:"pointer",textAlign:"left"}}>
          <span style={{fontSize:"16px"}}>{m.icon}</span>
          <div><div style={{fontSize:"11px",fontWeight:600,color:m.color,fontFamily:"'DM Sans',sans-serif"}}>{m.label}</div>
            <div style={{fontSize:"9px",color:T.textFaint,lineHeight:1.3}}>{m.desc}</div></div>
        </button>)}
      </div>
    </div>
  </div>;
}

// ── Export ──
function toText(meta,blocks) {
  let t = `${"═".repeat(50)}\n${meta.title||"Untitled"}\n${meta.ageGroup?`Ages ${meta.ageGroup} · `:""}${meta.date||""}\n${"═".repeat(50)}\n\n`;
  blocks.forEach(b=>{
    const bt=BLOCK_TYPES[b.type];
    if(b.type==="divider"){t+=`\n${"─".repeat(40)}\n${b.title?b.title.toUpperCase():""}\n${"─".repeat(40)}\n\n`;return;}
    t+=`${bt?.icon||"•"} ${b.title}\n`;
    if(b.content)t+=`${b.content}\n`;
    if(b.items)b.items.filter(Boolean).forEach((it,i)=>{t+=`  ${i+1}. ${it}\n`;});
    if(b.objective)t+=`  Objective: ${b.objective}\n`;
    if(b.procedure)t+=`  Procedure: ${b.procedure}\n`;
    if(b.prompts)b.prompts.filter(Boolean).forEach(p=>{t+=`  • ${p}\n`;});
    if(b.observations)t+=`  Observations: ${b.observations}\n`;
    if(b.criteria)b.criteria.filter(Boolean).forEach(c=>{t+=`  • ${c}\n`;});
    if(b.reflectionPrompt)t+=`  Reflection: ${b.reflectionPrompt}\n`;
    if(b.message)t+=`  ${b.message}\n`;
    if(b.takeHome)t+=`  Take-home: ${b.takeHome}\n`;
    if(b.location)t+=`  Location: ${b.location}\n`;
    if(b.activity)t+=`  Activity: ${b.activity}\n`;
    if(b.connection)t+=`  Connection: ${b.connection}\n`;
    if(b.setting)t+=`  Setting: ${b.setting}\n`;
    if(b.duration)t+=`  Duration: ${b.duration}\n`;
    if(b.links)b.links.filter(l=>l.label||l.url).forEach(l=>{t+=`  🔗 ${l.label}: ${l.url}\n`;});
    if(b.notes)t+=`  Notes: ${b.notes}\n`;
    t+="\n";
  });
  t+=`${"═".repeat(50)}\nHearthstone — Lesson Plan Studio 🔥 🍵\n${"═".repeat(50)}`;
  return t;
}

// ── Main ──
export default function Hearthstone({ initialFromKindling }) {
  const [plans,setPlans]=useState([]);
  const [ap,setAp]=useState(null);
  const [view,setView]=useState("list");
  const [showPal,setShowPal]=useState(false);
  const [toast,setToast]=useState("");
  const ref=useRef(null);
  const flash=m=>{setToast(m);setTimeout(()=>setToast(""),2000);};

  // Auto-load from Kindling when bridge passes data
  useEffect(() => {
    if (initialFromKindling && !ap) {
      const imported = {
        id: gid(),
        meta: {
          title: "Kindling → " + (initialFromKindling.profile?.name || "Student"),
          ageGroup: initialFromKindling.profile?.level || "",
          date: new Date().toISOString().split("T")[0],
        },
        blocks: [
          { ...makeBlock("text"), title: "Lesson Overview", content: initialFromKindling.lesson || "" },
          { ...makeBlock("activity"), title: "Assignment", objective: initialFromKindling.assignment || "", procedure: "", notes: "" },
          { ...makeBlock("assessment"), title: "Growth Assessment", observations: "", criteria: [""], reflectionPrompt: initialFromKindling.assessment || "" },
          { ...makeBlock("divider"), title: "Teacher Notes" },
          { ...makeBlock("text"), title: "Documentation & Reflection", content: "" },
          { ...makeBlock("parent"), title: "Parent Communication", message: "", takeHome: "" },
        ],
      };
      setAp(imported);
      setView("edit");
    }
  }, [initialFromKindling]);

  const newPlan=()=>{setAp({id:gid(),meta:{title:"",ageGroup:"",date:new Date().toISOString().split("T")[0]},blocks:DEFAULT_BLOCKS()});setView("edit");};
  const open=p=>{setAp(JSON.parse(JSON.stringify(p)));setView("edit");};
  const save=()=>{if(!ap)return;const i=plans.findIndex(p=>p.id===ap.id);setPlans(i>=0?plans.map(p=>p.id===ap.id?ap:p):[...plans,ap]);flash("Saved ✓");};
  const del=id=>{setPlans(plans.filter(p=>p.id!==id));if(ap?.id===id){setAp(null);setView("list");}flash("Deleted");};
  const dup=p=>{const d=JSON.parse(JSON.stringify(p));d.id=gid();d.meta.title=(d.meta.title||"Untitled")+" (copy)";setPlans([...plans,d]);flash("Duplicated ✓");};

  const ub=(i,b)=>{const n=[...ap.blocks];n[i]=b;setAp({...ap,blocks:n});};
  const rb=i=>setAp({...ap,blocks:ap.blocks.filter((_,j)=>j!==i)});
  const mb=(i,d)=>{const n=[...ap.blocks];const j=i+d;if(j<0||j>=n.length)return;[n[i],n[j]]=[n[j],n[i]];setAp({...ap,blocks:n});};
  const tb=i=>{const n=[...ap.blocks];n[i]={...n[i],collapsed:!n[i].collapsed};setAp({...ap,blocks:n});};
  const ab=type=>setAp({...ap,blocks:[...ap.blocks,makeBlock(type)]});

  const lb=i=>{const n=[...ap.blocks];n[i]={...n[i],locked:!n[i].locked};setAp({...ap,blocks:n});};

  const colAll=()=>setAp({...ap,blocks:ap.blocks.map(b=>({...b,collapsed:true}))});
  const expAll=()=>setAp({...ap,blocks:ap.blocks.map(b=>({...b,collapsed:false}))});

  const doExp=()=>{if(!ap)return;const t=toText(ap.meta,ap.blocks);const b=new Blob([t],{type:"text/plain"});
    const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;
    a.download=`${(ap.meta.title||"plan").replace(/[^a-z0-9]/gi,"-").toLowerCase()}.txt`;a.click();URL.revokeObjectURL(u);flash("Exported ✓");};
  const doCopy=()=>{if(!ap)return;navigator.clipboard.writeText(toText(ap.meta,ap.blocks)).then(()=>flash("Copied ✓")).catch(()=>flash("Failed"));};

  const btnS={background:"none",border:`1px solid ${T.border}`,borderRadius:"4px",padding:"5px 10px",fontSize:"10px",
    color:T.textDim,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"};

  return <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Libre Baskerville',Georgia,serif"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      *{box-sizing:border-box}body{margin:0}::selection{background:${T.hearthGlow};color:${T.hearth}}`}</style>
    <div ref={ref}/>

    <header style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,background:T.surface,textAlign:"center"}}>
      <div style={{fontSize:"8px",letterSpacing:"0.4em",textTransform:"uppercase",color:T.textFaint,marginBottom:"3px"}}>Modular Lesson Plan Studio</div>
      <h1 style={{fontSize:"18px",fontWeight:700,color:T.text,margin:0}}>🪨 Hearthstone</h1>
      <p style={{fontSize:"10px",color:T.textDim,fontStyle:"italic",margin:"2px 0 0"}}>Your structure. Your teaching. Your way.</p>
    </header>

    <main style={{maxWidth:"640px",margin:"0 auto",padding:"12px"}}>

      {view==="list"&&<div style={{animation:"fadeIn 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <span style={{fontSize:"11px",color:T.textFaint,letterSpacing:"0.1em",textTransform:"uppercase",
            fontFamily:"'DM Sans',sans-serif"}}>{plans.length} plan{plans.length!==1?"s":""}</span>
          <button onClick={newPlan} style={{padding:"10px 20px",borderRadius:"7px",border:"none",
            background:T.hearth,color:"#fff",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,
            cursor:"pointer",boxShadow:T.shadow}}>+ New Plan</button>
        </div>
        {plans.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:T.textDim,fontStyle:"italic",
          fontSize:"14px",lineHeight:1.8}}>No plans yet.<br/>Every lesson starts with intention. 🔥</div>}
        {plans.map(p=><div key={p.id} onClick={()=>open(p)} style={{background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:"7px",padding:"12px 14px",marginBottom:"8px",boxShadow:T.shadow,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:700,color:T.text}}>{p.meta.title||"Untitled Plan"}</div>
              <div style={{fontSize:"10px",color:T.textDim,marginTop:"2px",fontFamily:"'DM Sans',sans-serif"}}>
                {p.blocks.length} blocks · {p.meta.date||""}</div>
            </div>
            <div style={{display:"flex",gap:"4px"}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>dup(p)} style={{...btnS,fontSize:"9px",padding:"4px 8px"}}>Dup</button>
              <button onClick={()=>del(p.id)} style={{...btnS,fontSize:"9px",padding:"4px 8px",color:T.rose}}>Del</button>
            </div>
          </div>
        </div>)}
      </div>}

      {view==="edit"&&ap&&<div style={{animation:"fadeIn 0.3s ease"}}>
        {/* Meta */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px",padding:"12px",
          background:T.surface,borderRadius:"7px",border:`1px solid ${T.border}`,boxShadow:T.shadow}}>
          <input value={ap.meta.title} onChange={e=>setAp({...ap,meta:{...ap.meta,title:e.target.value}})}
            placeholder="Lesson plan title..." style={{background:"none",border:"none",fontSize:"16px",fontWeight:700,
            color:T.text,outline:"none",fontFamily:"'Libre Baskerville',Georgia,serif",width:"100%"}} />
          <div style={{display:"flex",gap:"8px"}}>
            <input value={ap.meta.ageGroup} onChange={e=>setAp({...ap,meta:{...ap.meta,ageGroup:e.target.value}})}
              placeholder="Age group" style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"4px",
              padding:"5px 8px",fontSize:"11px",color:T.textMid,outline:"none",fontFamily:"'DM Sans',sans-serif",width:"80px"}} />
            <input type="date" value={ap.meta.date} onChange={e=>setAp({...ap,meta:{...ap.meta,date:e.target.value}})}
              style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"4px",padding:"5px 8px",
              fontSize:"11px",color:T.textMid,outline:"none",fontFamily:"'DM Sans',sans-serif"}} />
          </div>
        </div>

        {/* Toolbar */}
        <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"12px",position:"sticky",top:0,
          zIndex:50,padding:"8px 0",background:T.bg}}>
          <button onClick={()=>setView("list")} style={btnS}>← Plans</button>
          <button onClick={save} style={{...btnS,background:T.hearth,border:"none",color:"#fff",fontWeight:600}}>💾 Save</button>
          <button onClick={doExp} style={btnS}>Export</button>
          <button onClick={doCopy} style={btnS}>Copy</button>
          <div style={{flex:1}} />
          <button onClick={colAll} style={{...btnS,fontSize:"9px"}}>▴ All</button>
          <button onClick={expAll} style={{...btnS,fontSize:"9px"}}>▾ All</button>
        </div>

        {/* Blocks */}
        {ap.blocks.map((b,i)=><Block key={b.id} block={b} index={i} total={ap.blocks.length}
          onUpdate={bl=>ub(i,bl)} onRemove={()=>rb(i)} onMove={d=>mb(i,d)} onToggle={()=>tb(i)} onLock={()=>lb(i)} />)}

        <button onClick={()=>setShowPal(true)} style={{width:"100%",padding:"14px",marginTop:"4px",
          border:`2px dashed ${T.border}`,borderRadius:"7px",background:"transparent",color:T.textDim,
          fontSize:"12px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:"pointer"}}>+ Add Block</button>

        <div style={{display:"flex",justifyContent:"center",padding:"16px 0 24px"}}>
          <button onClick={save} style={{padding:"12px 32px",borderRadius:"7px",border:"none",background:T.hearth,
            color:"#fff",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",boxShadow:T.shadow}}>
            💾 Save Lesson Plan</button>
        </div>
      </div>}

      <footer style={{marginTop:"20px",paddingTop:"10px",borderTop:`1px solid ${T.border}`,textAlign:"center"}}>
        <p style={{fontSize:"9px",color:T.textFaint,lineHeight:1.6,fontStyle:"italic"}}>
          Hearthstone v2 — Modular Lesson Plan Studio<br/>Your structure. Your teaching. Your way. 🔥 🍵</p>
      </footer>
    </main>

    {showPal&&<Palette onAdd={ab} onClose={()=>setShowPal(false)} />}
    {toast&&<div style={{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",
      background:T.text,color:T.bg,padding:"8px 20px",borderRadius:"5px",fontSize:"11px",
      fontFamily:"'DM Sans',sans-serif",fontWeight:600,boxShadow:T.shadowLift,zIndex:200,
      animation:"fadeIn 0.15s ease"}}>{toast}</div>}
  </div>;
}
