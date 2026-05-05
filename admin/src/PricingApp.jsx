import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Rocket, ArrowRight } from 'lucide-react';

const PricingSkeleton = () => (
  <div style={{
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '20px',
    height: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
      <div className="skeleton-box" style={{ width: '120px', height: '24px' }} />
    </div>
    <div className="skeleton-box" style={{ width: '100%', height: '20px' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-box" style={{ width: '100%', height: '14px' }} />
      ))}
    </div>
    <div className="skeleton-box" style={{ marginTop: 'auto', width: '100%', height: '45px', borderRadius: '10px' }} />
  </div>
);

const PricingCard = ({ title, price, tokens, features, isPopular, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -10 }}
    style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${isPopular ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: '20px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isPopular ? '0 20px 40px rgba(99, 102, 241, 0.1)' : 'none'
    }}
  >
    {isPopular && (
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '-30px',
        background: 'var(--accent)',
        color: 'white',
        padding: '4px 30px',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        transform: 'rotate(45deg)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
      }}>
        POPULAR
      </div>
    )}

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        background: `${color}20`,
        color: color,
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{price}</h3>
        {price !== 'Free' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/mo</span>}
      </div>
    </div>

    <div>
      <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
        {tokens.toLocaleString()} tokens per month
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {features.map((feature, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <Check size={14} style={{ color: 'var(--success)' }} />
          <span>{feature}</span>
        </div>
      ))}
    </div>

    <button style={{
      marginTop: 'auto',
      background: isPopular ? 'var(--accent)' : 'var(--bg-tertiary)',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '10px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    }}>
      {price === 'Free' ? 'Current Plan' : 'Upgrade Now'}
      <ArrowRight size={16} />
    </button>
  </motion.div>
);

const PricingApp = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const tiers = [
    {
      title: 'Free',
      price: 'Free',
      tokens: 5000,
      features: ['Basic indexing', '10 edits per month', 'Community support', 'Standard AI models'],
      icon: Zap,
      color: '#94a3b8'
    },
    {
      title: 'Starter',
      price: '$15',
      tokens: 100000,
      isPopular: true,
      features: ['Full theme indexing', 'Priority AI processing', 'Unlimited code history', 'Enhanced logic detection'],
      icon: Rocket,
      color: '#6366f1'
    },
    {
      title: 'Pro',
      price: '$30',
      tokens: 500000,
      features: ['Multi-theme support', 'ZenTask AI integration', 'Advanced diff analysis', 'Dedicated premium support'],
      icon: Shield,
      color: '#10b981'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Pricing
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Scale your WordPress development with powerful AI tokens and advanced indexing capabilities.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {loading 
          ? [1, 2, 3].map(i => <PricingSkeleton key={i} />)
          : tiers.map((tier, idx) => (
            <PricingCard key={idx} {...tier} />
          ))
        }
      </div>

      <div style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border)', 
        borderRadius: '20px', 
        padding: '2rem',
        textAlign: 'center',
        marginTop: '2rem'
      }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Need a custom enterprise solution?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          We offer custom token volumes and dedicated instance support for large agencies.
        </p>
        <button className="synapse-btn">Contact Sales</button>
      </div>
    </div>
  );
};

export default PricingApp;
