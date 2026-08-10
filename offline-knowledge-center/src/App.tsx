import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { Book, Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Home, LayoutList, Menu, MessageCircle, X, Loader2, Send } from 'lucide-react';

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

interface TopicRegistry {
  topics: {
    id: string;
    title: string;
    description: string;
  }[];
}

function HomeView() {
  const [topics, setTopics] = useState<TopicRegistry['topics'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('./data/topics-registry.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch topics registry');
        return res.json();
      })
      .then(data => setTopics(data.topics))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div className="space-y-12 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Offline Knowledge Center</h1>
        <p className="text-xl text-textMuted max-w-2xl mx-auto">
          Distraction-free, fully offline readable tutorials. No ads. No popups. Pure knowledge.
        </p>
      </div>

      {error && <div className="text-red-400 p-4 text-center bg-red-400/10 rounded-xl">{error}</div>}
      
      {!topics && !error && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {topics && (
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {topics.map(topic => (
            <Link key={topic.id} to={`/topic/${topic.id}`} className="group p-6 rounded-2xl bg-surface border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Book className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">{topic.title}</h2>
              <p className="text-textMuted">{topic.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicIndex() {
  const { topicId } = useParams();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [error, setError] = useState('');
  const [completedState] = useLocalStorage<Record<string, boolean>>('completed-articles', {});

  useEffect(() => {
    fetch(`./data/${topicId}-index.json`)
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


interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function AITutorSidebar({
  isOpen,
  onClose,
  articleTitle,
  articleContent
}: {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
  articleContent: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: `Article Title: ${articleTitle}\n\nArticle Content Excerpt:\n${articleContent.substring(0, 2000)}...`
        })
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error and couldn't process your question." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-surface/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Socratic Tutor
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <X className="w-5 h-5 text-textMuted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-textMuted text-sm mt-8 space-y-2">
            <p>I'm your Socratic AI Tutor.</p>
            <p>What questions do you have about this article?</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-background rounded-tr-sm'
                  : 'bg-white/5 border border-white/10 rounded-tl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-textMuted">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-background p-2 rounded-lg disabled:opacity-50 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ArticleReader() {
  const { topicId, articleId } = useParams();

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [error, setError] = useState('');
  const [showTutor, setShowTutor] = useState(false);

  const [completedState, setCompletedState] = useLocalStorage<Record<string, boolean>>('completed-articles', {});
  const [bookmarks, setBookmarks] = useLocalStorage<Record<string, boolean>>('bookmarked-articles', {});

  useEffect(() => {
    window.scrollTo(0, 0);
    setArticle(null);
    setError('');

    // Fetch index for navigation
    fetch(`./data/${topicId}-index.json`)
      .then(res => res.json())
      .then(setIndexData)
      .catch(console.warn);

    // Fetch article content
    fetch(`./data/${articleId}.json`)
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
    <>
      <AITutorSidebar
        isOpen={showTutor}
        onClose={() => setShowTutor(false)}
        articleTitle={article.title}
        articleContent={article.content}
      />
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <nav className="flex items-center justify-between text-sm">
        <Link to={`/topic/${topicId}`} className="text-textMuted hover:text-primary transition-colors flex items-center gap-1">
          <LayoutList className="w-4 h-4"/> Table of Contents
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setShowTutor(true)} className={`p-2 rounded-lg transition-colors ${showTutor ? 'bg-primary/20 text-primary' : 'bg-surface text-textMuted hover:text-white'}`} title="Socratic AI Tutor">
             <MessageCircle className="w-5 h-5" />
          </button>
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
    </>
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
