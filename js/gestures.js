/* ═════════════════════════════════════════════════════════
   3D Project Tree — Hand Gesture Control (MediaPipe Hands)
   不用修改这个文件，定制请编辑 config.js 中的 GESTURE_CONFIG
   ═════════════════════════════════════════════════════════ */

const GC = GESTURE_CONFIG;
let gestureEnabled = false;
let lastGestureAction = 0;

const gestureBtn = document.getElementById('gesture-btn');
const camWrap = document.getElementById('cam-wrap');
const camVideo = document.getElementById('cam-video');
const camCanvas = document.getElementById('cam-canvas');
const camCtx = camCanvas.getContext('2d');

let hands = null;
let camStream = null;
let gestureLoopId = null;
let lastLandmarks = null;

gestureBtn.addEventListener('click', async () => {
  gestureEnabled ? await disableGesture() : await enableGesture();
});

async function enableGesture() {
  if (!window.Hands) {
    gestureBtn.classList.add('err');
    gestureBtn.textContent = '✋ 模型库未加载';
    console.error('[手势] @mediapipe/hands 未加载 — CDN 可能被屏蔽');
    setTimeout(() => {
      gestureBtn.textContent = '✋ 手势';
      gestureBtn.classList.remove('err');
    }, 4000);
    return;
  }

  gestureBtn.classList.add('loading');
  gestureBtn.textContent = '⏳ 开启摄像头...';

  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: GC.cameraWidth }, height: { ideal: GC.cameraHeight } },
      audio: false,
    });
    camVideo.srcObject = camStream;
    await camVideo.play();
    gestureBtn.textContent = '⏳ 加载模型...';

    camCanvas.width = GC.cameraWidth;
    camCanvas.height = GC.cameraHeight;
    camWrap.classList.add('on');

    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        lastLandmarks = results.multiHandLandmarks[0];
      } else {
        lastLandmarks = null;
      }
    });

    gestureEnabled = true;
    gestureBtn.classList.remove('loading');
    gestureBtn.classList.add('on');
    gestureBtn.textContent = '✋ 手势开';

    gestureLoop();

  } catch (err) {
    console.error('[手势] 初始化失败:', err);
    gestureBtn.classList.remove('loading');
    gestureBtn.classList.add('err');
    gestureBtn.textContent = '✋ 不可用';
    if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
    camWrap.classList.remove('on');
    setTimeout(() => {
      gestureBtn.classList.remove('err');
      gestureBtn.textContent = '✋ 手势';
    }, 5000);
  }
}

async function disableGesture() {
  gestureEnabled = false;
  gestureBtn.classList.remove('on', 'loading', 'err');
  gestureBtn.textContent = '✋ 手势';
  camWrap.classList.remove('on');
  if (gestureLoopId) { cancelAnimationFrame(gestureLoopId); gestureLoopId = null; }
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  hands = null;
  lastLandmarks = null;
}

// ═══ Gesture state ═══
let isProcessing = false;
let prevGestureState = 'open';
let stateChangedAt = 0;
let grabArmed = false;
let backTriggered = false;
let handYHistory = [];

function gestureLoop() {
  if (!gestureEnabled) return;

  camCtx.clearRect(0, 0, GC.cameraWidth, GC.cameraHeight);
  camCtx.save();
  camCtx.translate(GC.cameraWidth, 0);
  camCtx.scale(-1, 1);
  camCtx.drawImage(camVideo, 0, 0, GC.cameraWidth, GC.cameraHeight);
  camCtx.restore();

  if (lastLandmarks) {
    drawLandmarks(lastLandmarks);
    processGesture(lastLandmarks);
  } else {
    camCtx.fillStyle = 'rgba(255,255,255,0.2)';
    camCtx.font = '11px Inter, sans-serif';
    camCtx.fillText('伸出手在摄像头前', 10, 22);
  }

  if (!isProcessing && hands && camVideo.readyState >= 2) {
    isProcessing = true;
    hands.send({ image: camVideo }).finally(() => { isProcessing = false; });
  }

  gestureLoopId = requestAnimationFrame(gestureLoop);
}

function drawLandmarks(lm) {
  const conn = [
    [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]
  ];
  camCtx.strokeStyle = 'rgba(108,92,231,0.35)';
  camCtx.lineWidth = 1;
  conn.forEach(([a, b]) => {
    camCtx.beginPath();
    camCtx.moveTo((1 - lm[a].x) * GC.cameraWidth, lm[a].y * GC.cameraHeight);
    camCtx.lineTo((1 - lm[b].x) * GC.cameraWidth, lm[b].y * GC.cameraHeight);
    camCtx.stroke();
  });

  lm.forEach((p, i) => {
    const x = (1 - p.x) * GC.cameraWidth, y = p.y * GC.cameraHeight;
    camCtx.fillStyle = [4, 8].includes(i) ? '#fd79a8' : '#6c5ce7';
    camCtx.beginPath();
    camCtx.arc(x, y, [4, 8].includes(i) ? 5 : 2.5, 0, Math.PI * 2);
    camCtx.fill();
  });
}

// ─── Helpers ───
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function getSqueezePressure(lm) {
  const tips = [8, 12, 16, 20], bases = [5, 9, 13, 17], wrist = lm[0];
  let closed = 0;
  for (let i = 0; i < 4; i++)
    if (d(lm[tips[i]], wrist) < d(lm[bases[i]], wrist) * 1.15) closed++;
  if (d(lm[4], lm[5]) < d(lm[2], lm[5]) * 1.25) closed++;
  return closed / 5;
}

function getPinchPressure(lm) {
  const dist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
  const handSize = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 0.01;
  const ratio = dist / handSize;
  return Math.max(0, Math.min(1, 1 - ratio / 0.6));
}

function getHandCenter(lm) {
  return { x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 };
}

function processGesture(lm) {
  const now = performance.now();
  const squeeze = getSqueezePressure(lm);
  const pinch = getPinchPressure(lm);
  const hintEl = document.getElementById('gesture-state');

  let curState = 'ambiguous';
  if (squeeze >= GC.squeezeThreshold) curState = 'fist';
  else if (pinch >= GC.pinchThreshold && squeeze < GC.pinchSqueezeGuard) curState = 'pinch';
  else if (squeeze < 0.3 && pinch < 0.3) curState = 'open';

  if (curState !== prevGestureState) {
    if (curState === 'ambiguous') {
      // don't update state
    } else {
      const dur = now - stateChangedAt;

      if (prevGestureState === 'fist' && dur >= GC.fistHoldMs && !backTriggered && !isTransitioning && navStack.length > 1) {
        backTriggered = true;
        goBack();
        lastGestureAction = now;
        if (hintEl) hintEl.textContent = '✊ 返回';
      }

      if (prevGestureState === 'open' && curState === 'pinch') {
        grabArmed = true;
      }

      if (prevGestureState === 'pinch' && curState !== 'fist' && grabArmed && dur < 1000) {
        if (!isTransitioning && currentItems[focusIndex]) {
          enterFolder(currentItems[focusIndex]);
          lastGestureAction = now;
          if (hintEl) hintEl.textContent = '🤏 进入';
        }
        grabArmed = false;
      }

      if (prevGestureState === 'fist' && curState !== 'fist') {
        backTriggered = false;
      }

      if (curState === 'fist') {
        grabArmed = false;
      }

      prevGestureState = curState;
      stateChangedAt = now;
      handYHistory = [];
    }
  }

  if (curState === 'fist' && !backTriggered && now - stateChangedAt > GC.fistHoldMs) {
    if (!isTransitioning && navStack.length > 1) {
      backTriggered = true;
      goBack();
      lastGestureAction = now;
      if (hintEl) hintEl.textContent = '✊ 返回';
    }
  }

  if (curState === 'open') {
    const cy = getHandCenter(lm).y;
    handYHistory.push({ y: cy, t: now });
    if (handYHistory.length > 12) handYHistory.shift();

    if (handYHistory.length >= 6) {
      const f = handYHistory[0], l = handYHistory[handYHistory.length - 1];
      const dt = (l.t - f.t) / 1000;
      if (dt > 0.06) {
        const vel = (l.y - f.y) / dt;
        const absVel = Math.abs(vel);
        if (absVel > GC.waveVelocity) {
          const interval = Math.max(40, 150 - absVel * 40);
          if (now - lastGestureAction > interval) {
            if (vel < 0) scrollDown();
            else scrollUp();
            lastGestureAction = now;
            handYHistory = [{ y: cy, t: now }];
          }
        }
      }
    }
  }

  // Overlay labels
  let label = '🖐';
  if (curState === 'fist') label = `✊ ${(squeeze*100).toFixed(0)}%`;
  else if (curState === 'pinch') label = `🤏 ${(pinch*100).toFixed(0)}%`;
  else if (curState === 'open') {
    if (handYHistory.length >= 6) {
      const f = handYHistory[0], l = handYHistory[handYHistory.length - 1];
      const vel = (l.y - f.y) / ((l.t - f.t) / 1000);
      label = Math.abs(vel) > GC.waveVelocity
        ? (vel < 0 ? '👆 上挥' : '👇 下挥')
        : '🖐 静止';
    } else {
      label = '🖐 张开';
    }
  }

  // Pressure bars
  const barW = 80, barH = 6;
  camCtx.fillStyle = 'rgba(0,0,0,0.4)';
  camCtx.fillRect(8, 28, barW, barH);
  camCtx.fillStyle = '#6c5ce7';
  camCtx.fillRect(8, 28, barW * Math.min(squeeze, 1), barH);
  camCtx.fillStyle = '#00b894';
  camCtx.fillRect(8, 36, barW * Math.min(pinch, 1), barH);
  camCtx.fillStyle = 'rgba(255,255,255,0.25)';
  camCtx.font = '6px Inter, sans-serif';
  camCtx.fillText(`捏 ${(squeeze*100).toFixed(0)}% 合 ${(pinch*100).toFixed(0)}%`, 8, 50);

  camCtx.fillStyle = '#fff';
  camCtx.font = '13px Inter, sans-serif';
  camCtx.fillText(label, 10, 22);
}
