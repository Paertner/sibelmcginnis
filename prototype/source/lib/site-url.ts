export const siteOrigin=()=>window.location.origin;
export const meetingPath=(kind:"session"|"booking",id:string)=>`/meetings/${kind}/${encodeURIComponent(id)}`;
export const meetingUrl=(kind:"session"|"booking",id:string)=>`${window.location.origin}${window.location.pathname}#${meetingPath(kind,id)}`;
