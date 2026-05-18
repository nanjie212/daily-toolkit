import { useState, useCallback } from 'react';

interface CalculatorUIProps {
  onResult: (result: string) => void;
}

interface ButtonDef {
  value: string;
  span?: number;
  type: 'number' | 'operator' | 'action' | 'equals';
}

export default function CalculatorUI({ onResult }: CalculatorUIProps) {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');

  const evaluateExpression = useCallback((expr: string): string => {
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    const clean = sanitized.replace(/[^0-9+\-*/().%\s]/g, '');
    if (!clean) return '0';
    try {
      const result = new Function(`"use strict"; return (${clean})`)();
      if (typeof result !== 'number' || !isFinite(result)) return '错误';
      return Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(10)).toString();
    } catch {
      return '错误';
    }
  }, []);

  const handleButton = useCallback((value: string) => {
    if (value === 'C') {
      setExpression('');
      setDisplay('0');
      return;
    }

    if (value === '⌫') {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      setDisplay(newExpr || '0');
      return;
    }

    if (value === '=') {
      const result = evaluateExpression(expression);
      setDisplay(result);
      setExpression(result === '错误' ? '' : result);
      onResult(result);
      return;
    }

    if (value === '%') {
      const newExpr = expression + '/100';
      setExpression(newExpr);
      const result = evaluateExpression(newExpr);
      setDisplay(result);
      return;
    }

    const newExpr = expression + value;
    setExpression(newExpr);
    setDisplay(newExpr);
  }, [expression, evaluateExpression, onResult]);

  const rows: ButtonDef[][] = [
    [
      { value: 'C', type: 'action' },
      { value: '⌫', type: 'action' },
      { value: '%', type: 'action' },
      { value: '÷', type: 'operator' },
    ],
    [
      { value: '7', type: 'number' },
      { value: '8', type: 'number' },
      { value: '9', type: 'number' },
      { value: '×', type: 'operator' },
    ],
    [
      { value: '4', type: 'number' },
      { value: '5', type: 'number' },
      { value: '6', type: 'number' },
      { value: '-', type: 'operator' },
    ],
    [
      { value: '1', type: 'number' },
      { value: '2', type: 'number' },
      { value: '3', type: 'number' },
      { value: '+', type: 'operator' },
    ],
    [
      { value: '0', type: 'number', span: 2 },
      { value: '.', type: 'number' },
      { value: '=', type: 'equals' },
    ],
  ];

  const getButtonStyle = (btn: ButtonDef) => {
    const base = 'h-14 rounded-xl font-semibold text-lg transition-all duration-150 active:scale-95 select-none';

    if (btn.type === 'equals') {
      return `${base} bg-accent hover:bg-accent/90 text-black`;
    }
    if (btn.type === 'operator') {
      return `${base} bg-surface hover:bg-white/15 text-accent border border-white/5`;
    }
    if (btn.type === 'action') {
      return `${base} bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5`;
    }
    return `${base} bg-white/8 hover:bg-white/12 text-white border border-white/5`;
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="bg-surface rounded-xl p-4 min-h-[100px] flex flex-col justify-end items-end">
          <p className="text-gray-500 text-sm font-mono min-h-[20px] break-all text-right w-full">
            {expression || ' '}
          </p>
          <p className="text-white text-3xl font-heading font-bold mt-1 break-all text-right w-full">
            {display}
          </p>
        </div>

        <div className="space-y-2.5">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-2.5">
              {row.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleButton(btn.value)}
                  className={`${getButtonStyle(btn)} ${btn.span === 2 ? 'col-span-2' : ''}`}
                >
                  {btn.value}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
