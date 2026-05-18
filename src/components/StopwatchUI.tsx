import { useState, useEffect, useRef, useCallback } from 'react';

interface StopwatchUIProps {
  defaultMinutes?: number;
}

export default function StopwatchUI({ defaultMinutes = 0 }: StopwatchUIProps) {
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(defaultMinutes);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      clearTimer();
      setIsRunning(false);
      setIsComplete(true);
    }

    return () => clearTimer();
  }, [isRunning, remainingSeconds, clearTimer]);

  const handleStart = useCallback(() => {
    const total = inputHours * 3600 + inputMinutes * 60 + inputSeconds;
    if (total <= 0) return;
    setTotalSeconds(total);
    setRemainingSeconds(total);
    setIsStarted(true);
    setIsRunning(true);
    setIsComplete(false);
  }, [inputHours, inputMinutes, inputSeconds]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const handleResume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleReset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsStarted(false);
    setIsComplete(false);
    setTotalSeconds(0);
    setRemainingSeconds(0);
  }, [clearTimer]);

  const hours = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;
  const timeDisplay = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const radius = 115;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const ringColor = isComplete ? '#FACC15' : '#00E5A0';

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-white/5 rounded-2xl p-8 flex flex-col items-center space-y-8">
        {!isStarted ? (
          <div className="space-y-6 w-full">
            <p className="text-center text-gray-400 text-sm">设置倒计时时间</p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <label className="text-xs text-gray-500">时</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 h-14 text-center text-2xl font-heading font-bold text-white bg-surface border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                />
              </div>
              <span className="text-2xl text-gray-500 font-bold mt-5">:</span>
              <div className="flex flex-col items-center gap-1.5">
                <label className="text-xs text-gray-500">分</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-20 h-14 text-center text-2xl font-heading font-bold text-white bg-surface border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                />
              </div>
              <span className="text-2xl text-gray-500 font-bold mt-5">:</span>
              <div className="flex flex-col items-center gap-1.5">
                <label className="text-xs text-gray-500">秒</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={inputSeconds}
                  onChange={(e) => setInputSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-20 h-14 text-center text-2xl font-heading font-bold text-white bg-surface border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={inputHours * 3600 + inputMinutes * 60 + inputSeconds <= 0}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始
            </button>
          </div>
        ) : (
          <>
            <div className="relative w-[280px] h-[280px] flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? (
                  <span className="text-3xl font-heading font-bold text-yellow-400 animate-pulse">
                    时间到!
                  </span>
                ) : (
                  <span className="text-5xl font-heading font-bold text-white tracking-wider">
                    {timeDisplay}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isRunning && !isComplete && (
                <button
                  onClick={handleResume}
                  className="px-8 py-3 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all duration-200 active:scale-95"
                >
                  继续
                </button>
              )}
              {isRunning && (
                <button
                  onClick={handlePause}
                  className="px-8 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all duration-200 active:scale-95"
                >
                  暂停
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-all duration-200 active:scale-95"
              >
                重置
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
