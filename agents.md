# 小程序开发规则

## 项目概况

- **框架**: Taro v4.2 + React 18 + TypeScript
- **目标平台**: 微信小程序 (weapp) + H5
- **构建**: Webpack5 + SWC
- **样式**: Sass
- **状态管理**: React Context
- **路径别名**: `@/` → `src/`

---

## 组件开发规则

1. **禁止使用 DOM 原生标签** — 必须使用 Taro 组件 (`View`, `Text`, `Image`, `ScrollView`, `Navigator` 等)，禁止 `div`, `span`, `p`, `a`, `img` 等 HTML 标签。
2. **事件绑定用 Taro 语法** — 使用 `onClick`, `onTouchStart` 等 Taro 事件名，不要用 `onclick`, `onmousedown` 等 DOM 事件名。
3. **条件渲染使用三元/逻辑表达式** — 不要用 `v-if`/`v-show` (Vue 语法)，使用 `{condition && <View>...</View>}` 或 `{condition ? <A /> : <B />}`。
4. **列表渲染使用 map** — `{list.map(item => <View key={item.id}>{item.name}</View>)}`，必须提供 `key` 属性。
5. **样式隔离** — 每个组件的样式文件独立，类名建议用 BEM 或模块化命名避免全局污染。

## API 请求规则

1. **使用 Taro.request 发起请求** — 不要使用 `fetch` 或 `axios`，统一走 `@/api/index.ts` 中的 `api` 对象。
2. **请求/响应拦截** — Token 从 `Taro.getStorageSync('token')` 获取，自动注入 `Authorization` header。
3. **错误处理** — 所有 API 调用处需要 try-catch，statusCode >= 400 时抛出 `{ status, data }` 对象。
4. **本地存储** — 使用 `Taro.getStorageSync` / `Taro.setStorageSync`，不要使用 `localStorage`。

## 路由与导航规则

1. **使用 Taro 路由 API** — `Taro.navigateTo`, `Taro.switchTab`, `Taro.redirectTo`, `Taro.navigateBack`，不要使用 `react-router`。
2. **页面路径在 app.config.ts 中注册** — 新增页面必须在 `pages` 数组中声明。
3. **Tab 页使用 switchTab** — 跳转到 tabBar 页面必须用 `Taro.switchTab`。
4. **传参使用 url 参数** — `Taro.navigateTo({ url: '/pages/detail/index?id=1' })`，目标页用 `Taro.getCurrentInstance().router.params` 获取。

## 样式规则

1. **使用 Sass 编写样式** — 文件后缀 `.scss`，通过 `import './index.scss'` 引入。
2. **使用 Taro 的尺寸单位** — 使用 `px`（Taro 会自动转换为 rpx），或者使用 `Taro.pxTransform()` 方法。
3. **弹性布局优先** — 使用 Flexbox 布局 (`display: flex`)，兼容微信小程序和 H5。
4. **背景色/导航栏在 app.config.ts window 中配置**，不要在页面中重复设置。
5. **避免使用不支持的 CSS 选择器** — 微信小程序不支持 `*` 通配符、`::before`/`::after`（部分支持有限）、`::v-deep` 等，优先使用类选择器。

## 状态管理规则

1. **使用 React Context 管理全局状态** — 参考 `src/components/AuthStore/` 的上下文模式。
2. **避免引入 Redux/MobX** — 小程序包体积敏感，Context 足够应对当前需求。
3. **页面级状态使用 useState/useReducer** 管理，不要提升到全局 Context。

## 图片与资源规则

1. **图片使用 Taro 的 Image 组件** — `<Image src={url} mode="aspectFill" />`，mode 属性控制裁剪/缩放模式。
2. **静态资源放在 src/assets/ 目录**，通过相对路径或 `@/assets/` 引用。
3. **TabBar 图标放在 assets/ 根目录**，尺寸建议 81x81px（会自动适配）。

## 跨平台兼容规则

1. **条件编译使用 process.env.TARO_ENV** — `if (process.env.TARO_ENV === 'weapp') { ... }` 区分平台逻辑。
2. **避免使用浏览器特有 API** — `window`, `document`, `localStorage` 在微信小程序中不存在。
3. **H5 构建额外注意** — `dev:h5` / `build:h5` 命令编译为 Web 应用，但同样遵守上述组件命名规则。

## 性能规则

1. **长列表使用 VirtualList 或 ScrollView** — 微信小程序中避免一次性渲染大量节点。
2. **图片懒加载** — Image 组件设置 `lazyLoad` 属性。
3. **减少 setState 频率** — 小程序 setData 有性能开销，批量更新状态。
4. **代码分包** — 按 page 维度分包，首页和 tabBar 页面放在主包，其他页面可分包加载。

## 构建与开发规则

1. **开发微信小程序**运行 `npm run dev:weapp`，用微信开发者工具打开 `dist/` 目录。
2. **编译 H5**运行 `npm run dev:h5`，浏览器访问。
3. **新增页面**需要在 `src/app.config.ts` 的 `pages` 数组中注册路径。
4. **路径别名** `@/` 在 tsconfig 和 Taro 编译中均已配置，import 时使用 `@/components/xx` 而非相对路径。
