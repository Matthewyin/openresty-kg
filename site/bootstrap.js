(() => {
  const unavailable = text => {
    const status = document.getElementById('global-status');
    status.textContent = text;
    status.classList.add('error');
    document.getElementById('edition').textContent = '站点未启动';
    document.getElementById('query-form').addEventListener('submit', event => {
      event.preventDefault();
      document.getElementById('query-status').textContent = text;
    });
  };
  // file:// 下模块脚本可能完全不执行，启动提示不能依赖模块自身的 catch。
  if (location.protocol === 'file:') {
    unavailable('当前是本地文件预览，查询尚未启动。请在项目目录运行 npm run build，再运行 npm run preview，打开输出的 HTTP 地址。site/ 是源码目录，实际站点在 dist/。');
    return;
  }
  import('./app.mjs').catch(() => unavailable('页面脚本加载失败。请确认托管的是构建后的 dist/，且 app.mjs 与 src/ 文件可读取；本地预览请运行 npm run build 和 npm run preview。'));
})();
