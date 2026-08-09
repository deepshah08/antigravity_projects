import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { Book, Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Home, LayoutList, Menu, X } from 'lucide-react';

interface ArticleInfo {
  id: string;
  title: string;
  url: string;
}
interface IndexData {
  title: string;
  articles: ArticleInfo[];
}
interface ArticleData {
  id: string;
  title: string;
  content: string;
  url: string;
}

// Custom hook for local storage state
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(error);
    }
  };
  return [storedValue, setValue] as const;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-background text-textMain font-sans selection:bg-primary/30">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
            <Book className="w-6 h-6 text-primary" />
            Terminal Pro
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link to="/topic/linux" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
               Linux
            </Link>
            <Link to="/topic/distributed-systems" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
               Distributed Systems
            </Link>
          </div>
          <button className="sm:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="sm:hidden bg-surface border-b border-white/10 px-4 py-4 flex flex-col gap-4">
            <Link to="/" onClick={() => setMenuOpen(false)} className="font-medium">Home</Link>
            <Link to="/topic/linux" onClick={() => setMenuOpen(false)} className="font-medium">Linux</Link>
            <Link to="/topic/distributed-systems" onClick={() => setMenuOpen(false)} className="font-medium">Distributed Systems</Link>
          </div>
        )}
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-textMuted text-sm">
        <p>Offline Knowledge Center &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function HomeView() {
  return (
    <div className="space-y-12 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Offline Knowledge Center</h1>
        <p className="text-xl text-textMuted max-w-2xl mx-auto">
          Distraction-free, fully offline readable tutorials. No ads. No popups. Pure knowledge.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Link to="/topic/linux" className="group p-6 rounded-2xl bg-surface border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Book className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Linux Tutorial</h2>
          <p className="text-textMuted">Master the command line, file systems, and core Linux administration concepts.</p>
        </Link>
        <Link to="/topic/distributed-systems" className="group p-6 rounded-2xl bg-surface border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Book className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Distributed Systems</h2>
          <p className="text-textMuted">Learn about network architectures, consensus, and scalable systems.</p>
        </Link>
      </div>
    </div>
  );
}

function TopicIndex() {
  const { topicId } = useParams();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [error, setError] = useState('');
  const [completedState] = useLocalStorage<Record<string, boolean>>('completed-articles', {});

  useEffect(() => {
    fetch(`/data/${topicId}-index.json`)
      .then(res => {
        if (!res.ok) throw new Error('Topic not found or data missing');
        return res.json();
      })
      .then(setIndexData)
      .catch(e => setError(e.message));
  }, [topicId]);

  if (error) return <div className="text-red-400 p-8 text-center bg-red-400/10 rounded-xl">{error}</div>;
  if (!indexData) return <div className="animate-pulse h-32 bg-surface rounded-xl"></div>;

  const total = indexData.articles.length;
  const completedCount = indexData.articles.filter(a => completedState[a.id]).length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <Link to="/" className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4"/> Back to Topics
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold">{indexData.title}</h1>

        <div className="bg-surface rounded-full h-2 w-full overflow-hidden">
           <div className="bg-primary h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-sm text-textMuted">{completedCount} of {total} lessons completed ({progress}%)</p>
      </div>

      <div className="space-y-3">
        {indexData.articles.map((article, idx) => {
          const isCompleted = completedState[article.id];
          return (
            <Link
              key={article.id}
              to={`/article/${topicId}/${article.id}`}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-surface/50 border-white/5 opacity-75 hover:opacity-100'
                  : 'bg-surface border-white/10 hover:border-primary/50'
              }`}
            >
              <div className="flex-shrink-0 w-8 text-center text-textMuted font-mono text-sm">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex-1 font-medium">{article.title}</div>
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ArticleReader() {
  const { topicId, articleId } = useParams();

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [error, setError] = useState('');

  const [completedState, setCompletedState] = useLocalStorage<Record<string, boolean>>('completed-articles', {});
  const [bookmarks, setBookmarks] = useLocalStorage<Record<string, boolean>>('bookmarked-articles', {});

  useEffect(() => {
    window.scrollTo(0, 0);
    setArticle(null);
    setError('');

    // Fetch index for navigation
    fetch(`/data/${topicId}-index.json`)
      .then(res => res.json())
      .then(setIndexData)
      .catch(console.warn);

    // Fetch article content
    fetch(`/data/${articleId}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load article content');
        return res.json();
      })
      .then(setArticle)
      .catch(e => setError(e.message));
  }, [topicId, articleId]);

  if (error) return <div className="text-red-400 p-8 text-center bg-red-400/10 rounded-xl">{error}</div>;
  if (!article || !indexData) return <div className="space-y-4 max-w-3xl mx-auto"><div className="h-8 w-3/4 bg-surface animate-pulse rounded"></div><div className="h-64 w-full bg-surface animate-pulse rounded"></div></div>;

  const isCompleted = !!completedState[articleId!];
  const isBookmarked = !!bookmarks[articleId!];

  const toggleCompleted = () => {
    setCompletedState(prev => ({ ...prev, [articleId!]: !prev[articleId!] }));
  };
  const toggleBookmark = () => {
    setBookmarks(prev => ({ ...prev, [articleId!]: !prev[articleId!] }));
  };

  const currentIndex = indexData.articles.findIndex(a => a.id === articleId);
  const prevArticle = currentIndex > 0 ? indexData.articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < indexData.articles.length - 1 ? indexData.articles[currentIndex + 1] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <nav className="flex items-center justify-between text-sm">
        <Link to={`/topic/${topicId}`} className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
          <LayoutList className="w-4 h-4"/> Table of Contents
        </Link>
        <div className="flex gap-2">
          <button onClick={toggleBookmark} className={`p-2 rounded-lg transition-colors ${isBookmarked ? 'bg-primary/20 text-primary' : 'bg-surface text-textMuted hover:text-white'}`} title="Bookmark">
             <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={toggleCompleted} className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isCompleted ? 'bg-primary text-background font-medium' : 'bg-surface text-textMuted hover:text-white'}`}>
             <CheckCircle2 className="w-5 h-5" />
             <span className="hidden sm:inline">{isCompleted ? 'Completed' : 'Mark as read'}</span>
          </button>
        </div>
      </nav>

      <article className="prose prose-invert prose-orange max-w-none prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
        <h1>{article.title}</h1>
        {/* Render HTML securely using dangerouslySetInnerHTML, relying on scraper sanitization */}
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>

      <div className="pt-8 mt-12 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
        {prevArticle ? (
          <Link to={`/article/${topicId}/${prevArticle.id}`} className="flex-1 p-4 rounded-xl border border-white/10 bg-surface hover:border-primary/50 transition-colors group">
            <div className="text-xs text-textMuted mb-1 flex items-center gap-1"><ChevronLeft className="w-3 h-3"/> Previous</div>
            <div className="font-medium group-hover:text-primary transition-colors line-clamp-1">{prevArticle.title}</div>
          </Link>
        ) : <div className="flex-1"></div>}

        {nextArticle ? (
          <Link onClick={() => { if(!isCompleted) toggleCompleted(); }} to={`/article/${topicId}/${nextArticle.id}`} className="flex-1 p-4 rounded-xl border border-white/10 bg-surface hover:border-primary/50 transition-colors group text-right">
            <div className="text-xs text-textMuted mb-1 flex items-center justify-end gap-1">Next <ChevronRight className="w-3 h-3"/></div>
            <div className="font-medium group-hover:text-primary transition-colors line-clamp-1">{nextArticle.title}</div>
          </Link>
        ) : <div className="flex-1"></div>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/topic/:topicId" element={<TopicIndex />} />
          <Route path="/article/:topicId/:articleId" element={<ArticleReader />} />
        </Routes>
      </Layout>
    </Router>
  );
}
