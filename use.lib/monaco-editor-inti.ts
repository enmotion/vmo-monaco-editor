//@ts-ignore
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
//@ts-ignore
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
//@ts-ignore
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
//@ts-ignore
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
//@ts-ignore
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";

export function initMonacoEnvironment() {
  if (window.MonacoEnvironment == undefined) {
    window.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === "typescript" || label === "javascript")
          return new TsWorker(); //出于不明原因，vite打包会出现 过早已存在的复制问题，需要暂时注释该行代码
        if (label === "json") return new JsonWorker();
        if (label === "css") return new CssWorker();
        if (label === "html") return new HtmlWorker();
        return new EditorWorker();
      },
    };
  }
}