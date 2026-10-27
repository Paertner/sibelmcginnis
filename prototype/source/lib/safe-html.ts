import DOMPurify from "dompurify";
const tags=["p","br","div","span","strong","b","em","i","u","s","h1","h2","h3","h4","ul","ol","li","blockquote","a","img","table","thead","tbody","tfoot","tr","td","th","hr"];
export function safeHtml(value:string){
 const clean=DOMPurify.sanitize(value,{ALLOWED_TAGS:tags,ALLOWED_ATTR:["style","align","valign","width","height","role","href","title","target","rel","src","alt","colspan","rowspan","cellpadding","cellspacing","border"],FORBID_TAGS:["style","script","form","iframe","object","embed"]});
 const template=document.createElement("template");template.innerHTML=clean;
 template.content.querySelectorAll<HTMLElement>("[style]").forEach(el=>{if(/url\s*\(|expression|position\s*:|z-index|behavior\s*:/i.test(el.getAttribute("style")||""))el.removeAttribute("style")});
 template.content.querySelectorAll("a").forEach(el=>{el.setAttribute("rel","noopener noreferrer");el.setAttribute("target","_blank")});
 return template.innerHTML;
}
export const htmlText=(html:string)=>{const node=document.createElement("div");node.innerHTML=safeHtml(html);return(node.textContent||"").trim()};
export const escapeHtml=(text:string)=>{const div=document.createElement("div");div.textContent=text;return div.innerHTML.replaceAll('"','&quot;').replaceAll("'","&#39;")};
