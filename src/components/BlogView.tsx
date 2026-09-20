import React, { useState } from 'react';
import {
  PenTool,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  DollarSign,
  Plus,
  X,
  CheckCircle2,
  Wallet,
  Clock,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { BlogArticle } from '../types';

export const BlogView: React.FC = () => {
  const {
    user,
    articles,
    blogBalance,
    publishArticle,
    likeArticle,
    addComment,
    transferEarningsToWallet,
    formatKsh,
  } = useMboka();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>('');

  // Write Article form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<BlogArticle['category']>('Business & Hustle');
  const [newExcerpt, setNewExcerpt] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCoverImage, setNewCoverImage] = useState<string>(
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80'
  );

  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  const categories = [
    'All',
    'Business & Hustle',
    'Technology',
    'Agribusiness',
    'Personal Finance',
    'Community Stories',
  ];

  const filteredArticles =
    selectedCategory === 'All'
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  const totalUserArticles = articles.filter((a) => a.authorId === user.id);
  const totalUserViews = totalUserArticles.reduce((sum, a) => sum + a.views, 0);
  const totalUserImpressions = totalUserArticles.reduce((sum, a) => sum + a.adImpressions, 0);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    publishArticle({
      title: newTitle,
      category: newCategory,
      excerpt: newExcerpt || newContent.slice(0, 120) + '...',
      content: newContent,
      coverImage: newCoverImage,
    });

    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');
    setShowWriteModal(false);
  };

  const handleClaimAdRevenue = async () => {
    if (blogBalance <= 0) return;
    setIsTransferring(true);
    const res = await transferEarningsToWallet('blog');
    setIsTransferring(false);
    setTransferMsg(res.message);
    setTimeout(() => setTransferMsg(null), 3000);
  };

  const handleCommentSubmit = (articleId: string) => {
    if (!commentInput.trim()) return;
    addComment(articleId, commentInput);
    setCommentInput('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Monetization Header Banner */}
      <div className="bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Mboka Content Monetization Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Publish Articles & Earn Ad Revenue
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Every view and verified reader on your published articles generates advertising revenue with our transparent <strong className="text-white">70% author revenue share</strong>.
            </p>
          </div>

          {/* Author Stats Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center md:text-right shrink-0">
            <span className="text-xs text-teal-200 font-semibold block">Available Blog Ad Earnings</span>
            <div className="text-3xl font-black font-mono mt-1 text-white">
              {formatKsh(blogBalance)}
            </div>
            <button
              onClick={handleClaimAdRevenue}
              disabled={isTransferring || blogBalance <= 0}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-950" />
              <span>{isTransferring ? 'Claiming...' : 'Claim to Wallet'}</span>
            </button>
          </div>
        </div>

        {transferMsg && (
          <div className="mt-4 p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-xs text-white font-medium">
            {transferMsg}
          </div>
        )}
      </div>

      {/* Creator Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">My Published Articles</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            {totalUserArticles.length}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Live in directory</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Article Views</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            {totalUserViews.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Verified reader count</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Ad Impressions</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            {totalUserImpressions.toLocaleString()}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">Monetized banners</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Rev Share Split</span>
          <div className="text-2xl font-black text-emerald-700 font-heading mt-1">
            70% / 30%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Author payout rate</span>
        </div>
      </div>

      {/* Categories & Write Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowWriteModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
          >
            <div>
              {/* Cover Image */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={art.coverImage}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider bg-black/60 text-white px-2.5 py-1 rounded-md backdrop-blur-xs">
                  {art.category}
                </span>
                {art.isFeatured && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md shadow-xs">
                    Featured
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{art.date}</span>
                  <span>•</span>
                  <span>{art.readTime}</span>
                </div>

                <h3
                  onClick={() => setSelectedArticle(art)}
                  className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer font-heading"
                >
                  {art.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>
            </div>

            {/* Footer / Stats */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <img
                  src={art.authorAvatar}
                  alt={art.authorName}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-semibold text-slate-700 text-xs truncate max-w-[90px]">
                  {art.authorName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => likeArticle(art.id)}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    art.userLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                  }`}
                  title="Like article"
                >
                  <Heart className={`w-3.5 h-3.5 ${art.userLiked ? 'fill-rose-600' : ''}`} />
                  <span>{art.likes}</span>
                </button>

                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{art.views}</span>
                </div>

                <button
                  onClick={() => setSelectedArticle(art)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 text-xs"
                >
                  Read →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal with Advertisement Placements */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-md">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <h2 className="text-2xl font-black text-slate-900 font-heading leading-tight">
                {selectedArticle.title}
              </h2>

              <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedArticle.authorAvatar}
                    alt={selectedArticle.authorName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      {selectedArticle.authorName}
                    </strong>
                    <span>{selectedArticle.date} • {selectedArticle.readTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => likeArticle(selectedArticle.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedArticle.userLiked
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${selectedArticle.userLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span>{selectedArticle.likes} Claps</span>
                  </button>
                </div>
              </div>

              {/* Cover image in reader */}
              <div className="rounded-2xl overflow-hidden max-h-72">
                <img
                  src={selectedArticle.coverImage}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Simulated Ad Placement 1 (Top Banner Ad) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-emerald-500/10 border border-amber-200/80 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Sponsored Advertisement • Earning 70% Ad Revenue
                </span>
                <p className="text-xs font-bold text-slate-800">
                  📱 Safaricom & Airtel 2% Instant Cashback on Mboka POS
                </p>
                <p className="text-[11px] text-slate-500">
                  Top up your line or resell tokens with instant WhatsApp receipts. Zero commission fees!
                </p>
              </div>

              {/* Article Content */}
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap space-y-4">
                {selectedArticle.content}
              </div>

              {/* Simulated Ad Placement 2 (Native Footer Ad) */}
              <div className="p-4 rounded-xl bg-slate-900 text-white text-center space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                  Mboka Partner Notice
                </span>
                <p className="text-xs font-bold text-white">
                  ⚡ Buy KPLC Tokens 24/7 with zero system delay
                </p>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-[11px] bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg hover:bg-emerald-400 mt-1 inline-block"
                >
                  Try POS Terminal Now
                </button>
              </div>

              {/* Comments Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Discussion ({selectedArticle.commentsCount})</span>
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add a constructive thought or question..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleCommentSubmit(selectedArticle.id)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Article Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-heading">Write New Mboka Article</h3>
                <p className="text-xs text-slate-500">Published articles immediately qualify for ad monetization</p>
              </div>
              <button
                onClick={() => setShowWriteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Article Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 5 Mistakes to Avoid When Starting a Cyber & POS Shop"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Business & Hustle">Business & Hustle</option>
                    <option value="Technology">Technology</option>
                    <option value="Agribusiness">Agribusiness</option>
                    <option value="Personal Finance">Personal Finance</option>
                    <option value="Community Stories">Community Stories</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Cover Photo Preset</label>
                  <select
                    value={newCoverImage}
                    onChange={(e) => setNewCoverImage(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80">
                      Shop & POS Agency
                    </option>
                    <option value="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=80">
                      Farming & Poultry
                    </option>
                    <option value="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80">
                      Mobile Tech & Fintech
                    </option>
                    <option value="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80">
                      Community & Networking
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Short Excerpt / Summary</label>
                <input
                  type="text"
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="One sentence that hooks the reader..."
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Article Content (Markdown / Text)</label>
                <textarea
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your advice, business breakdown, or inspiring experience here..."
                  className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Publish & Monetize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
