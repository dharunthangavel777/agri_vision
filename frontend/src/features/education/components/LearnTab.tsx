import React from 'react';
import { 
  ArrowLeft, 
  History, 
  Bookmark, 
  BookmarkCheck, 
  BookOpen, 
  Search, 
  Filter, 
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { articles } from '../data/articles.ts';
import { useAppContext } from '../../../core/context/AppContext.tsx';
import { cn } from '../../../shared/utils/cn.ts';

export const LearnTab: React.FC = () => {
  const { appData, updateModuleData } = useAppContext();

  const toggleBookmark = (id: string) => {
    const newBookmarks = appData.learn.bookmarks.includes(id) 
      ? appData.learn.bookmarks.filter(b => b !== id) 
      : [...appData.learn.bookmarks, id];
    updateModuleData('learn', { ...appData.learn, bookmarks: newBookmarks });
  };

  if (appData.learn.selectedArticle) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -15 }}
        className="space-y-5 pb-20 max-w-4xl mx-auto"
      >
        <button 
          onClick={() => updateModuleData('learn', { ...appData.learn, selectedArticle: null })}
          className="flex items-center text-xs font-semibold text-stone-300 hover:text-white transition-colors group mb-2"
        >
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform text-[#278b50]" />
          Back to Knowledge Hub
        </button>

        <div className="agri-card overflow-hidden">
          <div className="h-64 sm:h-72 relative">
            <img 
              src={appData.learn.selectedArticle.image} 
              alt={appData.learn.selectedArticle.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141b14] via-[#141b14]/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="agri-pill g text-xs py-0.5 px-3 mb-2">
                {appData.learn.selectedArticle.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 leading-tight">
                {appData.learn.selectedArticle.title}
              </h1>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(255,255,255,0.06)] text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#278b50]" />
                {appData.learn.selectedArticle.time} read
              </span>
              <button 
                onClick={() => toggleBookmark(appData.learn.selectedArticle.id)}
                className="flex items-center gap-1.5 text-stone-300 hover:text-emerald-400 transition-colors font-medium"
              >
                {appData.learn.bookmarks.includes(appData.learn.selectedArticle.id) ? (
                  <><BookmarkCheck size={16} className="text-emerald-400" /> Saved to Bookmarks</>
                ) : (
                  <><Bookmark size={16} /> Save for later</>
                )}
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-stone-300 text-sm leading-relaxed space-y-4">
              <Markdown>{appData.learn.selectedArticle.content}</Markdown>
            </div>

            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Related Guides</h4>
              <div className="flex flex-wrap gap-2">
                {articles
                  .filter(a => a.category === appData.learn.selectedArticle.category && a.id !== appData.learn.selectedArticle.id)
                  .slice(0, 3)
                  .map(related => (
                    <button 
                      key={related.id}
                      onClick={() => updateModuleData('learn', { ...appData.learn, selectedArticle: related })}
                      className="px-3.5 py-2 bg-[#1c241c] hover:bg-[#233023] border border-white/5 hover:border-[#278b50]/30 rounded-xl text-xs text-stone-200 transition-colors"
                    >
                      {related.title}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const filteredArticles = articles.filter(article => {
    const query = (appData.learn?.searchQuery || '').toLowerCase();
    const matchesSearch = !query || 
                        (article.title || '').toLowerCase().includes(query) ||
                        (article.description || '').toLowerCase().includes(query);
    const matchesCategory = appData.learn.selectedCategory === 'All' || article.category === appData.learn.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="agri-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen size={24} className="text-[#278b50]" />
              Agricultural Knowledge Hub
            </h1>
            <p className="text-xs md:text-sm text-stone-300 mt-1">
              Field-tested guides on organic pest management, modern drip irrigation, and government subsidy schemes.
            </p>
          </div>

          <span className="self-start sm:self-auto text-xs text-stone-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            {articles.length} Verified Guides
          </span>
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-3 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Search farming techniques, pests, organic tips..." 
              value={appData.learn.searchQuery}
              onChange={(e) => updateModuleData('learn', { ...appData.learn, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1c241c] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#278b50]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateModuleData('learn', { ...appData.learn, selectedCategory: cat })}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  appData.learn.selectedCategory === cat 
                    ? "bg-[#278b50] text-white shadow-md shadow-[#278b50]/20" 
                    : "bg-[#1c241c] text-stone-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((article) => (
          <div 
            key={article.id} 
            onClick={() => updateModuleData('learn', { ...appData.learn, selectedArticle: article })}
            className="agri-card overflow-hidden group hover:border-[#278b50]/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-44 overflow-hidden relative">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(article.id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:text-emerald-400 transition-colors"
                  aria-label="Bookmark article"
                >
                  {appData.learn.bookmarks.includes(article.id) ? (
                    <BookmarkCheck size={16} className="text-emerald-400" />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </button>

                <div className="absolute bottom-3 left-3">
                  <span className="agri-pill g text-[10px] py-0.5 px-2.5">
                    {article.category}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-1.5">
                  <Clock size={12} className="text-[#278b50]" />
                  <span>{article.time} read</span>
                </div>

                <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors mb-1.5">
                  {article.title}
                </h3>

                <p className="text-stone-300 text-xs line-clamp-2 leading-relaxed">
                  {article.description}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center justify-between text-xs font-semibold text-[#278b50] border-t border-[rgba(255,255,255,0.04)] mt-2">
              <span>Read Full Guide</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="agri-card p-12 text-center">
          <BookOpen size={36} className="text-stone-600 mx-auto mb-2" />
          <p className="text-stone-300 text-xs font-medium">No guides found matching your search.</p>
          <button 
            type="button"
            onClick={() => {
              updateModuleData('learn', { ...appData.learn, searchQuery: '', selectedCategory: 'All' });
            }}
            className="mt-3 text-[#278b50] text-xs font-bold hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

    </div>
  );
};
