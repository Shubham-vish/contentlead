---
name: charts
description: Sandbox-safe data visualization patterns built only with injected globals
tags: charts, data-viz, svg, sandbox, remotion
---

# Charts

## 1) Animated bar chart with stagger
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const data = [{ label: 'SEO', value: 82, color: '#8A2BE2' }, { label: 'Ads', value: 67, color: '#00FFFF' }, { label: 'Email', value: 54, color: '#FFD27F' }];
  return <AbsoluteFill style={{ backgroundColor: '#0B1020', padding: 80, justifyContent: 'center' }}><div style={{ color: '#fff', fontSize: 58, fontWeight: 800, fontFamily, marginBottom: 40 }}>Channel Mix</div>{data.map((item, index) => { const delay = staggerDelay(index, 6, 5); const width = interpolate(frame, [delay, delay + 18], [0, item.value], { extrapolateRight: 'clamp' }); return <div key={item.label} style={{ marginBottom: 22, opacity: fadeIn(frame, delay, 10) }}><div style={{ color: '#fff', fontFamily: bodyFont, fontSize: 24, marginBottom: 8 }}>{item.label}</div><div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 28, overflow: 'hidden' }}><div style={{ width: `${width}%`, height: '100%', background: item.color, borderRadius: 999 }} /></div></div>; })}</AbsoluteFill>;
};
```

## 2) Counter / number animation
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const value = Math.round(interpolate(frame, [0, 75], [0, 1250], { extrapolateRight: 'clamp' }));
  const scale = numberPop(frame, fps, 0);
  return <AbsoluteFill style={{ backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}><div style={{ transform: `scale(${scale})`, color: '#FFD27F', fontSize: 132, fontWeight: 900, fontFamily }}>{value.toLocaleString()}</div><div style={{ position: 'absolute', top: '62%', color: '#D0D0D0', fontSize: 30, fontFamily: bodyFont }}>users onboarded</div></AbsoluteFill>;
};
```

## 3) Progress bar
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 100 }}><div style={{ width: '100%' }}><div style={{ color: '#fff', fontSize: 54, fontWeight: 800, fontFamily, marginBottom: 24 }}>Rendering Preview</div><div style={{ height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${progress * 100}%`, height: '100%', background: '#8A2BE2' }} /></div><div style={{ color: '#BC4AEF', fontSize: 28, fontFamily: bodyFont, marginTop: 16 }}>{Math.round(progress * 100)}%</div></div></AbsoluteFill>;
};
```

## 4) Pie chart with SVG stroke-dasharray
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const segments = [{ value: 45, color: '#8A2BE2' }, { value: 30, color: '#00FFFF' }, { value: 25, color: '#FFD27F' }];
  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  let offset = 0;
  return <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}><svg width="420" height="420" viewBox="0 0 420 420"><g transform="translate(210 210) rotate(-90)">{segments.map((segment, i) => { const length = (segment.value / 100) * circumference * progress; const circle = <circle key={i} r={radius} cx="0" cy="0" fill="none" stroke={segment.color} strokeWidth="36" strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-offset} strokeLinecap="round" />; offset += (segment.value / 100) * circumference; return circle; })}</g></svg><div style={{ position: 'absolute', color: '#fff', fontSize: 60, fontWeight: 900, fontFamily }}>Share</div></AbsoluteFill>;
};
```

## 5) Line chart with SVG path + `lineDraw`
```jsx
const Scene = () => {
  const frame = useCurrentFrame();
  const points = [70, 120, 90, 180, 140, 220, 260];
  const progress = lineDraw(frame, 0, 40);
  const width = 820;
  const height = 360;
  const step = width / (points.length - 1);
  const path = points.map((value, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - value}`).join(' ');
  const stroke = strokeDraw(frame, 0, 1200, 40);
  return <AbsoluteFill style={{ backgroundColor: '#08111F', justifyContent: 'center', alignItems: 'center' }}><div style={{ position: 'absolute', top: 120, left: 130, color: '#fff', fontSize: 54, fontWeight: 800, fontFamily }}>Revenue Trend</div><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}><path d={path} fill="none" stroke="#8A2BE2" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={stroke.dasharray} strokeDashoffset={stroke.dashoffset} />{points.map((value, i) => <circle key={i} cx={i * step} cy={height - value} r={progress > i / points.length ? 8 : 0} fill="#00FFFF" />)}</svg></AbsoluteFill>;
};
```
