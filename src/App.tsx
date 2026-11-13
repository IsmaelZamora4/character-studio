import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, useSandpack, type CodeEditorRef } from '@codesandbox/sandpack-react';
import { Code2, Box, Film, RotateCcw, Download, Upload, Save, MonitorPlay, Smartphone, Maximize2, Play, UserRound, Plus, FolderOpen, FileCode2, Moon, Sun, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { deps, samples, type Mode } from './examples';

type Viewport = 'free' | 'vertical' | 'square';
const names: Record<Mode,string> = {react:'React TSX',three:'Three.js / R3F',remotion:'Remotion'};
const storageKey=(mode:Mode)=>`character-studio-v01-${mode}`;
const themeStorageKey='character-studio-theme';
const isHtmlDocument=(source:string)=>/^\uFEFF?\s*(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i.test(source);
const isStoredCodeCompatible=(mode:Mode,source:string)=>{
  if(isHtmlDocument(source))return false;
  if(mode==='remotion')return true;
  if(mode==='three')return !/\bfrom\s+['"](?:remotion|@remotion\/player)['"]/.test(source)
    && !/\bregisterRoot\s*\(/.test(source);
  return !/\bfrom\s+['"](?:remotion|@remotion\/player|three|@react-three\/(?:fiber|drei))['"]/.test(source)
    && !/\bregisterRoot\s*\(/.test(source);
};
const getStored=(mode:Mode)=>{
  try{
    const stored=localStorage.getItem(storageKey(mode));
    return stored && isStoredCodeCompatible(mode,stored) ? stored : samples[mode];
  }catch{return samples[mode]}
};
const defaultEntry=`import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
`;
const normalizeThreeCode=(source:string)=>source
  .replace(/(['"])three\/addons\/(controls\/OrbitControls\.js)\1/g,'$1three/examples/jsm/$2$1')
  .replace('<OrbitControls target={[0,1,0]} enablePan={false}/>','<OrbitControls makeDefault target={[0,1,0]} enableDamping dampingFactor={0.08} enableZoom enablePan rotateSpeed={0.8}/>');
const getRemotionRootInfo=(source:string)=>{
  if(!/export\s+(?:const|function)\s+RemotionRoot\b/.test(source)||!/\bregisterRoot\s*\(/.test(source))return null;
  const component=source.match(/component=\{\s*([A-Za-z_$][\w$]*)\s*\}/)?.[1];
  if(!component)return null;
  const composition=source.match(/<Composition[\s\S]*?durationInFrames=\{(\d+)\}[\s\S]*?fps=\{(\d+)\}[\s\S]*?width=\{(\d+)\}[\s\S]*?height=\{(\d+)\}/);
  return {component,duration:composition?.[1]??'150',fps:composition?.[2]??'30',width:composition?.[3]??'1080',height:composition?.[4]??'1080'};
};
const getRemotionUserCode=(source:string,component:string)=>{
  const withoutRegisterRoot=source.replace(/\s*registerRoot\s*\(\s*RemotionRoot\s*\)\s*;?\s*$/,'');
  return new RegExp(`export\\s+(?:const|function)\\s+${component}\\b`).test(source)
    ? withoutRegisterRoot
    : `${withoutRegisterRoot}\n\nexport { ${component} };\n`;
};
const getRemotionPreview=(component:string,duration:string,fps:string,width:string,height:string)=>`import React from 'react';
import { Player } from '@remotion/player';
import { ${component} } from './UserCode';

export default function Preview() {
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#101526',padding:16}}>
    <Player component={${component}} compositionWidth={${width}} compositionHeight={${height}}
      durationInFrames={${duration}} fps={${fps}} controls loop autoPlay
      style={{width:'min(100%,520px)',aspectRatio:'${width} / ${height}'}} />
  </main>;
}
`;

function SandboxPersistence({mode, code:externalCode, syncToken, onCode}:{mode:Mode,code:string,syncToken:number,onCode:(value:string)=>void}){
  const {sandpack} = useSandpack();
  const code=sandpack.files['/App.tsx']?.code ?? '';
  const compatibleCode=mode==='three' ? normalizeThreeCode(code) : code;
  const lastSyncToken=useRef(syncToken);
  useEffect(()=>{
    if(syncToken!==lastSyncToken.current)return;
    if(code!==compatibleCode)sandpack.updateCurrentFile(compatibleCode);
    else onCode(code);
  },[code,compatibleCode,onCode,sandpack,syncToken]);
  useEffect(()=>{
    if(syncToken===lastSyncToken.current)return;
    lastSyncToken.current=syncToken;
    const nextCode=mode==='three' ? normalizeThreeCode(externalCode) : externalCode;
    if(code!==nextCode)sandpack.updateCurrentFile(nextCode);
  },[code,externalCode,mode,sandpack,syncToken]);
  useEffect(()=>{
    if(mode!=='remotion')return;
    const rootInfo=getRemotionRootInfo(code);
    const entryCode=rootInfo
      ? getRemotionUserCode(code,rootInfo.component)
      : defaultEntry;
    const entry=sandpack.files['/index.tsx']?.code;
    if(entry!==defaultEntry && !rootInfo)sandpack.updateFile('/index.tsx',defaultEntry);
    if(rootInfo){
      const preview=getRemotionPreview(rootInfo.component,rootInfo.duration,rootInfo.fps,rootInfo.width,rootInfo.height);
      if(sandpack.files['/UserCode.tsx']?.code!==entryCode)sandpack.updateFile('/UserCode.tsx',entryCode);
      if(sandpack.files['/Preview.tsx']?.code!==preview)sandpack.updateFile('/Preview.tsx',preview);
      if(entry!==`import Preview from './Preview';\nimport { createRoot } from 'react-dom/client';\ncreateRoot(document.getElementById('root')!).render(<Preview />);\n`){
        sandpack.updateFile('/index.tsx',`import Preview from './Preview';
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<Preview />);
`);
      }
    }
  },[code,mode,sandpack]);
  return null;
}

function EditorSearch({editorRef,code}:{editorRef:{current:CodeEditorRef|null},code:string}){
  const [isOpen,setIsOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [activeMatch,setActiveMatch]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null);
  const triggerRef=useRef<HTMLButtonElement>(null);
  const matches=useMemo(()=>{
    if(!query)return [];
    const escapedQuery=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const expression=new RegExp(escapedQuery,'gi');
    const found:number[]=[];
    let match:RegExpExecArray|null;
    while((match=expression.exec(code))!==null)found.push(match.index);
    return found;
  },[code,query]);
  const currentMatch=matches.length?activeMatch%matches.length:-1;
  useEffect(()=>{if(isOpen)inputRef.current?.focus()},[isOpen]);
  useEffect(()=>{
    const start=matches[currentMatch];
    const view=editorRef.current?.getCodemirror();
    if(!isOpen||start===undefined||!view||start>=view.state.doc.length)return;
    view.dispatch({selection:{anchor:start,head:Math.min(start+query.length,view.state.doc.length)},scrollIntoView:true});
  },[currentMatch,editorRef,isOpen,matches,query]);
  const moveMatch=(direction:-1|1)=>{
    if(matches.length)setActiveMatch(index=>(index+direction+matches.length)%matches.length);
  };
  const closeSearch=()=>{
    setIsOpen(false);
    window.requestAnimationFrame(()=>triggerRef.current?.focus());
  };
  return <div className="editorSearchControl">
    <button ref={triggerRef} type="button" className="editorSearchTrigger" aria-label="Buscar en el código" aria-expanded={isOpen} aria-controls="editor-code-search" onClick={()=>isOpen?closeSearch():setIsOpen(true)}><Search size={15}/><span>Buscar</span></button>
    {isOpen&&<div id="editor-code-search" className="editorSearchPanel" role="search">
      <Search size={15} aria-hidden="true"/>
      <input ref={inputRef} type="search" value={query} placeholder="Buscar en el código" aria-label="Buscar en el código" autoComplete="off" spellCheck={false} onChange={event=>{setQuery(event.target.value);setActiveMatch(0)}} onKeyDown={event=>{
        if(event.key==='Enter'){event.preventDefault();moveMatch(event.shiftKey?-1:1)}
        if(event.key==='Escape')closeSearch();
      }}/>
      <span className="editorSearchCount" aria-live="polite">{matches.length?`${currentMatch+1} de ${matches.length}`:query?'Sin resultados':''}</span>
      <button type="button" className="editorSearchNav" aria-label="Coincidencia anterior" title="Coincidencia anterior" disabled={!matches.length} onClick={()=>moveMatch(-1)}><ChevronUp size={16}/></button>
      <button type="button" className="editorSearchNav" aria-label="Coincidencia siguiente" title="Coincidencia siguiente" disabled={!matches.length} onClick={()=>moveMatch(1)}><ChevronDown size={16}/></button>
      <button type="button" className="editorSearchClose" aria-label="Cerrar búsqueda" title="Cerrar búsqueda" onClick={closeSearch}><X size={15}/></button>
    </div>}
  </div>;
}

export default function App(){
  const [mode,setMode]=useState<Mode>('react');
  const [isDarkMode,setIsDarkMode]=useState(()=>localStorage.getItem(themeStorageKey)==='dark');
  const [viewport,setViewport]=useState<Viewport>('free');
  const [code,setCode]=useState<Record<Mode,string>>(()=>({react:getStored('react'),three:getStored('three'),remotion:getStored('remotion')}));
  const [syncToken,setSyncToken]=useState(0);
  const [status,setStatus]=useState('Listo');
  const uploadRef=useRef<HTMLInputElement>(null);
  const editorRef=useRef<CodeEditorRef>(null);
  const editorCode=code[mode];
  const htmlDocument=isHtmlDocument(editorCode);
  const updateCode=useCallback((value:string)=>setCode(old=>old[mode]===value?old:{...old,[mode]:value}),[mode]);
  const customSetup=useMemo(()=>({dependencies:deps[mode]}),[mode]);
  useEffect(()=>{const id=window.setTimeout(()=>{try{localStorage.setItem(storageKey(mode),editorCode);setStatus('Guardado localmente')}catch{setStatus('No se pudo guardar localmente')}},500);return()=>clearTimeout(id)},[mode,editorCode]);
  useEffect(()=>{localStorage.setItem(themeStorageKey,isDarkMode?'dark':'light')},[isDarkMode]);
  const files=useMemo(()=>({
    '/App.tsx':mode==='three' ? normalizeThreeCode(code[mode]) : code[mode],
    '/styles.css':`*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;font-family:Inter,system-ui,sans-serif}body{background:#101526}.stage{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:linear-gradient(160deg,#151b2d,#252145);color:white;text-align:center}.stage h2{margin:8px 0}.stage p{color:#b9bdd5;margin:0 0 25px}`,
    ...(mode==='remotion'&&getRemotionRootInfo(code[mode])?{
      '/UserCode.tsx':getRemotionUserCode(code[mode],getRemotionRootInfo(code[mode])!.component),
      '/Preview.tsx':getRemotionPreview(getRemotionRootInfo(code[mode])!.component,getRemotionRootInfo(code[mode])!.duration,getRemotionRootInfo(code[mode])!.fps,getRemotionRootInfo(code[mode])!.width,getRemotionRootInfo(code[mode])!.height),
      '/index.tsx':`import Preview from './Preview';
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<Preview />);
`
    }:{})
  }),[code,mode,syncToken]);
  const reset=()=>{if(window.confirm('¿Restaurar el ejemplo? Se perderán los cambios de este modo.')){setCode(old=>({...old,[mode]:samples[mode]}));setSyncToken(token=>token+1);setStatus('Ejemplo restaurado')}};
  const saveLocal=()=>{try{localStorage.setItem(storageKey(mode),editorCode);setStatus('Guardado localmente')}catch{setStatus('No se pudo guardar localmente')}};
  const download=()=>{const blob=new Blob([editorCode],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`personaje-${mode}.tsx`;a.click();URL.revokeObjectURL(url)};
  const upload=async(file?:File)=>{if(!file)return;if(!/\.(tsx|ts|jsx|js|txt)$/i.test(file.name)){setStatus('Selecciona un archivo .tsx, .ts, .jsx, .js o .txt');return;}if(file.size>1024*1024){setStatus('Máximo 1 MB por archivo');return;}const imported=await file.text();if(isHtmlDocument(imported)){setStatus('Archivo HTML: App.tsx requiere código React TSX');return;}updateCode(mode==='three'?normalizeThreeCode(imported):imported);setSyncToken(token=>token+1);setStatus(`Importado: ${file.name}`)};
  return <div className={`app ${isDarkMode?'darkMode':''}`}>
    <header className="topbar">
      <div className="brand"><div className="brandIcon"><UserRound size={22}/></div><b>Character Studio</b></div>
      <div className="actions">
        <span className="status"><i/> {status}</span>
        <button onClick={reset}><Plus size={18}/><span>Nuevo</span></button>
        <button onClick={()=>uploadRef.current?.click()}><FolderOpen size={18}/><span>Abrir</span></button>
        <button onClick={saveLocal}><Save size={18}/><span>Guardar</span></button>
        <button onClick={download}><Upload size={18}/><span>Exportar</span></button>
        <button className="themeToggle" aria-label={isDarkMode?'Cambiar a modo claro':'Cambiar a modo oscuro'} title={isDarkMode?'Modo claro':'Modo oscuro'} onClick={()=>setIsDarkMode(value=>!value)}>
          {isDarkMode?<Sun size={18}/>:<Moon size={18}/>}
        </button>
        <input ref={uploadRef} type="file" accept=".tsx,.ts,.jsx,.js,.txt" hidden onChange={e=>{void upload(e.target.files?.[0]);e.target.value=''}} />
      </div>
    </header>
    <nav className="modebar" aria-label="Tipo de proyecto">
      <div className="tabs">{(['react','three','remotion'] as const).map(m=><button key={m} className={m===mode?'selected':''} aria-pressed={m===mode} onClick={()=>setMode(m)}>{m==='react'?<Code2 size={18}/>:m==='three'?<Box size={18}/>:<Film size={18}/>} {names[m]}</button>)}</div>
      <div className="toolbarRight"><span>Formato</span><select aria-label="Formato de vista previa" value={viewport} onChange={e=>setViewport(e.target.value as Viewport)}><option value="free">Libre</option><option value="vertical">9:16 Shorts</option><option value="square">1:1 Cuadrado</option></select></div>
    </nav>
    <main className="workspace">
      <aside className="examplesPane">
        <div className="sideHeading"><h2>Ejemplos</h2><span>3</span></div>
        <div className="exampleList">{(['react','three','remotion'] as const).map(m=><button key={m} className={`exampleCard ${m===mode?'active':''}`} aria-pressed={m===mode} onClick={()=>setMode(m)}>
          <span className={`exampleIcon ${m}`}>{m==='react'?<UserRound size={24}/>:m==='three'?<Box size={24}/>:<Film size={24}/>}</span><span className="exampleCopy"><b>{m==='react'?'Personaje Cartoon':m==='three'?'Personaje 3D':'Composición Remotion'}</b><small>{names[m]}</small></span>
        </button>)}</div>
        <div className="projectTip"><FileCode2 size={17}/><span>Elige un ejemplo para cambiar de entorno.</span></div>
      </aside>
      <div className="workbench">
        <SandpackProvider key={`${mode}-${syncToken}`} template="react-ts" files={files} customSetup={customSetup} theme={isDarkMode?'dark':'light'} options={{initMode:'immediate',autorun:true,recompileMode:'delayed',recompileDelay:500}}>
          <SandboxPersistence mode={mode} code={editorCode} syncToken={syncToken} onCode={updateCode}/>
          <section className="editorPane editorCard" aria-label="Editor de código">
            <div className="paneTitle editorTitle"><span><Code2 size={19}/><b>Personaje.tsx</b></span><div className="editorHeaderActions"><EditorSearch editorRef={editorRef} code={editorCode}/><span className="liveLabel"><i/> Edición en vivo</span></div></div>
            <SandpackLayout className="sandpackLayout"><div className="editorSlot"><SandpackCodeEditor ref={editorRef} initMode="immediate" showLineNumbers showTabs={false} wrapContent style={{height:'100%',minHeight:'520px'}} /></div></SandpackLayout>
          </section>
          <section className="previewPane previewCard" aria-label="Vista previa">
            <div className="paneTitle previewTitle"><span><MonitorPlay size={19}/><b>Vista previa</b></span><div className="previewActions"><span>{mode==='three'?'Arrastra · rueda zoom · clic derecho desplaza':mode==='remotion'?'Player animado':'Render en tiempo real'}</span><button type="button" className="previewRun" title="Compilar e iniciar el código actual" onClick={()=>setSyncToken(token=>token+1)}><Play size={14}/> Iniciar</button></div></div>
            <div className={`previewSpace ${viewport}`}><div className="previewFrame">{htmlDocument?<div className="formatWarning"><strong>Este contenido es un documento HTML</strong><span>App.tsx requiere un componente React TSX. Convierte el HTML a JSX/TSX o restaura el ejemplo.</span></div>:<SandpackPreview showNavigator={false} showRefreshButton showOpenInCodeSandbox={false} style={{height:'100%',width:'100%'}} />}</div></div>
          </section>
        </SandpackProvider>
      </div>
    </main>
    <footer><span className="footerStatus"><i/> {status} <span>·</span> {names[mode]}</span><span><Save size={14}/> Autosave en este navegador</span><span><Smartphone size={14}/> {viewport==='free'?'Vista libre':viewport==='square'?'1:1 Cuadrado':'9:16 Shorts'} <Maximize2 size={14}/></span></footer>
  </div>
}
