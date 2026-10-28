import {SiteCopyProvider} from "../source/components/site-copy";
import {Buffer} from "buffer";
import {createRoot} from "react-dom/client";
import {useEffect,useState,type ReactNode} from "react";
import "../source/app/globals.css";
import "./share.css";
import Home from "../source/app/(site)/page";
import About from "../source/app/(site)/about/page";
import Membership from "../source/app/(site)/morning-coffee/page";
import Solutions from "../source/app/(site)/solutions/page";
import Blog from "../source/app/(site)/blog/page";
import Post from "../source/app/(site)/post/[id]/page";
import SessionNotes from "../source/app/(site)/session/[id]/page";
import Podcast from "../source/app/(site)/podcast/page";
import Contact from "../source/app/(site)/contact/page";
import Login from "../source/app/(site)/login/page";
import Join from "../source/app/(site)/join/page";
import Account from "../source/app/(site)/account/page";
import Admin from "../source/app/admin/[[...section]]/page";
import Meeting from "../source/app/(site)/meetings/[kind]/[id]/page";
import {Header,Footer} from "../source/components/site-chrome";
import {getUser,chooseRole} from "../source/lib/auth";
import {getStore,resetPreview,hydratePreviewImages} from "../source/lib/store";
import {currentLocation,navigate} from "./shims/navigation";
import {sessionEvent,bookingEvent} from "../source/lib/events";
import {createIcs} from "../source/lib/calendar";
import {emailDraft} from "../source/lib/announcements";
import {isPremium,type Role} from "../source/lib/access";
import {assetUrl,download} from "./assets";
(globalThis as unknown as {Buffer:typeof Buffer}).Buffer=Buffer;

async function renderRoute(){
 const location=currentLocation(),path=location.pathname,searchParams=Promise.resolve(Object.fromEntries(location.searchParams));
 if(path.startsWith("/admin"))return{node:await Admin({params:Promise.resolve({section:path.slice(7).split("/").filter(Boolean)}),searchParams}),role:(await getUser())?.role??"visitor"};
 let content:ReactNode;
 const params={searchParams};
 if(path==="/")content=await Home();
 else if(path==="/about")content=await About();
 else if(path==="/morning-coffee")content=await Membership();
 else if(path==="/solutions")content=await Solutions();
 else if(path==="/blog")content=await Blog(params);
 else if(path==="/podcast")content=await Podcast();
 else if(path==="/contact")content=Contact();
 else if(path==="/login")content=await Login();
 else if(path==="/join")content=await Join(params);
 else if(path==="/account")content=await Account(params);
 else if(path.startsWith("/session/"))content=await SessionNotes({params:Promise.resolve({id:decodeURIComponent(path.slice(9))})});
 else if(path.startsWith("/post/"))content=await Post({params:Promise.resolve({id:decodeURIComponent(path.slice(6))})});
 else if(path.startsWith("/meetings/")){const [, ,kind,id]=path.split("/");content=await Meeting({params:Promise.resolve({kind,id})});}
 else content=<div className="wrap empty-page"><h1>Page not found</h1><a href="#/">Back home</a></div>;
 return{node:<><a className="skip-link" href="#main-content">Skip to content</a>{await Header()}<main id="main-content">{content}</main><Footer/></>,role:(await getUser())?.role??"visitor"};
}

function applySiteSettings(){
 const settings=getStore().siteSettings;
 document.title=`${settings?.siteTitle||"Sibel McGinnis"} · Interactive prototype`;
 const icon=document.querySelector<HTMLLinkElement>("link[rel=icon]");
 if(icon)icon.href=settings?.faviconPath?assetUrl(settings.faviconPath):"/images/brand-cup.svg";
}

function App(){
 const[revision,setRevision]=useState(0),[view,setView]=useState<ReactNode>(null),[role,setRole]=useState<Role>("visitor"),[toast,setToast]=useState("");
 useEffect(()=>{
  const refresh=()=>setRevision(n=>n+1);let timer:ReturnType<typeof setTimeout>;
  const message=(event:Event)=>{setToast(String((event as CustomEvent).detail));clearTimeout(timer);timer=setTimeout(()=>setToast(""),4000)};
  window.addEventListener("hashchange",refresh);window.addEventListener("preview-refresh",refresh);window.addEventListener("preview-toast",message);
  return()=>{window.removeEventListener("hashchange",refresh);window.removeEventListener("preview-refresh",refresh);window.removeEventListener("preview-toast",message);clearTimeout(timer)};
 },[]);
 useEffect(()=>{
  let active=true;
  renderRoute().then(result=>{if(active){setView(result.node);setRole(result.role);applySiteSettings();const anchor=currentLocation().hash.slice(1);if(anchor)requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView());}}).catch(error=>{
   if(!active)return;
   if(error.previewRedirect){navigate(error.previewRedirect);return;}
   if(error.previewNotFound){setView(<div className="wrap empty-page"><h1>Post not found</h1><a href="#/blog">Back to blog</a></div>);return;}
   console.error(error);setView(<div className="wrap empty-page"><h1>Could not open this preview</h1><p>Please return home and try again.</p><button className="btn" onClick={()=>navigate("/")}>Back home</button></div>);
  });
  return()=>{active=false};
 },[revision]);
 return <><SiteCopyProvider values={getStore().siteCopy ?? {}}><div key={currentLocation().pathname}>{view??<div className="preview-loading" role="status">Preparing your Morning Coffee…</div>}</div></SiteCopyProvider><aside className="preview-switcher" aria-label="Prototype user switcher"><span className="preview-label">Prototype · view as</span>{([["visitor","Visitor"],["free","Free member"],["premium","Premium member"],["admin","Admin"]] as const).map(([key,label])=><button type="button" aria-pressed={role===key} key={key} onClick={async()=>{await chooseRole(key);navigate(key==="admin"?"/admin":key==="visitor"?"/":"/account");window.scrollTo({top:0,behavior:"instant"});}}>{label}</button>)}<button className="preview-reset" type="button" onClick={()=>{if(window.confirm("Reset this browser’s sample data?")){resetPreview();window.dispatchEvent(new Event("preview-refresh"));}}}>Reset demo</button></aside>{toast?<div className="preview-toast" role="status">{toast}</div>:null}</>;
}

document.addEventListener("click",async event=>{
 const anchor=(event.target as HTMLElement).closest("a");if(!anchor)return;
 const raw=anchor.getAttribute("href")||"",url=new URL(raw,window.location.href);
 if(url.origin!==window.location.origin)return;
 if(url.pathname.startsWith("/api/calendar/")){
  event.preventDefault();const user=await getUser();if(!user||!isPremium(user.role)){window.dispatchEvent(new CustomEvent("preview-toast",{detail:"Choose an active Premium member to add this event."}));return;}
  const [,, ,kind,id]=url.pathname.split("/"),data=getStore();
  const session=kind==="session"?data.sessions.find(s=>s.id===id):undefined;
  const booking=kind==="booking"?data.bookings.find(b=>b.id===id&&b.status==="confirmed"&&(b.memberId===user.id||user.role==="admin")):undefined;
  if(session||booking)download(createIcs(session?sessionEvent(session):bookingEvent(booking!)),"text/calendar;charset=utf-8","morning-coffee.ics");
  return;
 }
 if(url.pathname.startsWith("/api/announcements/")){
  event.preventDefault();if((await getUser())?.role!=="admin")return;const eml=emailDraft(url.pathname.split("/").at(-1)!);if(eml)download(eml,"message/rfc822","morning-coffee-draft.eml");return;
 }
 if(raw.startsWith("/")&&!raw.startsWith("//")){event.preventDefault();navigate(url.pathname+url.search+url.hash);}
});
if(!window.location.hash.startsWith("#/"))window.history.replaceState(null,"",`${window.location.pathname}#/`);
hydratePreviewImages().finally(() => createRoot(document.getElementById("root")!).render(<App/>));
