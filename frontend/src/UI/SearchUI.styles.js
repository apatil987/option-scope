export const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '30px'
  },
  title: {
    margin: '0',
    fontSize: '24px',
    color: '#ffffff'
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    flex: 1
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '2px solid #2563eb',
    fontSize: '14px',
    width: '200px',
    backgroundColor: '#1e293b',
    color: '#ffffff'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  error: {
    color: '#ffffff',
    backgroundColor: '#dc2626',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    border: '1px solid #2563eb'
  },
  stockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  stockInfo: {
    margin: '0',
    fontSize: '28px',
    color: '#ffffff'
  },
  stockPrice: {
    fontSize: '24px',
    fontWeight: '500',
    marginTop: '8px',
    color: '#ffffff'
  },
  priceChange: (isPositive) => ({
    color: isPositive ? '#22c55e' : '#ef4444',
    fontSize: '16px',
    marginLeft: '12px'
  }),
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  statBox: {
    textAlign: 'center'
  },
  statLabel: {
    color: '#ffffff',
    fontSize: '14px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#ffffff'
  },
  optionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '24px'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #2563eb',
    backgroundColor: '#1e293b',
    color: '#ffffff'
  },
  filterInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    fontSize: '14px'
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '500',
    color: '#ffffff',
    borderBottom: '1px solid #2563eb',
    backgroundColor: '#1e293b'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #2563eb',
    color: '#ffffff',
    backgroundColor: '#1e293b'
  },
  tableRow: {
    backgroundColor: '#1e293b'
  },
  tableCellHighlight: {
    backgroundColor: '#1e293b',
    color: '#ffffff'
  },
  tableCellNumber: {
    color: '#ffffff',
    fontWeight: '500'
  },
  tableCellText: {
    color: '#ffffff'
  },
  tableCellBid: {
    color: '#22c55e',
    fontWeight: '500'
  },
  tableCellAsk: {
    color: '#ef4444',
    fontWeight: '500'
  },
  tableCellIV: {
    color: '#60a5fa',
    fontWeight: '500'
  },
  tableCellOI: {
    color: '#ffffff',
    fontWeight: '500'
  },
  tableCellVolume: {
    color: '#ffffff',
    fontWeight: '500'
  },
  tableCellITM: {
    color: '#22c55e'
  },
  tableCellHighlight: {
    backgroundColor: '#1e293b',
    color: '#ffffff'
  },
  priceUp: {
    color: '#22c55e'
  },
  priceDown: {
    color: '#ef4444'
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#34C759',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  removeButton: {
    padding: '6px 12px',
    backgroundColor: '#FF3B30',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};