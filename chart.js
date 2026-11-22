(() => {
  const reducedMotion = () =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let prevPointCount = 0;
  let animFrame = null;

  function sizeCanvas(canvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = canvas.clientWidth || 358;
    const height = canvas.clientHeight || 180;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  function renderBalanceFrame(canvas, points, startingUsd, marks, progress) {
    const { ctx, width, height } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const startVal = Number(startingUsd || 36);
    const values = points.map((p) => Number(p.value));
    const allVals = values.length ? values.concat([startVal]) : [startVal];
    let minVal = Math.min(...allVals);
    let maxVal = Math.max(...allVals);
    if (maxVal - minVal < Math.max(1, startVal * 0.04)) {
      const pad = Math.max(1, startVal * 0.04);
      minVal = startVal - pad;
      maxVal = startVal + pad;
    } else {
      const span = maxVal - minVal;
      minVal -= span * 0.14;
      maxVal += span * 0.24;
    }

    const padTop = 28;
    const padBottom = 14;
    const padX = 4;
    const plotW = Math.max(1, width - padX * 2);
    const plotH = Math.max(1, height - padTop - padBottom);
    const yFor = (v) => padTop + (1 - (v - minVal) / (maxVal - minVal)) * plotH;

    // Dashed start line
    const startY = yFor(startVal);
    ctx.save();
    ctx.strokeStyle = "rgba(235, 235, 245, 0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, startY);
    ctx.lineTo(width - padX, startY);
    ctx.stroke();
    ctx.restore();

    if (!values.length) {
      return;
    }

    const coords = values.map((v, idx) => {
      const baseX = values.length === 1 ? width - padX : padX + (idx / (values.length - 1)) * plotW;
      let x = baseX;
      if (progress < 1 && idx === values.length - 1 && values.length > 1) {
        const prevX = padX + ((idx - 1) / (values.length - 1)) * plotW;
        x = prevX + (baseX - prevX) * progress;
      }
      return { x, y: yFor(v), ts: points[idx].ts, value: v };
    });

    // Single point flat line from start
    if (coords.length === 1) {
      coords.unshift({ x: padX, y: startY, ts: points[0].ts, value: startVal });
    }

    // Gradient under the line
    const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    grad.addColorStop(0, "rgba(48, 209, 88, 0.26)");
    grad.addColorStop(1, "rgba(48, 209, 88, 0.0)");

    ctx.beginPath();
    ctx.moveTo(coords[0].x, height - padBottom);
    coords.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(coords[coords.length - 1].x, height - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Crisp #30d158 line
    ctx.beginPath();
    coords.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = "#30d158";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // End dot
    const last = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#30d158";
    ctx.fill();

    // Non-overlapping marks above the line
    const markList = Array.isArray(marks) ? marks : [];
    if (markList.length && points.length) {
      const firstTs = Date.parse(points[0].ts) || 0;
      const lastTs = Date.parse(points[points.length - 1].ts) || firstTs;
      const placedBoxes = [];
      ctx.font = '600 10px "SF Mono", ui-monospace, Menlo, monospace';
      markList.forEach((m) => {
        const mts = Date.parse(m.ts) || lastTs;
        const frac = lastTs > firstTs ? Math.min(1, Math.max(0, (mts - firstTs) / (lastTs - firstTs))) : 1;
        const mx = padX + frac * plotW;
        const idx = Math.min(coords.length - 1, Math.max(0, Math.round(frac * (coords.length - 1))));
        const baseY = Math.max(18, coords[idx].y - 12);
        const text = String(m.label || "");
        const tw = ctx.measureText(text).width + 10;
        const clampedX = Math.min(width - tw / 2 - 2, Math.max(tw / 2 + 2, mx));
        let row = 0;
        let boxY = baseY;
        while (row < 4) {
          boxY = Math.max(10, baseY - row * 18);
          const left = clampedX - tw / 2;
          const right = clampedX + tw / 2;
          const hit = placedBoxes.some((b) => !(right < b.left || left > b.right || Math.abs(boxY - b.y) > 14));
          if (!hit) break;
          row += 1;
        }
        placedBoxes.push({ left: clampedX - tw / 2, right: clampedX + tw / 2, y: boxY });
        const color = m.kind === "stop" ? "#ff453a" : m.kind === "profit" ? "#30d158" : "#0a84ff";
        ctx.fillStyle = "rgba(28, 28, 30, 0.9)";
        ctx.beginPath();
        ctx.roundRect(clampedX - tw / 2, boxY - 9, tw, 15, 6);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, clampedX, boxY - 1.5);
      });
    }
  }

  window.drawBalanceChart = (canvas, points, startingUsd, marks) => {
    if (!canvas) return;
    const list = Array.isArray(points) ? points : [];
    const shouldAnimate = !reducedMotion() && prevPointCount > 0 && list.length > prevPointCount;
    prevPointCount = list.length;

    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }

    if (!shouldAnimate) {
      renderBalanceFrame(canvas, list, startingUsd, marks, 1);
      return;
    }

    const start = performance.now();
    const duration = 250;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      renderBalanceFrame(canvas, list, startingUsd, marks, t);
      if (t < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        animFrame = null;
      }
    };
    animFrame = requestAnimationFrame(step);
  };

  window.drawCoinCandles = (canvas, candles, position, stopPrice, whales) => {
    if (!canvas) return;
    const { ctx, width, height } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const list = Array.isArray(candles) ? candles : [];
    if (!list.length) return;

    const prices = list.map((c) => Number(c.price)).filter((n) => Number.isFinite(n) && n > 0);
    if (!prices.length) return;
    if (stopPrice && Number.isFinite(Number(stopPrice))) prices.push(Number(stopPrice));
    if (position && position.entry_price) prices.push(Number(position.entry_price));

    let minP = Math.min(...prices);
    let maxP = Math.max(...prices);
    if (maxP <= minP) {
      minP *= 0.95;
      maxP *= 1.05;
    } else {
      const pad = (maxP - minP) * 0.14;
      minP -= pad;
      maxP += pad;
    }

    const padX = 8;
    const padY = 14;
    const plotW = Math.max(1, width - padX * 2);
    const plotH = Math.max(1, height - padY * 2);
    const yFor = (p) => padY + (1 - (p - minP) / (maxP - minP)) * plotH;

    // 1m candle/bar sticks
    const barW = Math.max(3, Math.min(10, plotW / Math.max(list.length, 8) - 2));
    list.forEach((c, idx) => {
      const cur = Number(c.price);
      const prev = idx > 0 ? Number(list[idx - 1].price) : cur;
      const x = list.length === 1 ? width / 2 : padX + (idx / (list.length - 1)) * plotW;
      const y1 = yFor(prev);
      const y2 = yFor(cur);
      const up = cur >= prev;
      ctx.strokeStyle = up ? "#30d158" : "#ff453a";
      ctx.fillStyle = up ? "#30d158" : "#ff453a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, Math.min(y1, y2) - 2);
      ctx.lineTo(x, Math.max(y1, y2) + 2);
      ctx.stroke();
      const top = Math.min(y1, y2);
      const h = Math.max(2, Math.abs(y2 - y1));
      ctx.fillRect(x - barW / 2, top, barW, h);
    });

    // Orange dashed exit / stop line
    if (stopPrice && Number.isFinite(Number(stopPrice))) {
      const sy = yFor(Number(stopPrice));
      ctx.save();
      ctx.strokeStyle = "#ff9f0a";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, sy);
      ctx.lineTo(width - padX, sy);
      ctx.stroke();
      ctx.restore();
    }

    // Whale entry dots on the candles
    const whaleList = Array.isArray(whales) ? whales : [];
    if (whaleList.length && list.length) {
      const t0 = Date.parse(list[0].ts) || 0;
      const t1 = Date.parse(list[list.length - 1].ts) || t0;
      whaleList.forEach((w) => {
        const wt = Date.parse(w.ts) || t1;
        const frac = t1 > t0 ? Math.min(1, Math.max(0, (wt - t0) / (t1 - t0))) : 1;
        const idx = Math.min(list.length - 1, Math.max(0, Math.round(frac * (list.length - 1))));
        const wx = list.length === 1 ? width / 2 : padX + (idx / (list.length - 1)) * plotW;
        const wy = yFor(Number(list[idx].price));
        ctx.beginPath();
        ctx.arc(wx, wy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#64d2ff";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  };
})();
