
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 7439, hash: '0de0cecce23791df8495ea5a122b3c901a71843b42cb142aedc044ae486b5b01', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 958, hash: 'aa473f08ec2e8626123652708a5ef1c817d1cd46f26475b028ff28cd653bec7b', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 15856, hash: '76ab2e94c22c210040099a601b6dae56afc6e012f158daa78246d53ff874d368', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-OR5WSFIV.css': {size: 21036, hash: 'tERhyhMUUdg', text: () => import('./assets-chunks/styles-OR5WSFIV_css.mjs').then(m => m.default)}
  },
};
