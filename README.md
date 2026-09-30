<p align="center">
  <h2 style="width:100%; text-align:center;">UDesk QProgram Template</h2>
</p>


## 1. 概述

统一客户端应用平台(UDesk) for QProgram 模板工程(**udesk-qprogram-template**)基于 UDesk 移动 H5 框架构建，是一个使用 Vue 技术栈(vue、vue-router、vuex)实现的单页应用，内置了动态路由、状态管理、权限验证、异步请求、前端数据模拟(Mock)、个性化设置等单页应用必需模块，集成了 UMAP 平台 JSAPI、轻云平台 Client-SDK，适合用于应用系统正式研发轻程序，支持 UMAP QuickStart APP 等渠道访问。

轻程序 + 轻云的交易样例学习，请使用 UDesk for QProgram 样板工程(udesk-mobile-boilerplate)。

### 2. 文档

请浏览 [轻程序](http://dt.abc/knowledge/1521/47356)。

## 3. 起步

### 3.1. 申请使用

请浏览 [平步轻云试验场](http://qcloud.test.abc:224/easy/index.html) 组建团队报名参加**研发中心2020年“平步轻云”团队编程挑战赛**，相关资源将在报名截止后统一下发。

### 3.2. 环境配置

在安装项目依赖之前，必须在本地安装 Node 开发环境。

#### 3.2.1. 安装 Node

Node 是一个基于 Chrome V8 引擎的 JavaScript 运行环境，默认已包含组件包管理工具 NPM。办公网环境可下载 Win32 平台 64 位 10.14.2 版本安装包：<a href="http://qcloud.test.abc:224/downloads/QCloudIDE/node-v10.14.2-x64.msi" target="_blank">node-v10.14.2-x64.msi</a> 。


安装完成后，在命令行依次输入：

```bash
node -v
npm -v
```

出现如下图所示版本号信息，则安装成功。

![picture](http://dt.abc/diting_back/api/rest/outservice/ufile/acfc036da2b74198b9ad18bdc9118a449900008820201022)

如提示未找到命令，请检查安装路径是否已加入本地系统 `Path` 变量。


然后配置 NPM 仓库源地址为行内制品测试库，在终端界面执行以下命令：

```bash
npm config set registry http://zpk.abc/artifactory/api/npm/npm-test/
```

然后再执行 `npm login` 命令，依次输入如下用户名密码等信息：

```bash
# 登录 NPM
npm login
Username: deploy
PassWord: deploy123!
Email:（this IS public）abc@abchina.com
```

当命令行提示 401 或 403 错误时，通常为账号或密码输入错误，请重新输入。

#### 3.2.2. 安装 node-sass

node-sass 是一种用于编译 SASS/LESS 样式代码的工具。由于网络原因，node-sass 无法从 NPM 仓库直接安装，需要使用离线包进行安装。

##### 下载

**注意：**node-sass 的版本必须与本地 Node 版本匹配：

- Node 建议使用 Win32 平台 64 位 10.14.2 版本，点击下载对应的 node-sass 离线包：<a href="http://qcloud.test.abc:224/downloads/QCloudIDE/win32-x64-64_binding.node" target="_blank">win32-x64-64_binding.node</a>
- 若开发者的 Node 为 Win32 平台 64 位 12.16.x 版本 ，点击下载对应的 node-sass 离线包：<a href="http://dt.abc/diting_back/api/rest/outservice/ufile/6965ce7734a3457ab3e908fc5609e24f9900008820201026" title="win32-x64-72_binding.node" target="_blank">win32-x64-72_binding.node</a>

##### 安装

1. 将 **.node** 文件放在本地一个自定义目录下，**注意路径不应包含任何中文字符、中文符号或空格**，如：

```bash
D:\node-sass\win32-x64-64_binding.node
```

2. 向 npm 设置 node-sass 的离线包路径，在命令行执行：

```bash
npm config set sass_binary_path D:\node-sass\win32-x64-64_binding.node
npm config set sass_binary_site D:\node-sass\win32-x64-64_binding.node
```

3. 执行以下命令查看设置后的路径，核对是否正确，**注意路径不应包含任何中文字符、中文符号或空格**。

```bash
npm config get sass_binary_path
npm config get sass_binary_site
```

### 3.3. 创建轻程序工程

请使用轻云 IDE 的工程创建功能，创建一个轻程序模板工程。

### 3.4. 安装依赖

请使用轻云 IDE 的依赖安装功能，安装工程的第三方依赖。

### 3.5. 启动工程

请使用轻云 IDE 的运行功能，启动工程。

启动成功后，将自动在默认浏览器打开 <a href="http://localhost:9527" target="_blank">http://localhost:9527</a> 页面（默认为一个空白页）。

### 3.6. 构建工程

请使用轻云 IDE 的构建功能，将前端工程构建打包为对应的静态资源。

### 3.6. 发布工程

请使用轻云 IDE 的发布功能，将前端静态资源发布至轻云站点服务。

## 4. AI 智能助手模块（云虾大模型对话）

模板新增「AI 智能助手」对话模块（`src/views/chat`），对接 `yuerong-java` 后端，并经其代理云虾（oneagent）平台的 Message / Files 接口。

### 4.1 功能

- 多会话管理：会话记录抽屉（新建/切换/重命名/删除），首条消息自动生成标题
- 流式过程展示：技能加载（skill_loaded）、工作流调用（workflow_called）等进度实时展示
- 附件上传/下载：上传后同步写入云虾会话 Workspace（Agent 按工作区相对路径读取），下载经后端代理
- 演示登录：进入对话页自动调用 `/api/v1/auth/demo-login`（首版仅演示身份）

### 4.2 本地联调

1. 启动后端（默认端口 18080）：见 `../yuerong-java/README.md`
2. 启动前端：`npm run dev`。`.env.development` 已配置 `VUE_APP_PROXY_TARGET=http://127.0.0.1:18080`，`/dev-api` 请求经 devServer 转发到后端；未配置该变量时回落为模板原有的本地 mock 代理行为
3. 打开首页（掌银UI组件页）顶部「AI 智能助手」入口，或访问 `/chat`

说明：

- 应用事件协议（SSE，POST 携带 JSON）：`run.started / run.progress / answer.completed / run.completed / run.failed / run.unknown`；前端按 `sequence` 去重，断流或未收到终止事件按「结果未知」提示（不自动重发）
- 相关代码：`src/api/chat.js`（REST）、`src/api/chatStream.js`（SSE 流）、`src/utils/sseParser.js`（帧解析）、`src/store/modules/chat.js`（状态）
- 生产部署时由网关/反向代理将 `VUE_APP_BASE_API`（如 `/prod-api`）转发到后端

### 4.3 测试与构建

- 单元测试：`npm run test:unit`（新增 `tests/unit/utils/sseParser.spec.js`）
- 构建：`npm run build:test` / `npm run build:prod`，产物分别为 `dist_test/` / `dist_prod/`

注：`tests/unit/components/SvgIcon.spec.js` 与 `tests/unit/utils/validate.spec.js` 引用本模板中不存在的模块（模板遗留问题），先于本次改动即失败。
