import React, { useEffect, useState } from 'react';
import ReactApexCharts from 'react-apexcharts';

export default function OptionPriceChart({ contractSymbol, ticker, strike, expiration, type, firebaseUid }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contractSymbol || !firebaseUid) {
      console.log("Missing required props:", { contractSymbol, firebaseUid });
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/option_price_history/${contractSymbol}?firebase_uid=${firebaseUid}`
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to fetch data');
        }

        const history = await res.json();
        console.log("Fetched history:", history); // Debug log
        
        const formattedData = history.map(point => ({
          x: new Date(point.recorded_at).getTime(),
          y: point.premium
        }));

        setData(formattedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching option price history:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [contractSymbol, firebaseUid]);

  const chartOptions = {
    chart: {
      type: 'line',
      height: 350,
      animations: {
        enabled: true
      },
      toolbar: {
        show: true
      }
    },
    title: {
      text: `${ticker} $${strike} ${type} - Expires ${expiration}`,
      align: 'left'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false
      }
    },
    yaxis: {
      title: {
        text: 'Option Premium ($)'
      },
      labels: {
        formatter: (value) => value.toFixed(2)
      }
    },
    tooltip: {
      x: {
        format: 'MMM dd HH:mm'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    markers: {
      size: 4
    }
  };

  if (isLoading) {
    return <div>Loading chart data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div>No price history available yet</div>;
  }

  return (
    <div className="option-price-chart">
      <ReactApexCharts
        options={chartOptions}
        series={[{ name: 'Premium', data: data }]}
        type="line"
        height={350}
      />
    </div>
  );
}