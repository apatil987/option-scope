import React, { useState } from 'react';
import { styles } from './GPTForecasts.styles';
import SmartSuggestions from '../UI/SmartSuggestions';
import { auth } from '../firebase';
import { FaRobot, FaExclamationTriangle, FaBrain, FaPaperPlane } from 'react-icons/fa';

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
        body: JSON.stringify({ question: question }),
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
        <h2 style={styles.sectionTitle}>
          <FaBrain style={styles.aiIcon} />
          AI Market Analysis
        </h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Analyze market trends, suggest options strategies, or get trade insights..."
              style={styles.input}
            />
            <button 
              type="submit" 
              disabled={isLoading} 
              style={styles.button}
            >
              {isLoading ? (
                <>
                  <div style={styles.loadingSpinner} />
                  Thinking...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Ask GPT
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div style={styles.error}>
            <FaExclamationTriangle style={styles.warningIcon} />
            {error}
          </div>
        )}

        {response && (
          <div style={styles.responseContainer}>
            <h3 style={styles.responseTitle}>
              <FaRobot style={styles.aiIcon} />
              AI Response
            </h3>
            <div style={styles.response}>
              {response}
            </div>
          </div>
        )}
      </section>

      <SmartSuggestions user={auth.currentUser} />
    </div>
  );
};

export default GPTForecasts;