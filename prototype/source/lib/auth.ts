import {getStore,persistPreview} from "./store";
import {memberRole} from "./membership";
import {redirect} from "next/navigation";
import type {User,Role} from "./access";
const KEY="mcc-share-persona-v1";
let fallbackId:string|null=null;
export const previewId = () => {try{return sessionStorage.getItem(KEY)||fallbackId}catch{return fallbackId}};
export async function getUser():Promise<User|null> {
  const id=previewId();
  if(id==="admin")return{id,name:"Sibel McGinnis",email:"sibel@example.com",role:"admin"};
  const member=getStore().members.find(m=>m.id===id && m.status==="active");
  return member?{id:member.id,name:member.name,email:member.email,role:memberRole(member)}:null;
}
export async function setDemoSession(id:string){fallbackId=id;try{sessionStorage.setItem(KEY,id)}catch{}persistPreview();}
export async function clearSession(){fallbackId=null;try{sessionStorage.removeItem(KEY)}catch{} }
export async function requireMember(){const user=await getUser();if(!user)redirect("/login");return user!;}
export async function requireAdmin(){const user=await requireMember();if(user.role!=="admin")redirect("/account");return user;}
export async function chooseRole(role:Role) {
 if(role==="visitor"){await clearSession();return;}
 const id=role==="admin"?"admin":role==="premium"?"m1":"m0";
 const member=getStore().members.find(m=>m.id===id);
 if(member){member.status="active";member.tier=role;member.premiumUntil=role==="premium"?new Date(Date.now()+30*86400000).toISOString():"";}
 await setDemoSession(id);
}
