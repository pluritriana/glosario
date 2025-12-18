
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/glosario/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/glosario"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 7448, hash: '8f6fcffb3831b547b4ebd653cc214902a973fc3396a5bb5662793dc6048a732b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 967, hash: 'b03b14b97fadcf6f697566aae43521c769eafec777289d9210c17dfba4c22e06', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 15865, hash: 'dd86ccc44814b0dcfac1c54ef4cce9782f046a869729feb81162065ace9a3ba7', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-OR5WSFIV.css': {size: 21036, hash: 'tERhyhMUUdg', text: () => import('./assets-chunks/styles-OR5WSFIV_css.mjs').then(m => m.default)}
  },
};
