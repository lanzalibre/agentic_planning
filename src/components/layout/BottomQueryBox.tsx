import { Send, Bot, User, ChevronUp, ChevronDown, Sparkles, BookOpen, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { preloadedQuestions } from '../../data/mockData';
import type { PlaybookItem } from '../../data/mockData';
import type { PageId } from '../../types';

export function BottomQueryBox() {
  const {
    queryMessages, addQuery, clearHistory,
    setCurrentPage, setPlanningConfigTab, setDemandAnalysisTab,
    pendingMention, clearMention,
  } = useApp();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [playbooksOpen, setPlaybooksOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [queryMessages, expanded]);

  // Handle incoming mentions from shift+click
  useEffect(() => {
    if (!pendingMention) return;
    setInput(prev => (prev ? prev + ' ' : '') + pendingMention);
    clearMention();
    setExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      const ta = textareaRef.current;
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
      }
    }, 50);
  }, [pendingMention, clearMention]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addQuery(text);
    setInput('');
    setExpanded(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handlePlaybookClick = (item: PlaybookItem) => {
    if (item.action === 'clear-history') {
      clearHistory();
      setExpanded(false);
    } else if (item.query) {
      // Query item — populate the text box
      setInput(item.query);
      setTimeout(() => {
        textareaRef.current?.focus();
        const ta = textareaRef.current;
        if (ta) {
          ta.style.height = 'auto';
          ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
        }
      }, 20);
    } else if (item.page) {
      // Navigate item
      setCurrentPage(item.page as PageId);
      if (item.tab) {
        if (item.tab === 'lead-times' || item.tab === 'throughput') {
          setPlanningConfigTab(item.tab);
        } else if (item.tab === 'abc-xyz' || item.tab === 'sunburst') {
          setDemandAnalysisTab(item.tab);
        }
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      {/* Chat history panel */}
      {expanded && (
        <>
          {/* Panel header with close button */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Conversation</span>
            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Close conversation"
            >
              <X size={13} />
            </button>
          </div>
          {/* Messages */}
          <div className="h-56 overflow-y-auto px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col gap-3">
            {queryMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs
                  ${msg.type === 'assistant' ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  {msg.type === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed
                  ${msg.type === 'assistant'
                    ? 'bg-white border border-gray-200 text-gray-800'
                    : 'bg-blue-600 text-white'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </>
      )}

      {/* Playbooks strip */}
      {playbooksOpen ? (
        <div className="border-b border-gray-100 px-4 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-gray-500">
              <BookOpen size={12} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">AI Playbooks</span>
            </div>
            <button
              onClick={() => setPlaybooksOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Hide playbooks"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {preloadedQuestions.map(group => (
              <div key={group.category} className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap flex-shrink-0 w-36 truncate">
                  {group.category}
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handlePlaybookClick(item)}
                      className={`flex-shrink-0 text-xs rounded-full px-3 py-0.5 transition-colors whitespace-nowrap border
                        ${item.action === 'clear-history'
                          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300'
                          : item.query
                            ? 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                            : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                      title={item.action === 'clear-history' ? 'Clear all messages' : item.query ? 'Populate chat input' : 'Navigate to page'}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setPlaybooksOpen(true)}
          className="w-full flex items-center gap-1.5 justify-center text-xs text-gray-400 hover:text-gray-600 py-1 border-b border-gray-100 transition-colors"
        >
          <BookOpen size={11} />
          AI Playbooks
        </button>
      )}

      {/* Input row */}
      <div className="flex items-end gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-blue-600 flex-shrink-0 mb-1">
          <Sparkles size={16} />
        </div>
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your supply chain data…"
            className="w-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none bg-transparent min-h-[42px] max-h-[120px]"
            rows={1}
          />
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <Send size={15} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
            title={expanded ? 'Collapse chat' : 'Expand chat'}
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
