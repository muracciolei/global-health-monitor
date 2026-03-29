function drawBarChart(canvasId, data) {

const canvas =
document.getElementById(canvasId);

if (!canvas) return;

const ctx = canvas.getContext("2d");

canvas.width = 300;
canvas.height = 200;

ctx.clearRect(0,0,300,200);

const max =
Math.max(...data.map(d=>d[1]));

data.forEach((d,i)=>{

const height =
(d[1]/max)*150;

ctx.fillRect(
i*30,
180-height,
20,
height
);

ctx.fillText(
d[0],
i*30,
195
);

});

}

function drawTimelineChart(canvasId, items) {

const canvas =
document.getElementById(canvasId);

if (!canvas) return;

const ctx = canvas.getContext("2d");

const W = canvas.parentElement.clientWidth;
const H = 200;
canvas.width = W;
canvas.height = H;

ctx.clearRect(0,0,W,H);

const padding = {top:10,right:10,bottom:35,left:40};

const groups = {};

items.forEach(item => {
const d = new Date(item.pubDate);
const key = d.toISOString().slice(0,10);
groups[key] = (groups[key]||0)+1;
});

const dates = Object.keys(groups).sort();
const counts = dates.map(d=>groups[d]);

if (!dates.length) return;

const maxCount = Math.max(...counts);

const cw = W-padding.left-padding.right;
const ch = H-padding.top-padding.bottom;

ctx.strokeStyle = "#e0e0e0";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(padding.left,padding.top);
ctx.lineTo(padding.left,H-padding.bottom);
ctx.lineTo(W-padding.right,H-padding.bottom);
ctx.stroke();

const yTicks = 4;
ctx.fillStyle = "#888";
ctx.font = "10px sans-serif";
for (let i=0;i<=yTicks;i++) {
const y = padding.top+ch*(1-i/yTicks);
const val = Math.round(maxCount*i/yTicks);
ctx.fillText(val,5,y+3);
if (i>0) {
ctx.beginPath();
ctx.moveTo(padding.left,y);
ctx.lineTo(W-padding.right,y);
ctx.strokeStyle = "#f0f0f0";
ctx.stroke();
}
}

const pts = dates.map((d,i)=>{
const x = padding.left+(dates.length===1?cw/2:cw*i/(dates.length-1));
const y = padding.top+ch*(1-counts[i]/maxCount);
return {x,y,d,count:counts[i]};
});

ctx.beginPath();
pts.forEach((p,i)=>{
if (i===0) ctx.moveTo(p.x,p.y);
else ctx.lineTo(p.x,p.y);
});
ctx.strokeStyle = "#1976d2";
ctx.lineWidth = 2;
ctx.stroke();

pts.forEach(p=>{
ctx.beginPath();
ctx.arc(p.x,p.y,4,0,Math.PI*2);
ctx.fillStyle = "#1976d2";
ctx.fill();
});

ctx.fillStyle = "#666";
ctx.font = "9px sans-serif";
const step = Math.ceil(dates.length/8);
pts.forEach((p,i)=>{
if (i%step===0||i===dates.length-1) {
const lbl = p.d.slice(5);
ctx.fillText(lbl,p.x-12,H-padding.bottom+14);
}
});

}
