import React from 'react';

export default function Home() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#1a202c' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Welcome to OptiVue</h2>
      <p style={{ fontSize: '16px', color: '#4a5568' }}>Your options trading dashboard</p>

      <section style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>📊 Top Trade Recommendations</h3>
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          {[
            { ticker: 'TSLA', action: 'Buy Call', date: 'Jun 5' },
            { ticker: 'NVDA', action: 'Buy Put', date: 'Jul 1' },
            { ticker: 'AAPL', action: 'Buy Call', date: 'Oct 6' },
          ].map(({ ticker, action, date }) => (
            <div key={ticker} style={{
              background: '#edf2f7',
              borderRadius: '10px',
              padding: '15px 20px',
              width: '200px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600' }}>{ticker}</h4>
              <p style={{ margin: '4px 0' }}>{action}</p>
              <p style={{ fontSize: '14px', color: '#718096' }}>{date}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>🧠 GPT Sentiment Summary</h3>
        <div style={{
          background: '#e6fffa',
          borderLeft: '6px solid #38b2ac',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '16px',
        }}>
          Positive sentiment on tech stocks following strong earnings reports.
        </div>
      </section>

      <section style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>📰 Recent Market Headlines</h3>
        <ul style={{ lineHeight: '1.8', paddingLeft: '20px', fontSize: '16px', color: '#4a5568' }}>
          <li>Fed signals cautious approach to rate changes</li>
          <li>Oil prices drop amid demand concerns</li>
          <li>Weekly jobless claims rise unexpectedly</li>
        </ul>
      </section>
    </div>
  );
}
