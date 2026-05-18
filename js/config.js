/* ═════════════════════════════════════════════════════════
   3D Project Tree — Config
   ★ 编辑这个文件来定制你的项目树 ★
   ═════════════════════════════════════════════════════════ */

// ═══ 1. 项目树数据（★ 替换这里为你自己的数据） ═══
const TREE_DATA = {
  name: 'my-project',
  icon: '📁',
  desc: '项目根目录',
  tag: 'project',
  children: [
    {
      name: 'src',
      icon: '💻',
      desc: '源代码目录',
      tag: 'source',
      children: [
        { name: 'index.js', icon: '📄', desc: '入口文件', tag: 'source' },
        { name: 'utils.js', icon: '📄', desc: '工具函数', tag: 'source' },
      ],
    },
    {
      name: 'docs',
      icon: '📄',
      desc: '文档',
      tag: 'doc',
      children: [
        { name: 'README.md', icon: '📋', desc: '项目说明', tag: 'doc' },
      ],
    },
    {
      name: 'package.json',
      icon: '🔧',
      desc: '项目配置',
      tag: 'config',
    },
  ],
};

// ═══ 2. 标签颜色映射 ═══
const TAG_COLORS = {
  project: '#6c5ce7',
  doc: '#0984e3',
  tool: '#00b894',
  model: '#fdcb6e',
  config: '#8888a0',
  source: '#e84393',
  skill: '#a29bfe',
  data: '#00cec9',
  // ★ 添加你自己的标签颜色
};

// ═══ 3. 布局与视觉配置 ═══
const TREE_CONFIG = {
  // 卡片尺寸
  compactH: 44,        // 未选中卡片高度
  expandedH: 112,      // 选中卡片高度
  gap: 28,             // 卡片间距
  compactWRatio: 0.62, // 未选中卡片宽度比例（相对于视口宽度）
  expandedWRatio: 0.74,// 选中卡片宽度比例
  compactWMax: 420,    // 未选中卡片最大宽度(px)
  expandedWMax: 560,   // 选中卡片最大宽度(px)
  leftPct: 8,          // 卡片左边界百分比
  leftOffset: 100,     // 卡片左边界额外偏移(px)

  // 3D 透视
  perspective: 500,    // CSS perspective 值
  rotateY: 26,         // Y轴旋转角度
  rotateZ: -1.5,       // Z轴旋转角度
  tiltPerOffset: -1.2, // 每偏离一个位置 X 轴倾斜系数

  // 选中效果
  focusedScale: 1.06,  // 选中卡片放大倍数
  focusedLiftY: -22,   // 选中卡片上浮像素
  focusedZIndex: 30,   // 选中卡片层级

  // 可见范围
  visibleRange: 30,    // 可见卡片范围（前后各多少张）
  fadePerOffset: 0.12, // 每偏离一个位置透明度衰减
  minOpacity: 0.3,     // 最小透明度
};

// ═══ 4. 手势控制配置 ═══
const GESTURE_CONFIG = {
  squeezeThreshold: 0.6,    // 握紧阈值
  pinchThreshold: 0.6,      // 捏合阈值
  pinchSqueezeGuard: 0.4,   // 捏合时握紧保护
  fistHoldMs: 1500,         // 握拳长按返回时间(ms)
  waveVelocity: 0.25,       // 挥手速度阈值
  gestureCooldown: 800,     // 手势冷却(ms)
  cameraWidth: 320,
  cameraHeight: 240,
};

// ═══ 5. 生命周期钩子（★ 在这里添加你的回调逻辑） ═══
const TREE_HOOKS = {
  /** 应用初始化完成 */
  onReady: () => {},

  /** 选中项改变时触发 */
  onFocusChange: (index, item) => {},

  /** 进入文件夹时触发 */
  onEnterFolder: (node) => {},

  /** 返回上一级时触发 */
  onGoBack: (node) => {},

  /** 回到根目录时触发 */
  onGoRoot: () => {},

  /** 卡片渲染完成后触发 */
  onRender: (items) => {},
};
