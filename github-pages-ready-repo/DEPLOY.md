# 公网访问部署说明

这个价格计算器是静态网站，部署时只需要上传下面这些文件：

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`

推荐方式：

1. Netlify Drop：打开 `https://app.netlify.com/drop`，把整个文件夹拖进去，会得到一个公网网址。
2. Cloudflare Pages：新建 Pages 项目，上传这些静态文件，会得到一个公网网址。
3. GitHub Pages：把这些文件放到一个 GitHub 仓库，开启 Pages。

注意：

- 目前价格会保存在网站文件和浏览器本地数据里。换设备访问公网网站时，会读取网站内置价格。
- 后续如果你在浏览器里新增或修改价格，点“导出价格数据”可以备份；如果要让公网版本也更新，需要把新数据同步进网站文件后重新部署。
