window.drawBalanceChart = function drawBalanceChart(canvas, history, baselineUsd) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, Math.floor(rect.width || 320));
  const height = 140;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const pts = (history && history.length > 0)
    ? history.map((p) => Number(p.value))
    : [Number(baselineUsd || 36), Number(baselineUsd || 36)];

  const minV = Math.min(...pts) * 0.995;
  const maxV = Math.max(...pts) * 1.005;
  const span = Math.max(1, maxV - minV);

  // Grid line
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Line
  ctx.strokeStyle = "#3fb950";
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach((val, idx) => {
    const x = pts.length === 1 ? width : (idx / (pts.length - 1)) * (width - 16) + 8;
    const y = height - 16 - ((val - minV) / span) * (height - 32);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#8b949e";
  ctx.font = "11px monospace";
  ctx.fillText(`PAPER baseline $${Number(baselineUsd || 36).toFixed(2)}`, 8, 16);
};
