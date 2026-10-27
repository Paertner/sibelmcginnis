import type {AnchorHTMLAttributes} from "react";
import {previewHref} from "./navigation";
export default function Link({href="/",children,prefetch: _prefetch, ...props}:AnchorHTMLAttributes<HTMLAnchorElement> & {prefetch?:boolean}) {
  return <a {...props} href={previewHref(String(href))}>{children}</a>;
}
