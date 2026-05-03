'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Calculator.module.css';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export function Calculator({ onClose }: CalculatorProps) {
  const [currentOperand, setCurrentOperand] = useState('0');
  const [previousOperand, setPreviousOperand] = useState('');
  const [operation, setOperation] = useState<string | undefined>(undefined);
  const [shouldResetScreen, setShouldResetScreen] = useState(false);
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);

  const clear = useCallback(() => {
    setCurrentOperand('0');
    setPreviousOperand('');
    setOperation(undefined);
    setShouldResetScreen(false);
  }, []);

  const del = useCallback(() => {
    if (currentOperand === '0') return;
    let newVal = currentOperand.toString().slice(0, -1);
    if (newVal === '' || newVal === '-') newVal = '0';
    setCurrentOperand(newVal);
  }, [currentOperand]);

  const appendNumber = useCallback((number: string) => {
    if (currentOperand === '0' && number !== '.') {
      setCurrentOperand(number);
      return;
    }
    if (number === '.' && currentOperand.includes('.')) return;
    if (shouldResetScreen) {
      setCurrentOperand(number);
      setShouldResetScreen(false);
      return;
    }
    if (currentOperand.replace(/[^0-9]/g, "").length >= 12) return;
    setCurrentOperand(prev => prev + number);
  }, [currentOperand, shouldResetScreen]);

  const compute = useCallback(() => {
    let computation: number | string;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
      case '+': computation = prev + current; break;
      case '-': computation = prev - current; break;
      case '*': computation = prev * current; break;
      case '/': computation = current === 0 ? 'Error' : prev / current; break;
      case '%': computation = prev % current; break;
      default: return;
    }

    if (computation === 'Error') {
      setCurrentOperand('Error');
    } else {
      const rounded = Math.round((computation as number) * 100000000) / 100000000;
      setCurrentOperand(rounded.toString());
    }
    setOperation(undefined);
    setPreviousOperand('');
    setShouldResetScreen(true);
  }, [currentOperand, previousOperand, operation]);

  const chooseOperation = useCallback((op: string) => {
    if (currentOperand === '0' && op !== '-') {
      if (previousOperand !== '') setOperation(op);
      return;
    }
    if (previousOperand !== '') compute();
    setOperation(op);
    setPreviousOperand(currentOperand);
    setCurrentOperand('0');
  }, [currentOperand, previousOperand, compute]);

  const handleBtnClick = (val: string, type: 'num' | 'op' | 'action') => {
    setClickedBtn(val);
    setTimeout(() => setClickedBtn(null), 200);

    if (type === 'num') appendNumber(val);
    else if (type === 'op') {
        if (val === '=') compute();
        else chooseOperation(val);
    }
    else if (type === 'action') {
        if (val === 'AC') clear();
        if (val === 'DEL') del();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9' || e.key === '.') handleBtnClick(e.key, 'num');
      if (e.key === 'Enter' || e.key === '=') handleBtnClick('=', 'op');
      if (e.key === 'Backspace') handleBtnClick('DEL', 'action');
      if (e.key === 'Escape') {
          if (currentOperand !== '0' || previousOperand !== '') handleBtnClick('AC', 'action');
          else onClose();
      }
      if (['+', '-', '*', '/', '%'].includes(e.key)) handleBtnClick(e.key, 'op');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appendNumber, compute, chooseOperation, clear, del, onClose, currentOperand, previousOperand]);

  const getDisplayNumber = (num: string) => {
    if (num === 'Error') return 'Error';
    const [integer, decimal] = num.split('.');
    const integerDisplay = isNaN(parseFloat(integer)) ? '' : parseFloat(integer).toLocaleString('en');
    return decimal != null ? `${integerDisplay}.${decimal}` : integerDisplay;
  };

  const displayOp = (op: string) => {
    if (op === '/') return '÷';
    if (op === '*') return '×';
    if (op === '-') return '−';
    return op;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.calculatorWrapper} onClick={e => e.stopPropagation()}>
        <div className={styles.calculator}>
          <div className={styles.display}>
            <div className={styles.previousOperand}>
              {previousOperand ? `${getDisplayNumber(previousOperand)} ${displayOp(operation || '')}` : ''}
            </div>
            <div className={styles.currentOperand} style={{ fontSize: currentOperand.length > 10 ? '28px' : currentOperand.length > 8 ? '34px' : '42px' }}>
              {getDisplayNumber(currentOperand)}
            </div>
          </div>
          <div className={styles.keypad}>
            <button className={clsx(styles.btn, styles.action, clickedBtn === 'AC' && styles.clicked)} onClick={() => handleBtnClick('AC', 'action')}>AC</button>
            <button className={clsx(styles.btn, styles.action, clickedBtn === 'DEL' && styles.clicked)} onClick={() => handleBtnClick('DEL', 'action')}>⌫</button>
            <button className={clsx(styles.btn, styles.operator, clickedBtn === '%' && styles.clicked)} onClick={() => handleBtnClick('%', 'op')}>%</button>
            <button className={clsx(styles.btn, styles.operator, clickedBtn === '/' && styles.clicked)} onClick={() => handleBtnClick('/', 'op')}>÷</button>
            
            {[7, 8, 9].map(n => (
              <button key={n} className={clsx(styles.btn, clickedBtn === n.toString() && styles.clicked)} onClick={() => handleBtnClick(n.toString(), 'num')}>{n}</button>
            ))}
            <button className={clsx(styles.btn, styles.operator, clickedBtn === '*' && styles.clicked)} onClick={() => handleBtnClick('*', 'op')}>×</button>
            
            {[4, 5, 6].map(n => (
              <button key={n} className={clsx(styles.btn, clickedBtn === n.toString() && styles.clicked)} onClick={() => handleBtnClick(n.toString(), 'num')}>{n}</button>
            ))}
            <button className={clsx(styles.btn, styles.operator, clickedBtn === '-' && styles.clicked)} onClick={() => handleBtnClick('-', 'op')}>−</button>
            
            {[1, 2, 3].map(n => (
              <button key={n} className={clsx(styles.btn, clickedBtn === n.toString() && styles.clicked)} onClick={() => handleBtnClick(n.toString(), 'num')}>{n}</button>
            ))}
            <button className={clsx(styles.btn, styles.operator, clickedBtn === '+' && styles.clicked)} onClick={() => handleBtnClick('+', 'op')}>+</button>
            
            <button className={clsx(styles.btn, styles.zero, clickedBtn === '0' && styles.clicked)} onClick={() => handleBtnClick('0', 'num')}>0</button>
            <button className={clsx(styles.btn, clickedBtn === '.' && styles.clicked)} onClick={() => handleBtnClick('.', 'num')}>.</button>
            <button className={clsx(styles.btn, styles.equal, clickedBtn === '=' && styles.clicked)} onClick={() => handleBtnClick('=', 'op')}>=</button>
          </div>
        </div>
      </div>
    </div>
  );
}
