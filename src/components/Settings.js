import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function Settings() {
  const options   = ['threshold', 'monthly'];
  const charities = ['Red Cross', 'UNICEF', 'WWF', 'Doctors Without Borders'];

  const [trigger, setTrigger] = useState('threshold');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('charitapSettings'));
    if (saved) {
      setTrigger(saved.trigger);
      setSelected(saved.selected);
    } else {
      setSelected([...charities]);
    }
  }, []);

  const toggle = c =>
    setSelected(sel =>
      sel.includes(c) ? sel.filter(x => x !== c) : [...sel, c]
    );

  const save = () => {
    localStorage.setItem(
      'charitapSettings',
      JSON.stringify({ trigger, selected })
    );
    toast.success('Settings saved!');
  };

  return (
    <div className="page-content fade-in space-y-4">
      {/* Donation Trigger Card */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-xl mb-4 text-[#626F47] slide-in-left">
          Donation Trigger
        </h3>
        <p className="text-gray-600 mb-4">
          Choose when your accumulated round-ups get sent.
        </p>
        {options.map((opt, i) => (
          <label
            key={opt}
            className="inline-flex items-center mr-6 text-gray-800 font-bold mb-3 fade-in"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <input
              type="radio"
              className="mr-2"
              checked={trigger === opt}
              onChange={() => setTrigger(opt)}
            />
            {opt === 'threshold'
              ? 'When spare change ≥ $5'
              : 'End of each month'}
          </label>
        ))}
      </div>

      {/* Charity Selection Card */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-xl mb-4 text-[#626F47] slide-in-left">
          Select Charities
        </h3>
        <p className="text-gray-600 mb-4">
          * Donations are split equally among all selected charities.
        </p>
        <div className="flex flex-wrap">
          {charities.map((c, i) => (
            <label
              key={c}
              className={`inline-flex items-center mr-6 mb-3 px-3 py-2 rounded-lg cursor-pointer transition 
                ${
                  selected.includes(c)
                    ? 'bg-[#F0BB78]/30 text-[#626F47] font-semibold'
                    : 'bg-[#F5ECD5]/30 text-gray-600'
                }
                fade-in
              `}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={selected.includes(c)}
                onChange={() => toggle(c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Save Settings Button */}
      <button onClick={save} className="btn-primary">
        Save Settings
      </button>
    </div>
  );
}
