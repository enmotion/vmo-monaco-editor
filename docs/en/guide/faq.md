# FAQ & deployment

## The editor is blank

Import `vmo-monaco-editor/dist/style.css` once and give the component an explicit height, such as `style="height: 400px"`. If initialized in a hidden panel, check its layout after revealing it; use `refreshMonacoEditor()` if necessary.

## Workers fail to load

Enable the Monaco worker plugin in your Vite app. Verify production worker files and request URLs, including your application's `base` prefix. Code previews need the same worker setup.

## Values do not update

With `needConfirm=true`, edits stay internal until `commit()` (or diff `confirm()`). With `bidibind=false`, external changes are not synchronized into the internal model. The normal editor's `change` event fires on blur by default, while `update:modelValue` fires during editing.

## Confirming does not accept proposals

The diff `confirmedValue` is the original model. Accept the desired differences before confirming; confirmation does not implicitly accept remaining proposals or save to a backend.

## Themes and fullscreen

Monaco themes are global across instances. Fullscreen uses `Teleport` to `body` to avoid clipping by ancestors; adjust `zIndex` if needed. Prefix/suffix strings are rendered as HTML: use trusted content or slots with Vue interpolation for plain text.

## SSR and VitePress

Monaco depends on the browser. Dynamically import an editor demo after mounting rather than importing the library during server rendering:

```vue
<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
const EditorDemo = shallowRef()
onMounted(async () => {
  EditorDemo.value = (await import('./EditorDemo.vue')).default
})
</script>

<template>
  <component :is="EditorDemo" v-if="EditorDemo" />
</template>
```

Put the getting-started example in `EditorDemo.vue` and configure client-side workers. A `ClientOnly` wrapper alone does not prevent evaluation of a static Monaco import on the server.

## Develop the documentation

```bash
npm ci
npm run docs:dev
npm run docs:build
npm run docs:preview
```

Sources live in `docs/en/guide` and `docs/guide`. Both languages have matching navigation and local full-text search. These docs describe the current repository source at version `0.1.6`; verify feature availability when using an already published npm archive.

## GitHub Pages

`.github/workflows/docs.yml` builds and deploys on pushes to `master`, or manually through Actions. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The site is hosted at [enmotion.github.io/vmo-monaco-editor](https://enmotion.github.io/vmo-monaco-editor/). Its repository prefix is configured as `base: '/vmo-monaco-editor/'` in `docs/.vitepress/config.mts`. Change it when renaming the repository or using a custom domain. Build output is `docs/.vitepress/dist`.

See the [official VitePress deployment guide](https://vitepress.dev/guide/deploy) and the repository's Actions logs for deployment troubleshooting.
