import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateCommunityPage = () => {
  const [communityName, setCommunityName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert comma-separated keywords into an array if needed
      const keywordsArray = keywords ? keywords.split(',').map(kw => kw.trim()) : [];
      const response = await axios.post('/api/communities/', {
         community_name: communityName,
         keywords: keywordsArray,
      });
      if (response.status === 201) {
         // On success, redirect to a community or dashboard page
         navigate('/dashboard');
      }
    } catch (err) {
      setError('Error creating community. Please try again.');
    }
  };

  return (
    <div>
      <h1>Create Community</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
         <div>
            <label>Community Name:</label>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              required
            />
         </div>
         <div>
            <label>Keywords (comma separated):</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
         </div>
         <button type="submit">Create Community</button>
      </form>
    </div>
  );
};

export default CreateCommunityPage;
