import { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol = "AAPL" }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!window.TradingView || !chartRef.current) return;

    chartRef.current.innerHTML = '';

    new window.TradingView.widget({
      container_id: "tv-container",
      width: "100%",
      height: 450,
      symbol: `NASDAQ:${symbol}`,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
    });
  }, [symbol]);

  return <div id="tv-container" ref={chartRef}></div>;
}