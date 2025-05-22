import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function StockChart({ data }) {
  const labels = data.map(entry => entry.date);
  const prices = data.map(entry => entry.close);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Close Price',
        data: prices,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.3,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Price ($)' } }
    }
  };

  return <Line data={chartData} options={options} />;
}
