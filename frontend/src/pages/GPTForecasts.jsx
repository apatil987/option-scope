import React, { useState } from 'react';
import { styles } from './GPTForecasts.styles';
import SmartSuggestions from '../UI/SmartSuggestions';
import { auth } from '../firebase';

const GPTForecasts = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:8000/ask_gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }), // Send as an object
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🧠 Ask GPT About Markets</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about market sentiment, options strategies, etc..."
              style={styles.input}
            />
            <button 
              type="submit" 
              disabled={isLoading} 
              style={styles.button}
            >
              {isLoading ? 'Thinking...' : 'Ask GPT'}
            </button>
          </div>
        </form>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {response && (
          <div style={styles.responseContainer}>
            <h3 style={styles.responseTitle}>GPT Response:</h3>
            <div style={styles.response}>
              {response}
            </div>
          </div>
        )}
      </section>

      {/* Add Smart Suggestions section */}
      <SmartSuggestions user={auth.currentUser} />
    </div>
  );
};

export default GPTForecasts;