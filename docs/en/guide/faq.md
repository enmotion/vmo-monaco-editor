# FAQ & deployment

## Independent view and content state

Both editors expose `viewMode: 'edit' | 'preview'` through `v-model:view-mode`, `update:viewMode` and `view-mode-change`. The diff editor additionally exposes `editMode: 'original' | 'modified' | 'diff'` through `v-model:edit-mode`, `update:editMode` and `edit-mode-change`. Changing one never changes the other. `diffViewMode` only selects the comparison layout; `previewSource` only selects the preview draft. Props initialize state and real parent changes synchronize it; without writeback local changes persist.

Both editors provide the same `default`, `prefix`, `preview`, and `suffix` slots. The preview payload is `{ content, language, source, theme }`; the ordinary editor's source is always `original`. Preview requires a preview slot. Removing it returns to `edit` while retaining the diff editor's `editMode`. The ordinary editor preserves its Monaco instance and draft across view changes.

`displayMode`, `currentDisplayMode`, and `changeDisplayMode` are deprecated compatibility interfaces on the diff editor. The current value is a derived projection: preview when viewMode is preview, otherwise editMode. Explicit new props take priority for their own dimension. New integrations should bind the separate states.

```vue
<VmoMonacoEditor v-model="body" v-model:view-mode="viewMode">
  <template #preview="{ content, language, source, theme }">
    <VmoPlainTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoEditor>
<VmoMonacoDiffEditor
  v-model:original-value="body" v-model:modified-value="proposal"
  v-model:view-mode="viewMode" v-model:edit-mode="editMode">
  <template #preview="{ content, language, source, theme }">
    <VmoPlainTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoDiffEditor>
```


## The editor is blank

Import `vmo-monaco-editor/dist/style.css` once and give the component an explicit height, such as `style="height: 400px"`. If initialized in a hidden panel, check its layout after revealing it; use `refreshMonacoEditor()` if necessary.

## Workers fail to load

Enable the Monaco worker plugin in your Vite app. Verify production worker files and request URLs, including your application's `base` prefix. Code previews need the same worker setup.

## Values do not update

With `needConfirm=true`, edits stay internal until `commit()` (or diff `confirm()`). With `bidibind=false`, external changes are not synchronized into the internal model. The normal editor's `change` event fires on blur by default, while `update:modelValue` fires during editing.

## State changes do not update the parent

The default toolbar changes state through editor APIs; `VmoMonacoUi` does not forward control interaction events. Bind on the editor with `v-model:view-mode`, `v-model:edit-mode`, `v-model:preview-source`, `v-model:diff-view-mode`, `v-model:monaco-options`, `v-model:diff-options` and `v-model:full-screen`, or listen to the corresponding `update:*` events and read `$event`. The normal editor supports `view-mode`, `monaco-options` and `full-screen`; it has no diff content selection.

Without parent writeback, local changes remain effective. Only actual external changes override them: assigning the same value or an equivalent options object does not reset local choices. `needConfirm`/`bidibind` do not control state events. Standalone setting controls support `v-model:value`; font size and language also support `v-model`. See [toolbar state bindings](./toolbar#state-bindings).

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
