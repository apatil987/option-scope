import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage("Backend not reachable"));
  }, []);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 text-2xl font-bold">
      {message}
    </div>
  );
}

export default App;
