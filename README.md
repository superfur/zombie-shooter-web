# 🎮 僵尸生存战 3D (Zombie Shooter Web)

一个使用 Web 技术构建的第一人称 3D 打僵尸游戏，支持 PC 和移动端（平板/手机）双平台。

![Game Screenshot](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 特性

### 🎯 核心玩法
- **第一人称视角**：沉浸式 3D 射击体验
- **多武器系统**：突击步枪、手枪、战术匕首
- **智能僵尸 AI**：自动寻路、主动攻击
- **部位伤害系统**：爆头造成 4 倍伤害
- **物理引擎**：真实的后坐力、弹道散射、墙壁碰撞

### 🎨 游戏系统
- **弹药管理**：换弹系统，自动/手动换弹
- **近战系统**：轻击/重击两种攻击模式
- **移动系统**：步行/冲刺双速模式
- **音效系统**：Web Audio API 实时合成音效
- **伤害反馈**：实时伤害数字显示

### 📱 跨平台支持
- **PC 端**：鼠标 + 键盘操作
- **移动端**：虚拟摇杆 + 触摸控制（和平精英风格）
- **自动适配**：根据屏幕尺寸自动切换操作模式

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn dev

# 构建生产版本
yarn build

# 预览生产构建
yarn preview
```

### 在线体验

访问 [GitHub Pages](https://superfur.github.io/zombie-shooter-web/) 在线游玩。

## 🎮 操作说明

### PC 端
- **WASD** - 移动
- **Shift** - 冲刺
- **空格** - 跳跃
- **鼠标左键** - 射击
- **鼠标右键** - 重击（持刀时）
- **R** - 换弹
- **1/2/3** - 切换武器（步枪/手枪/刀）

### 移动端
- **左下摇杆** - 移动（推满自动冲刺）
- **右半屏滑动** - 控制视角
- **右下红色按钮** - 射击
- **跳跃按钮** - 跳跃
- **R 按钮** - 换弹
- **切枪按钮** - 循环切换武器

## 🛠️ 技术栈

- **Three.js** - 3D 图形渲染引擎
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 现代化构建工具
- **Web Audio API** - 实时音效合成

## 📁 项目结构

```
game/
├── src/
│   ├── Game.ts          # 游戏主循环和场景管理
│   ├── Player.ts        # 玩家控制器（PC/移动端双模式）
│   ├── Enemy.ts         # 僵尸 AI 和攻击逻辑
│   ├── ModelFactory.ts  # 3D 模型工厂
│   ├── SoundManager.ts  # 音效管理器
│   └── main.ts          # 入口文件
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions 自动部署
├── index.html           # HTML 入口
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目依赖
```

## 🎯 游戏机制

### 武器系统
- **突击步枪**：全自动，30 发弹夹，伤害 10/发
- **手枪**：半自动，12 发弹夹，伤害 15/发
- **战术匕首**：近战武器，轻击 25 伤害，重击 50 伤害

### 伤害系统
- **头部**：4 倍伤害（爆头一击必杀）
- **身体**：标准伤害
- **四肢**：0.5 倍伤害

### 僵尸属性
- **血量**：20 HP
- **攻击力**：10 点/次
- **攻击间隔**：1.5 秒
- **攻击范围**：2 米

## 🔧 开发说明

### 添加新武器
1. 在 `ModelFactory.ts` 中创建武器模型
2. 在 `Player.ts` 的 `initWeapons()` 中注册武器
3. 配置武器属性（伤害、射速、弹夹容量等）

### 添加新音效
在 `SoundManager.ts` 中添加新的音效合成方法。

### 自定义地图
修改 `Game.ts` 中的 `generateMap()` 方法。

## 📝 许可证

MIT License

## 🙏 致谢

- [Three.js](https://threejs.org/) - 强大的 3D 库
- [Vite](https://vitejs.dev/) - 极速的开发体验

---

**享受游戏！** 🎮💀

