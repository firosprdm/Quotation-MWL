'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, User, LogIn, ShieldAlert } from 'lucide-react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Small delay for UX feel
    setTimeout(() => {
      const success = login(username, password);
      if (!success) {
        setError('Invalid username or password');
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.blob} />
        <div className={styles.blob2} />
      </div>
      
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Lock size={32} />
          </div>
          <h1>MARINA</h1>
          <p>WorldLink Systems</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <User className={styles.icon} size={20} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.icon} size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className={styles.spinner} />
            ) : (
              <>
                <span>Secure Access</span>
                <LogIn size={20} />
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>&copy; 2026 Marina WorldLink. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
