import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
export default defineConfig({
  plugins:[tailwindcss()],
  resolve:{alias:[
    {find:"@",replacement:path.resolve("source")},
    {find:"server-only",replacement:path.resolve("preview/shims/empty.ts")},
    {find:"node:crypto",replacement:path.resolve("preview/shims/crypto.ts")},
    {find:"next/link",replacement:path.resolve("preview/shims/link.tsx")},
    {find:"next/image",replacement:path.resolve("preview/shims/image.tsx")},
    {find:"next/navigation",replacement:path.resolve("preview/shims/navigation.ts")},
    {find:"next/cache",replacement:path.resolve("preview/shims/cache.ts")},
  ]},
  esbuild:{jsx:"automatic"},
  define:{"process.env.NODE_ENV":JSON.stringify("production")},
  build:{outDir:"dist",emptyOutDir:true,chunkSizeWarningLimit:1000},
});
