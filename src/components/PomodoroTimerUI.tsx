import { useState, useEffect, useRef, useCallback } from 'react';

interface PomodoroTimerUIProps {
  workMinutes: number;
  breakMinutes: number;
  rounds: number;
}

export default function PomodoroTimerUI({ workMinutes, breakMinutes, rounds }: PomodoroTimerUIProps) {
  const [totalSeconds, setTotalSeconds] = useState(workMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
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

      if (!isBreak) {
        if (currentRound >= rounds) {
          setIsComplete(true);
        } else {
          setIsBreak(true);
          const breakTotal = breakMinutes * 60;
          setTotalSeconds(breakTotal);
          setRemainingSeconds(breakTotal);
        }
      } else {
        setIsBreak(false);
        setCurrentRound((prev) => prev + 1);
        const workTotal = workMinutes * 60;
        setTotalSeconds(workTotal);
        setRemainingSeconds(workTotal);
      }
    }

    return () => clearTimer();
  }, [isRunning, remainingSeconds, isBreak, currentRound, rounds, breakMinutes, workMinutes, clearTimer]);

  const handleStart = useCallback(() => {
    if (isComplete) return;
    setIsRunning(true);
  }, [isComplete]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const handleReset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsBreak(false);
    setCurrentRound(1);
    setIsComplete(false);
    const workTotal = workMinutes * 60;
    setTotalSeconds(workTotal);
    setRemainingSeconds(workTotal);
  }, [workMinutes, clearTimer]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const radius = 115;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const statusText = isComplete ? '已完成' : isBreak ? '休息中...' : '工作中...';
  const statusColor = isComplete ? 'text-yellow-400' : isBreak ? 'text-blue-400' : 'text-accent';
  const ringColor = isComplete ? '#FACC15' : isBreak ? '#60A5FA' : '#00E5A0';

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-white/5 rounded-2xl p-8 flex flex-col items-center space-y-8">
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
            <span className="text-5xl font-heading font-bold text-white tracking-wider">
              {timeDisplay}
            </span>
            <span className={`text-sm font-medium mt-2 ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: rounds }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < currentRound - 1
                  ? 'bg-accent'
                  : i === currentRound - 1 && !isComplete
                    ? isBreak
                      ? 'bg-blue-400'
                      : 'bg-accent/60 animate-pulse'
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <p className="text-gray-400 text-sm">
          第 {currentRound} / {rounds} 轮
        </p>

        <div className="flex items-center gap-3">
          {!isRunning && !isComplete && (
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all duration-200 active:scale-95"
            >
              {remainingSeconds === totalSeconds && currentRound === 1 && !isBreak ? '开始' : '继续'}
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

        {isComplete && (
          <div className="text-center space-y-2 animate-fade-in">
            <p className="text-2xl font-heading font-bold text-yellow-400">
              🎉 全部完成！
            </p>
            <p className="text-gray-400 text-sm">
              你已完成 {rounds} 轮番茄钟
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
