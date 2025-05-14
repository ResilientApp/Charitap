<<<<<<< HEAD
// src/components/Dashboard.js
=======
>>>>>>> bb38d56 (Built complete reactand tailwind based  website)
import React from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
<<<<<<< HEAD
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

// register the chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// 1) Monthly donations bar chart data
const monthlyData = {
  labels: ['Jan','Feb','Mar','Apr','May'],
  datasets: [{
    label: 'Donations ($)',
    data: [12, 15, 8, 20, 10],
    backgroundColor: '#A4B465'
  }]
};

// 2) Charity distribution doughnut chart data
const distroData = {
  labels: ['Red Cross','UNICEF','WWF','Doctors Without Borders'],
  datasets: [{
    data: [40, 25, 20, 15],
    backgroundColor: ['#626F47','#A4B465','#F0BB78','#F5ECD5']
  }]
};

// 3) Balance trend line chart data
const balanceTrend = {
  labels: ['Jan','Feb','Mar','Apr','May'],
  datasets: [{
    label: 'Balance Over Time',
    data: [4.56, 10.12, 7.30, 12.00, 14.20],
    fill: false,
    tension: 0.4,
    borderColor: '#F0BB78'
  }]
};

// 4) Category breakdown pie chart data
const categoryBreakdown = {
  labels: ['Health','Education','Environment','Other'],
  datasets: [{
    data: [30, 25, 20, 25],
    backgroundColor: ['#F0BB78','#626F47','#A4B465','#F5ECD5']
  }]
=======
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
>>>>>>> bb38d56 (Built complete reactand tailwind based  website)
};

export default function Dashboard() {
  const charts = [
<<<<<<< HEAD
    { Component: Bar, data: monthlyData, options: { plugins: { legend: { display: false } } } },
    { Component: Doughnut, data: distroData },
    { Component: Line, data: balanceTrend },
    { Component: Pie, data: categoryBreakdown },
=======
    { type: Bar, data: monthlyData, opts:{ plugins:{ legend:{display:false} } } },
    { type: Doughnut, data: distroData },
    { type: Line, data: balanceTrend },
    { type: Pie, data: categoryBreakdown },
>>>>>>> bb38d56 (Built complete reactand tailwind based  website)
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
<<<<<<< HEAD
            <c.Component data={c.data} options={c.options || {}} />
=======
            <c.type data={c.data} options={c.opts || {}} />
>>>>>>> bb38d56 (Built complete reactand tailwind based  website)
          </div>
        ))}
      </div>
    </div>
  );
}
