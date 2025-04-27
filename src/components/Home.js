import React from 'react';
import '../styles/main.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1>RoundUp for Charity</h1>
      <div className="info-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <h3>1. Shop Normally</h3>
            <p>Make purchases as you normally would</p>
          </div>
          <div className="step">
            <h3>2. Automatic RoundUp</h3>
            <p>We round up each transaction to the nearest dollar</p>
          </div>
          <div className="step">
            <h3>3. Donate to Charity</h3>
            <p>Your spare change gets donated to charities of your choice</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;