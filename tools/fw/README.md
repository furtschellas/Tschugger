# Framework (Preact + htm)

`tools/base/09-fw.js` holds Preact 10.24.3, its hooks and htm 3.1.1 (both MIT), bundled once:

    npm i preact@10.24.3 htm@3.1.1 preact-render-to-string@6.5.11 esbuild@0.24.0
    npx esbuild tools/fw/entry.js --bundle --minify --format=iife --global-name=FWLIB --legal-comments=none --outfile=fw.js

and pasted into `09-fw.js` (the build needs no extra step). Components are plain JavaScript with `html` templates;
their types are JSDoc, checked by TypeScript in the tests.

A component is drawn into an island: a page returns `island("name", props)` in its HTML; after each drawing the
island gets the component (`ISLANDS.name`). The morphing of the page never touches the inside of an island.
