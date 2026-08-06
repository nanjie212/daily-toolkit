import { useState, useEffect, useRef } from 'react';
import { RefreshCwIcon, TrophyIcon, SparklesIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { safeStorage } from '@/lib/safeStorage';
import { idiomSource } from '@/lib/idiomSource';

interface IdiomChallenge {
  startIdiom: string;
  targetChar: string;
  completed: boolean;
  hint?: string;
}

interface IdiomChainData {
  date: string;
  challenges: IdiomChallenge[];
  changeRemain: number;
  badges: string[];
  completedToday: number;
}

export default function IdiomChainGame() {
  const [userInput, setUserInput] = useState('');
  const [chain, setChain] = useState<string[]>([]);
  const [currentHint, setCurrentHint] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [changeRemain, setChangeRemain] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [todayChallenges, setTodayChallenges] = useState<IdiomChallenge[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 初始化 - 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const today = new Date().toDateString();
    const savedData = safeStorage.getJSON<IdiomChainData>('idiom_chain_data', { date: '', challenges: [], changeRemain: 3, badges: [], completedToday: 0 });

    const lastDate = savedData.date || '';

    if (lastDate !== today) {
      const newChallenges = generateDailyChallenges();
      savedData.date = today;
      savedData.challenges = newChallenges;
      savedData.changeRemain = 3;
      safeStorage.setJSON('idiom_chain_data', savedData);
    }

    setChangeRemain(savedData.changeRemain || 3);
    setTodayChallenges(savedData.challenges || []);
    setCompletedToday(savedData.challenges.filter((c) => c.completed).length);
    setBadges(savedData.badges || []);
  };

  // 生成每日挑战
  const generateDailyChallenges = (): IdiomChallenge[] => {
    const allStarts = ['一', '心', '人', '天', '大', '万', '千', '百', '龙', '风', '花', '日', '水', '山', '金', '火', '不', '自', '无', '出', '画', '虎', '意', '成', '功', '前', '行', '目', '如', '海', '声', '才', '见', '云', '雨', '草', '后', '全', '美', '快', '身', '地', '善', '力', '高', '长', '老', '下', '效', '直', '壮', '图', '省', '口', '称', '赞', '文', '墨', '益', '打', '知', '俗', '简'];
    const shuffled = allStarts.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5).map(start => ({
      startIdiom: getRandomIdiom(start),
      targetChar: '',
      completed: false,
      hint: '',
    }));
  };

  // 获取随机成语（精确首字匹配，走真实词库，不再内嵌小词表）
  // allowHomophone=false：开局/提示里只给「严格同字」的成语，避免同音歧义
  const getRandomIdiom = (startChar: string): string => {
    const idioms = idiomSource.getIdiomsStartingWith(startChar, false);
    if (idioms.length === 0) return '一帆风顺';
    return idioms[Math.floor(Math.random() * idioms.length)];
  };

  // 开始新游戏
  const startNewGame = () => {
    const startChar = ['一', '心', '人', '天', '大', '万', '千', '百', '龙', '风', '花', '日', '水', '山'][Math.floor(Math.random() * 14)];
    const idiom = getRandomIdiom(startChar);
    setChain([idiom]);
    setUserInput('');
    setIsCorrect(null);
    setShowFeedback(false);
    setShowHint(false);
    setCurrentHint(`请以"${idiom.slice(-1)}"开头`);
    inputRef.current?.focus();
  };

  // 提交答案
  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const lastChar = chain[chain.length - 1].slice(-1);
    const inputFirstChar = userInput.trim().charAt(0);

    if (inputFirstChar === lastChar) {
      // 正确
      setIsCorrect(true);
      setShowFeedback(true);
      setChain([...chain, userInput.trim()]);
      setCurrentHint(`✅ 正确！请以"${userInput.slice(-1)}"开头继续`);
      setUserInput('');

      // 播放音效
      if (soundEnabled) {
        playSound('correct');
      }

      // 动画效果
      setTimeout(() => setShowFeedback(false), 1000);
    } else {
      // 错误
      setIsCorrect(false);
      setShowFeedback(true);
      setCurrentHint(`❌ 不对哦！需要以"${lastChar}"开头，例如：${getRandomIdiom(lastChar)}`);

      if (soundEnabled) {
        playSound('wrong');
      }

      setTimeout(() => {
        setShowFeedback(false);
        setIsCorrect(null);
      }, 2000);
    }
  };

  // 播放音效
  const playSound = (type: 'correct' | 'wrong') => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioCtxRef.current;
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'correct') {
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    } else {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.2);
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // 换词
  const handleChangeWord = () => {
    if (changeRemain <= 0) return;

    const lastIdiom = chain[chain.length - 1];
    const lastChar = lastIdiom.slice(-1);

    // 找以该字开头的另一个成语（走真实词库，移除内嵌小词表）
    const alternatives = idiomSource
      .getIdiomsStartingWith(lastChar, false)
      .filter((i) => !chain.includes(i));
    if (alternatives.length > 0) {
      const newIdiom = alternatives[Math.floor(Math.random() * alternatives.length)];
      setChain([...chain.slice(0, -1), newIdiom]);
      setCurrentHint(`已更换！请以"${newIdiom.slice(-1)}"开头`);
      setChangeRemain(changeRemain - 1);

      const savedData = safeStorage.getJSON<IdiomChainData>('idiom_chain_data', { date: '', challenges: [], changeRemain: 3, badges: [], completedToday: 0 });
      savedData.changeRemain = changeRemain - 1;
      safeStorage.setJSON('idiom_chain_data', savedData);
    }
  };

  // 完成挑战
  const completeChallenge = () => {
    if (chain.length < 3) return;

    const newCompleted = completedToday + 1;
    setCompletedToday(newCompleted);

    // 检查是否获得徽章
    const savedData = safeStorage.getJSON<IdiomChainData>('idiom_chain_data', { date: '', challenges: [], changeRemain: 3, badges: [], completedToday: 0 });
    if (newCompleted === 5 && !savedData.badges.includes('daily_master')) {
      savedData.badges = [...savedData.badges, 'daily_master'];
      setBadges([...badges, 'daily_master']);
    }
    if (chain.length >= 10 && !savedData.badges.includes('long_chain')) {
      savedData.badges = [...savedData.badges, 'long_chain'];
      setBadges([...badges, 'long_chain']);
    }

    savedData.completedToday = newCompleted;
    safeStorage.setJSON('idiom_chain_data', savedData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 标题和音效开关 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-accent" />
          成语接龙
        </h2>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          {soundEnabled ? (
            <Volume2Icon className="w-5 h-5 text-gray-400" />
          ) : (
            <VolumeXIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* 今日挑战进度 */}
      <div className="bg-gradient-to-r from-accent/10 to-transparent rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-white">今日挑战</span>
          </div>
          <span className="text-sm text-gray-400">
            {completedToday}/5 完成
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < completedToday ? 'bg-accent' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 换词和难度选择 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="easy">简单</option>
            <option value="normal">普通</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleChangeWord}
            disabled={changeRemain <= 0 || chain.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              changeRemain > 0 && chain.length > 0
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            <RefreshCwIcon className="w-4 h-4" />
            换词 ({changeRemain}/3)
          </button>
          <button
            onClick={startNewGame}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/80 transition-colors"
          >
            新游戏
          </button>
        </div>
      </div>

      {/* 接龙展示 */}
      <div className="bg-white/5 rounded-lg p-6 min-h-[200px]">
        {chain.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-gray-400">点击"新游戏"开始接龙</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-4">当前接龙链：</p>
            <div className="flex flex-wrap gap-2">
              {chain.map((idiom, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    index === chain.length - 1
                      ? 'bg-accent/20 text-accent ring-2 ring-accent/50'
                      : 'bg-white/5 text-white'
                  } ${showFeedback && index === chain.length - 1 ? 'animate-pulse' : ''}`}
                >
                  {index === 0 && <span className="mr-1">🟢</span>}
                  {index > 0 && <span className="mr-1">→</span>}
                  {idiom}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={currentHint || '输入成语...'}
            className={`flex-1 px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
              isCorrect === true ? 'border-green-500 focus:ring-green-500/50' :
              isCorrect === false ? 'border-red-500 focus:ring-red-500/50' :
              'border-white/10 focus:ring-accent/50'
            }`}
            disabled={showFeedback}
          />
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim() || showFeedback}
            className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交
          </button>
        </div>

        {/* 提示按钮 */}
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          💡 需要提示？
        </button>

        {showHint && chain.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
            {getRandomIdiom(chain[chain.length - 1].slice(-1))} 以"{chain[chain.length - 1].slice(-1)}"开头的成语
          </div>
        )}
      </div>

      {/* 徽章展示 */}
      {badges.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-white">已获得徽章</span>
          </div>
          <div className="flex gap-2">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm"
              >
                {badge === 'daily_master' && '🏆 今日大师'}
                {badge === 'long_chain' && '🔗 超长链条'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 完成按钮 */}
      {chain.length >= 5 && (
        <button
          onClick={completeChallenge}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
        >
          ✅ 完成挑战（接龙 {chain.length} 轮）
        </button>
      )}
    </div>
  );
}
