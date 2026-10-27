import type {ImgHTMLAttributes} from "react";
import {assetUrl} from "../assets";
export default function Image({fill,priority,unoptimized: _unoptimized,quality: _quality,sizes,...props}:ImgHTMLAttributes<HTMLImageElement> & {fill?:boolean;priority?:boolean;unoptimized?:boolean;quality?:number}) {
  return <img {...props} src={props.src?.startsWith("/api/") ? assetUrl(props.src) : props.src} sizes={sizes} loading={priority ? "eager" : props.loading ?? "lazy"} style={fill ? {position:"absolute",inset:0,width:"100%",height:"100%",...props.style} : props.style} />;
}
