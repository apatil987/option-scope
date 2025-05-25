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
    color: '#1a1a1a'
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    flex: 1
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    width: '200px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  error: {
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  stockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  stockInfo: {
    margin: '0',
    fontSize: '28px'
  },
  stockPrice: {
    fontSize: '24px',
    fontWeight: '500',
    marginTop: '8px'
  },
  priceChange: (isPositive) => ({
    color: isPositive ? '#34C759' : '#FF3B30',
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
    color: '#666',
    fontSize: '14px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '500'
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
    border: '1px solid #ddd',
    fontSize: '14px'
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
    color: '#666',
    borderBottom: '1px solid #ddd'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee'
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