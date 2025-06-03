export const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '1.5rem',
  },
  form: {
    width: '100%',
    marginBottom: '2rem',
  },
  inputContainer: {
    display: 'flex',
    gap: '1rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    outline: 'none',
    '&:focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
    },
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2563eb',
    },
    '&:disabled': {
      backgroundColor: '#93c5fd',
      cursor: 'not-allowed',
    },
  },
  responseContainer: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  responseTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  response: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#334155',
    whiteSpace: 'pre-wrap',
  },
  error: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
};