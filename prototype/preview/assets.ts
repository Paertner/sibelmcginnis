import {getDemoState} from "../source/lib/store";
const urls=new WeakMap<object,string>();
export function assetUrl(path:string){
 const id=path.split("/").at(-1)!,state=getDemoState();
 const asset=path.startsWith("/api/audio/")?state.audio.get(id):(path.startsWith("/api/announcement-image/")||path.startsWith("/api/site-image/"))?state.images.get(id):undefined;
 if(!asset)return path;
 let url=urls.get(asset);if(!url){url=URL.createObjectURL(new Blob([asset.bytes],{type:asset.type}));urls.set(asset,url)}return url;
}
export function download(content:string,type:string,name:string){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
