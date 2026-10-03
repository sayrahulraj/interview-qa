# interview-qa: complete overlay (Parts 1 to 4)

1. Create the project (Node 22.22.3+ or 24.15.0+):
   npx @angular/cli@latest new interview-qa --style=scss --routing --ssr=false --strict
   cd interview-qa
   npm install marked dompurify highlight.js mermaid @angular/service-worker

2. Delete src/app/app.spec.ts (it tests the default template).

3. Unzip this archive into the project root, overwriting the generated files.

4. node scripts/enable-sw.mjs
   ng serve

See README.md for adding questions, diagrams, the admin credential and the Vercel deployment.
