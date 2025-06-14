export const styles = {
  sidebar: {
    width: '250px',
    background: 'linear-gradient(180deg, #0b2c48 0%, #08233c 100%)',
    height: '100vh',
    padding: '20px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  titleLink: {
    textDecoration: 'none',
  },
  title: {
    color: 'white',
    marginBottom: '20px',
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  menuList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  menuLink: {
    color: 'white',
    textDecoration: 'none',
    display: 'block',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    transition: 'background-color 0.2s ease',
  },
  profileSection: {
    marginTop: 'auto',
    fontSize: '14px',
  },
  userInfo: {
    marginBottom: '10px',
  },
  userName: {
    margin: 0,
    color: 'lightgray',
    fontWeight: '500',
  },
  userEmail: {
    margin: 0,
    color: 'lightgray',
  },
  profileDetails: {
    background: 'rgba(255,255,255,0.1)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  detailText: {
    margin: '4px 0',
    color: '#c3d4e9',
    fontSize: '12px',
  },
  loginButton: {
    width: '100%',
    padding: '12px',
    background: '#4285f4',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease',
  },
  logoutButton: {
    width: '100%',
    padding: '10px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
};