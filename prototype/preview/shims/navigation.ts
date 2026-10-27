import { useSyncExternalStore } from "react";
export const currentLocation = () => {
  const hash = window.location.hash.slice(1);
  return new URL(hash.startsWith("/") ? hash : "/",window.location.origin);
};
const subscribe = (callback:()=>void) => { window.addEventListener("hashchange",callback); return ()=>window.removeEventListener("hashchange",callback); };
export const usePathname = () => useSyncExternalStore(subscribe,()=>currentLocation().pathname,()=>"/");
export const previewHref = (href:string) => href.startsWith("/") && !href.startsWith("//") ? `#${href}` : href;
export function navigate(to:string) {
  if(window.location.hash === `#${to}`) window.dispatchEvent(new Event("preview-refresh"));
  else window.location.hash=to;
  return {ok:true,message:""};
}
export function redirect(to:string):never { const error = new Error("Preview navigation"); Object.assign(error,{previewRedirect:to}); throw error; }
export function notFound():never { throw Object.assign(new Error("Page not found"),{previewNotFound:true}); }
