export const styles = {
  container: {
    padding: "32px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "24px",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "16px",
  },
  dropdownContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "500px",
  },
  customSelect: {
    position: "relative",
    width: "100%",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#334155",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    appearance: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#94a3b8",
    },
    "&:focus": {
      outline: "none",
      borderColor: "#0ea5e9",
      boxShadow: "0 0 0 2px rgba(14,165,233,0.2)",
    },
  },
  selectArrow: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "0",
    height: "0",
    borderLeft: "5px solid transparent",
    borderRight: "5px solid transparent",
    borderTop: "5px solid #64748b",
    pointerEvents: "none",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
  },
  input: {
    padding: "10px 14px",
    fontSize: "14px",
    color: "#334155",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    "&:focus": {
      outline: "none",
      borderColor: "#0ea5e9",
      boxShadow: "0 0 0 2px rgba(14,165,233,0.2)",
    },
    "&:disabled": {
      backgroundColor: "#f1f5f9",
      cursor: "not-allowed",
    },
  },
  calculateButton: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: "#0ea5e9",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#0284c7",
    },
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  resultCard: {
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  metric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "12px",
    "& span": {
      fontWeight: "600",
      color: "#334155",
    },
  },
  evValue: (isPositive) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "16px",
    fontWeight: "600",
    color: isPositive ? "#10b981" : "#ef4444",
    marginBottom: "12px",
    "& span": {
      fontSize: "20px",
    },
  }),
  lossValue: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#ef4444",
    marginBottom: "12px",
    "& span": {
      fontWeight: "600",
    },
  },
  gainValue: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#10b981",
    marginBottom: "12px",
    "& span": {
      fontWeight: "600",
    },
  },
  noData: {
    textAlign: "center",
    padding: "20px",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
    fontSize: "14px",
  },
  historyButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: "#8b5cf6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "16px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#7c3aed",
    },
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginTop: "20px",
    height: "400px",
  },
};