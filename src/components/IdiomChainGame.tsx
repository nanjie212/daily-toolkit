import { useState, useEffect, useRef } from 'react';
import { RefreshCwIcon, TrophyIcon, SparklesIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { safeStorage } from '@/lib/safeStorage';

interface IdiomChallenge {
  startIdiom: string;
  targetChar: string;
  completed: boolean;
  hint?: string;
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

  // 初始化 - 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const today = new Date().toDateString();
    const savedData = safeStorage.getJSON('idiom_chain_data') || {};
    const lastDate = savedData.date || '';

    // 新的一天，重置挑战
    if (lastDate !== today) {
      const newChallenges = generateDailyChallenges();
      savedData.date = today;
      savedData.challenges = newChallenges;
      savedData.changeRemain = 3;
      safeStorage.setJSON('idiom_chain_data', savedData);
    }

    setChangeRemain(savedData.changeRemain || 3);
    setTodayChallenges(savedData.challenges || []);
    setCompletedToday(savedData.challenges?.filter((c: IdiomChallenge) => c.completed).length || 0);
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

  // 获取随机成语
  const getRandomIdiom = (startChar: string): string => {
    const idiomDB: Record<string, string[]> = {
      一: ['一心一意','一见如故','一马当先','一鸣惊人','一目十行','一诺千金','一针见血','一落千丈','一帆风顺','一举两得'],
      心: ['心花怒放','心想事成','心旷神怡','心直口快','心血来潮','心满意足'],
      人: ['人山人海','人声鼎沸','人尽其才','人杰地灵','人才济济'],
      天: ['天长地久','天翻地覆','天衣无缝','天马行空','天涯海角'],
      大: ['大公无私','大器晚成','大同小异','大刀阔斧','大智若愚'],
      万: ['万无一失','万众一心','万象更新','万紫千红'],
      千: ['千钧一发','千丝万缕','千锤百炼','千载难逢'],
      百: ['百发百中','百花齐放','百折不挠','百感交集'],
      龙: ['龙飞凤舞','龙马精神','龙腾虎跃','龙争虎斗'],
      风: ['风和日丽','风调雨顺','风华正茂','风驰电掣'],
      花: ['花好月圆','花团锦簇','花言巧语','花枝招展'],
      日: ['日新月异','日积月累','日理万机'],
      水: ['水落石出','水深火热','水到渠成','水滴石穿'],
      山: ['山清水秀','山穷水尽','山盟海誓'],
      金: ['金碧辉煌','金玉满堂','金榜题名'],
      火: ['火冒三丈','火眼金睛','火中取栗'],
      不: ['不可思议','不翼而飞','不屈不挠','不约而同'],
      自: ['自强不息','自告奋勇','自力更生','自言自语'],
      无: ['无微不至','无与伦比','无可奈何','无穷无尽'],
      出: ['出类拔萃','出人头地','出口成章'],
      画: ['画龙点睛','画蛇添足','画饼充饥'],
      虎: ['虎头蛇尾','虎视眈眈','虎口余生'],
      意: ['意气风发','意味深长','意想不到'],
      成: ['成竹在胸','成千上万','成家立业'],
      功: ['功成名就','功德无量'],
      前: ['前功尽弃','前车之鉴','前仆后继'],
      行: ['行云流水','行尸走肉'],
      目: ['目不转睛','目瞪口呆','目中无人'],
      如: ['如虎添翼','如鱼得水','如火如荼','如雷贯耳'],
      海: ['海阔天空','海底捞月','海纳百川'],
      声: ['声东击西','声色俱厉'],
      才: ['才高八斗','才华横溢'],
      见: ['见义勇为','见多识广'],
      云: ['云消雾散'],
      雨: ['雨过天晴','雨后春笋'],
      草: ['草木皆兵'],
      后: ['后来居上'],
      全: ['全心全意'],
      美: ['美不胜收','美轮美奂'],
      快: ['快马加鞭'],
      身: ['身临其境','身体力行'],
      地: ['地大物博'],
      善: ['善始善终'],
      力: ['力不从心','力挽狂澜'],
      高: ['高瞻远瞩','高枕无忧'],
      长: ['长驱直入','长年累月'],
      老: ['老马识途','老当益壮'],
      下: ['下笔成章'],
      效: ['效犬马力'],
      直: ['直截了当'],
      壮: ['壮志凌云'],
      图: ['图穷匕见'],
      省: ['省吃俭用'],
      口: ['口若悬河','口是心非'],
      称: ['称心如意'],
      赞: ['赞不绝口'],
      文: ['文质彬彬','文武双全'],
      墨: ['墨守成规'],
      益: ['精益求精'],
      打: ['打草惊蛇'],
      知: ['知足常乐','知己知彼'],
      俗: ['俗不可耐'],
      简: ['简明扼要'],
    };

    const idioms = idiomDB[startChar] || ['一帆风顺'];
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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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

    // 找另一个同首字的成语
    const idiomDB: Record<string, string[]> = {
      一: ['一心一意','一见如故','一马当先','一鸣惊人','一目十行','一诺千金','一针见血','一落千丈','一帆风顺','一举两得'],
      心: ['心花怒放','心想事成','心旷神怡','心直口快','心血来潮','心满意足'],
      人: ['人山人海','人声鼎沸','人尽其才','人杰地灵','人才济济'],
      天: ['天长地久','天翻地覆','天衣无缝','天马行空','天涯海角'],
      大: ['大公无私','大器晚成','大同小异','大刀阔斧','大智若愚'],
      万: ['万无一失','万众一心','万象更新','万紫千红'],
      千: ['千钧一发','千丝万缕','千锤百炼','千载难逢'],
      百: ['百发百中','百花齐放','百折不挠','百感交集'],
      龙: ['龙飞凤舞','龙马精神','龙腾虎跃','龙争虎斗'],
      风: ['风和日丽','风调雨顺','风华正茂','风驰电掣'],
      花: ['花好月圆','花团锦簇','花言巧语','花枝招展'],
      日: ['日新月异','日积月累','日理万机'],
      水: ['水落石出','水深火热','水到渠成','水滴石穿'],
      山: ['山清水秀','山穷水尽','山盟海誓'],
      金: ['金碧辉煌','金玉满堂','金榜题名'],
      火: ['火冒三丈','火眼金睛','火中取栗'],
      不: ['不可思议','不翼而飞','不屈不挠','不约而同'],
      自: ['自强不息','自告奋勇','自力更生','自言自语'],
      无: ['无微不至','无与伦比','无可奈何','无穷无尽'],
      出: ['出类拔萃','出人头地','出口成章'],
      画: ['画龙点睛','画蛇添足','画饼充饥'],
      虎: ['虎头蛇尾','虎视眈眈','虎口余生'],
    };

    const alternatives = (idiomDB[lastChar] || []).filter(i => !chain.includes(i));
    if (alternatives.length > 0) {
      const newIdiom = alternatives[Math.floor(Math.random() * alternatives.length)];
      setChain([...chain.slice(0, -1), newIdiom]);
      setCurrentHint(`已更换！请以"${newIdiom.slice(-1)}"开头`);
      setChangeRemain(changeRemain - 1);

      const savedData = safeStorage.getJSON('idiom_chain_data') || {};
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
    const savedData = safeStorage.getJSON('idiom_chain_data') || {};
    if (newCompleted === 5 && !savedData.badges?.includes('daily_master')) {
      savedData.badges = [...(savedData.badges || []), 'daily_master'];
      setBadges([...(badges || []), 'daily_master']);
    }
    if (chain.length >= 10 && !savedData.badges?.includes('long_chain')) {
      savedData.badges = [...(savedData.badges || []), 'long_chain'];
      setBadges([...(badges || []), 'long_chain']);
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
