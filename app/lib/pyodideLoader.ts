declare global {
  interface Window {
    loadPyodide: any;
  }
}

let scriptLoadedPromise: Promise<void> | null = null;
let loadingPyodidePromise: Promise<any> | null = null;
let pyodideInstance: any = null;

function waitForScript() {
  if (!scriptLoadedPromise) {
    scriptLoadedPromise = new Promise((resolve) => {
      if (window.loadPyodide) {
        resolve();
      } else {
        // Aguarda o script carregar (já incluso no layout)
        const check = setInterval(() => {
          if (window.loadPyodide) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      }
    });
  }
  return scriptLoadedPromise;
}

export async function getPyodide() {
  if (pyodideInstance) {
    return pyodideInstance;
  }
  if (!loadingPyodidePromise) {
    loadingPyodidePromise = (async () => {
      await waitForScript(); // garante que window.loadPyodide está disponível
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/"
      });
      await pyodide.loadPackage(["numpy", "scipy", "pandas"]);
      pyodideInstance = pyodide;
      return pyodide;
    })();
  }
  return loadingPyodidePromise;
}