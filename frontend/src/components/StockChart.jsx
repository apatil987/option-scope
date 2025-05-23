import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";

export default function StockChart({ ticker, visible }) {
  const [chartData, setChartData] = useState({ series: [], options: {} });
  const [range, setRange] = useState("1mo");

  useEffect(() => {
    if (!visible || !ticker) return;
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=1d`)
      .then((res) => res.json())
      .then((data) => {
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const prices = result.indicators.adjclose[0].adjclose;

        const formattedData = timestamps.map((t, i) => ({
          x: new Date(t * 1000),
          y: prices[i] || null,
        }));

        setChartData({
          series: [
            {
              name: ticker,
              data: formattedData,
            },
          ],
          options: {
            chart: { id: "stock-chart", type: "line", height: 350 },
            xaxis: { type: "datetime" },
            yaxis: { labels: { formatter: (val) => `$${val.toFixed(2)}` } },
            title: { text: `${ticker} Price Chart`, align: "center" },
          },
        });
      })
      .catch((err) => console.error("Chart fetch error:", err));
  }, [ticker, visible, range]);

  if (!visible) return null;

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ textAlign: "right", marginBottom: "10px" }}>
        <label>Range: </label>
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="1d">1D</option>
          <option value="5d">5D</option>
          <option value="1mo">1M</option>
          <option value="6mo">6M</option>
          <option value="1y">1Y</option>
          <option value="5y">5Y</option>
          <option value="max">MAX</option>
        </select>
      </div>
      <ApexCharts options={chartData.options} series={chartData.series} type="line" height={350} />
    </div>
  );
}
