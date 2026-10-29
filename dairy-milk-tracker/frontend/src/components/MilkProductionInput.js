import React, { useState } from 'react';

const MilkProductionInput = ({ onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(amount));
      setAmount(''); // Reset form after successful submission
    } catch (error) {
      console.error('Error submitting milk production:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="milk-input-form">
      <div className="input-group">
        <label htmlFor="milkAmount">Quick Add Milk Production:</label>
        <div className="input-with-unit">
          <input
            id="milkAmount"
            type="number"
            step="0.1"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={isSubmitting}
          />
          <span className="unit">L</span>
        </div>
      </div>
      <button 
        type="submit" 
        className="submit-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding...' : 'Add Production'}
      </button>
    </form>
  );
};

export default MilkProductionInput;