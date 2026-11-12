/** Module hook for frontend tests: CSS imports are build-time assets in Vite, so they load as empty modules here. */
const CSS_URL = /\.css(?:\?.*)?$/;

export async function load(url, context, nextLoad) {
  if (CSS_URL.test(url)) return { format: "module", source: "export default \"\";", shortCircuit: true };
  return nextLoad(url, context);
}
