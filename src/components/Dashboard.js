import React from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, ArcElement,
  PointElement, LineElement,
  Tooltip, Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, ArcElement,
  PointElement, LineElement,
  Tooltip, Legend
);

const monthlyData = {
  labels: ['Jan','Feb','Mar','Apr','May'],
  datasets: [{ label:'Donations ($)', data:[12,15,8,20,10], backgroundColor:'#4caf50' }]
};
const distroData = {
  labels: ['Red Cross','UNICEF','WWF','Doctors Without Borders'],
  datasets: [{ data:[40,25,20,15], backgroundColor:['#2196f3','#4caf50','#ffca28','#ab47bc'] }]
};
const balanceTrend = {
  labels: ['Jan','Feb','Mar','Apr','May'],
  datasets: [{
    label:'Balance Over Time',
    data:[4.56,10.12,7.30,12.00,14.20],
    fill:false, tension:0.4, borderColor:'#82b1ff'
  }]
};
const categoryBreakdown = {
  labels: ['Health','Education','Environment','Other'],
  datasets: [{ data:[30,25,20,25], backgroundColor:['#ff6384','#36a2eb','#ffcd56','#4bc0c0'] }]
};

export default function Dashboard() {
  const charts = [
    { type: Bar, data: monthlyData, opts:{ plugins:{ legend:{display:false} } } },
    { type: Doughnut, data: distroData },
    { type: Line, data: balanceTrend },
    { type: Pie, data: categoryBreakdown },
  ];

  return (
    <div className="page-content fade-in space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {charts.map((c, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl p-4 tile-hover fade-in"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <c.type data={c.data} options={c.opts || {}} />
          </div>
        ))}
      </div>
    </div>
  );
}
