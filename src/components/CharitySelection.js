import React, { useState } from 'react';
import '../styles/main.css';

const CharitySelection = () => {
  const [selectedCharities, setSelectedCharities] = useState([]);
  const charities = ['Red Cross', 'UNICEF', 'WWF', 'Doctors Without Borders'];

  const handleSelect = (charity) => {
    setSelectedCharities(prev => 
      prev.includes(charity)
        ? prev.filter(c => c !== charity)
        : [...prev, charity]
    );
  };

  return (
    <div className="charity-container">
      <h2>Select Charities</h2>
      <div className="charity-list">
        {charities.map((charity) => (
          <div 
            key={charity} 
            className={`charity-item ${selectedCharities.includes(charity) ? 'selected' : ''}`}
            onClick={() => handleSelect(charity)}
          >
            {charity}
          </div>
        ))}
      </div>
      <button>Save Preferences</button>
    </div>
  );
};

export default CharitySelection;