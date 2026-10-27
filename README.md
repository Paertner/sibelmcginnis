# Morning Coffee Community

Bu repository-də layihənin iki versiyası saxlanılır:

- `prototype/` — Vercel-də yayımlanacaq son interaktiv prototip. Ziyarətçi, Free, Premium və Admin rolları demo məqsədilə brauzerdə dəyişdirilə bilir.
- Repository root-u — Next.js tətbiqinin ilkin mərhələsi; üzvlük backend-i hələ qoşulmayıb.

## Vercel-də prototipi yayımlamaq

Vercel layihəsi yaradarkən **Root Directory** olaraq `prototype` seçin. Framework Vite kimi avtomatik aşkarlanmalıdır; build əmri `npm run build`, çıxış qovluğu `dist`-dir.

Prototip yalnız baxış və kliklənən demo üçündür. Dəyişikliklər həmin ziyarətçinin brauzerində saxlanır. Real istifadəçi hesabı, ödəniş, e-poçt və Zoom inteqrasiyası yoxdur.

## Lokal işə salmaq

```sh
cd prototype
npm ci
npm run dev
```
