import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiX,
  FiMessageSquare,
  FiMaximize2,
  FiMinimize2,
  FiTrash2,
  FiSend,
  FiZap,
} from 'react-icons/fi';
import { toggleChat } from '../../store/slices/uiSlice';
import { getTheme, gradientCss } from '../../utils/domainTheme';

// ---------------------------------------------------------------------------
// Markdown renderer for assistant messages.
// Built as a factory so blockquote/link accents inherit the current sector
// theme — keeps markdown visuals uniform with the rest of the dashboard.
// ---------------------------------------------------------------------------
const buildMarkdownComponents = (theme) => ({
  p: ({ node, ...props }) => (
    <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props} />
  ),
  h1: ({ node, ...props }) => (
    <h1 className="text-base font-bold mt-2 mb-1.5" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-sm font-bold mt-2 mb-1.5" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-sm font-semibold mt-1.5 mb-1" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-outside pl-5 my-1.5 space-y-0.5 text-sm" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-outside pl-5 my-1.5 space-y-0.5 text-sm" {...props} />
  ),
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-gray-900" {...props} />
  ),
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 pl-3 pr-2 py-1 my-2 text-sm italic text-gray-700"
      style={{
        borderColor: theme.accentFrom,
        backgroundColor: `${theme.accentFrom}10`,
      }}
      {...props}
    />
  ),
  a: ({ node, ...props }) => (
    <a
      className="underline hover:opacity-80"
      style={{ color: theme.accentTo }}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[12px] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={`block bg-gray-900 text-gray-100 rounded-md p-2.5 text-[12px] font-mono overflow-x-auto ${className || ''}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, ...props }) => <pre className="my-2" {...props} />,
  hr: () => <hr className="my-2 border-gray-200" />,
  table: ({ node, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
  th: ({ node, ...props }) => (
    <th className="border border-gray-200 px-2 py-1 text-left font-semibold" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-gray-200 px-2 py-1 align-top" {...props} />
  ),
});

/**
 * Floating chat widget (popup, bottom-right).
 *
 * Visual modes:
 *   - Closed    : only the circular trigger button is visible.
 *   - Open      : card popup ~380x560 anchored bottom-right.
 *   - Expanded  : larger card (up to 560x780 / 80vh) for long answers & charts.
 *
 * The widget is rendered globally from Layout.jsx so it's available on every
 * page. It reads `chatOpen` from Redux (toggled by the "Ask Data" header
 * button or the floating bubble itself).
 */

// Greeting text depends on whether a dataset is loaded; keep the copy the
// same pre-upload and swap in a sector-aware "ready" line once data is in.
const buildGreeting = (fileId, sectorLabel) => ({
  id: 1,
  sender: 'system',
  content: fileId
    ? `Your ${sectorLabel ? `${sectorLabel.toLowerCase()} ` : ''}dataset is loaded and ready. Ask me anything — totals, trends, breakdowns, correlations.`
    : "Hi! I'm your AI Data Assistant. Upload a CSV and ask me anything about it — I'll crunch the numbers and show insights.",
  timestamp: new Date(),
});

const ChatPanel = () => {
  const dispatch = useDispatch();
  const { chatOpen } = useSelector((state) => state.ui);
  const { data, fileId, domain } = useSelector((state) => state.data);
  const theme = getTheme(domain);
  const mdComponents = useMemo(() => buildMarkdownComponents(theme), [theme]);

  const [messages, setMessages] = useState(() => [buildGreeting(fileId, theme.label)]);

  // When the dataset is (un)loaded or the sector changes, refresh the greeting —
  // but only if the conversation hasn't started yet, so we don't wipe history.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].id !== 1) return prev;
      return [buildGreeting(fileId, theme.label)];
    });
  }, [fileId, theme.label]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ------------------------------------------------------------------
  // Behaviour: autoscroll, focus on open, Escape to close
  // ------------------------------------------------------------------

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      // Give the animation a beat to settle before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 180);
      return () => clearTimeout(t);
    }
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isExpanded) setIsExpanded(false);
        else dispatch(toggleChat());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen, isExpanded, dispatch]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!fileId || !data || data.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          content:
            'Please upload and analyze a CSV file first — then I can answer questions about it.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, message: query }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to get a response from the server');
      }
      const payload = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'system',
          content: payload.response,
          statistics: payload.statistics || {},
          visualization: payload.visualization,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'system',
          content: `Sorry, I couldn't process that. ${error.message || 'Please try again.'}`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = useCallback(() => {
    setMessages([buildGreeting(fileId, theme.label)]);
  }, [fileId, theme.label]);

  const getSuggestedQuestions = () => {
    if (!data || data.length === 0) {
      return [
        'How does this work?',
        'What can you analyze?',
      ];
    }
    const suggestions = ['Summarize the key insights from this data'];
    const sample = data[0] || {};
    const cols = Object.keys(sample).map((k) => k.toLowerCase());

    if (domain === 'Retail') {
      if (cols.some((c) => c.includes('total') || c.includes('amount'))) {
        suggestions.push("What's the total revenue?");
      }
      if (cols.some((c) => c.includes('category') || c.includes('product'))) {
        suggestions.push('Which category leads by revenue?');
      }
      if (cols.some((c) => c.includes('date') || c.includes('time'))) {
        suggestions.push('Show me the sales trend over time');
      }
    } else if (domain === 'HR') {
      if (cols.some((c) => c.includes('salary'))) {
        suggestions.push("What's the average salary by department?");
      }
      if (cols.some((c) => c.includes('performance') || c.includes('rating'))) {
        suggestions.push('Are performance ratings correlated with tenure?');
      }
    } else if (domain === 'Finance') {
      suggestions.push('Which category has the highest total amount?');
      suggestions.push('Show me transaction trends over time');
    } else if (domain === 'Healthcare') {
      suggestions.push('What are the most common diagnoses?');
      suggestions.push('Is age correlated with length of stay?');
    } else {
      suggestions.push('What patterns do you see in this dataset?');
      suggestions.push('Which columns have the strongest correlation?');
    }
    return suggestions.slice(0, 4);
  };

  // ------------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------------

  const renderStatistics = (statistics) => {
    if (!statistics || Object.keys(statistics).length === 0) return null;
    return (
      <div className="mt-2 p-2 bg-white/70 border border-gray-200 rounded-md text-xs">
        <p className="font-semibold mb-1 text-gray-700">Key metrics</p>
        <ul className="space-y-1">
          {Object.entries(statistics).map(([key, value]) => (
            <li key={key} className="flex justify-between gap-2">
              <span className="text-gray-500 truncate">{key}:</span>
              <span className="font-medium text-gray-800 text-right">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderVisualization = (visualization) => {
    if (!visualization?.data || visualization.data.length === 0) return null;

    if (visualization.type === 'line') {
      const lineColor = theme.chartPalette[0];
      // Prefer the declared axes; fall back to legacy keys from older payloads.
      const xKey = visualization.xAxis || 'month';
      const yKey = visualization.yAxis || 'sum';
      const points = visualization.data
        .map((row) => ({ x: row[xKey], y: Number(row[yKey]) }))
        .filter((p) => !isNaN(p.y));
      if (points.length === 0) return null;

      const maxValue = Math.max(...points.map((p) => p.y));
      const minValue = Math.min(...points.map((p) => p.y));
      const valueRange = maxValue - minValue;
      const positionX = (index) =>
        points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      // Flat series → center the line vertically; otherwise map into 10–90% band.
      const positionY = (v) =>
        valueRange === 0 ? 50 : 100 - (((v - minValue) / valueRange) * 80 + 10);

      const tickIndices =
        points.length === 1
          ? [0]
          : [0, Math.floor(points.length / 2), points.length - 1];

      return (
        <div className="mt-3 p-2 bg-white border border-gray-200 rounded-md">
          <p className="text-xs text-gray-500 mb-1 truncate">{visualization.title}</p>
          <div className="h-32 bg-gray-50 rounded relative">
            {points.map((point, index) => {
              const x = positionX(index);
              const y = positionY(point.y);
              return (
                <div
                  key={index}
                  className="absolute h-2 w-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%`, backgroundColor: lineColor }}
                  title={`${point.x}: ${point.y}`}
                />
              );
            })}
            {points.length > 1 && (
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <polyline
                  points={points
                    .map((point, index) => `${positionX(index)}%,${positionY(point.y)}%`)
                    .join(' ')}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="1.5"
                />
              </svg>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-500 px-1">
              {tickIndices.map((index) => (
                <span key={index}>{points[index]?.x ?? ''}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (visualization.type === 'bar') {
      const yKey = visualization.yAxis;
      const xKey = visualization.xAxis;
      const rows = visualization.data.slice(0, 10);
      const values = rows.map((d) => Number(d[yKey]) || 0);
      const maxValue = Math.max(...values, 0);
      // h-32 = 128px container. Reserve ~28px for the label + padding.
      // Remaining ~100px is the drawable bar area.
      const BAR_AREA_PX = 100;
      const barFill = gradientCss(theme);
      return (
        <div className="mt-3 p-2 bg-white border border-gray-200 rounded-md">
          <p className="text-xs text-gray-500 mb-1 truncate">{visualization.title}</p>
          <div className="h-32 bg-gray-50 rounded flex items-end justify-around gap-1 px-2 pt-4 pb-1">
            {rows.map((item, index) => {
              const v = Number(item[yKey]) || 0;
              const heightPx =
                maxValue > 0 && v > 0
                  ? Math.max(2, Math.round((v / maxValue) * BAR_AREA_PX))
                  : 0;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-end min-w-0 flex-1"
                  style={{ height: `${BAR_AREA_PX + 20}px` }}
                >
                  <div
                    className="w-4 rounded-t transition-all duration-500"
                    style={{ height: `${heightPx}px`, background: barFill }}
                    title={`${item[xKey]}: ${v}`}
                  />
                  <span
                    className="text-[10px] text-gray-500 mt-1 truncate"
                    style={{ maxWidth: '44px' }}
                  >
                    {item[xKey]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  // Floating trigger (always visible) — tinted to the active sector theme
  const trigger = (
    <button
      type="button"
      aria-label={chatOpen ? 'Close data assistant' : 'Open data assistant'}
      aria-expanded={chatOpen}
      onClick={() => dispatch(toggleChat())}
      style={chatOpen ? undefined : { background: gradientCss(theme) }}
      className={`fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/30 text-white ${
        chatOpen
          ? 'bg-gray-700 hover:bg-gray-800 scale-90'
          : 'hover:scale-105'
      }`}
    >
      {chatOpen ? <FiX className="w-6 h-6" /> : <FiMessageSquare className="w-6 h-6" />}
      {/* Dot indicator when data is loaded and chat is closed */}
      {!chatOpen && fileId && (
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
      )}
    </button>
  );

  if (!chatOpen) return trigger;

  // Popup card sizing
  const cardSize = isExpanded
    ? 'w-[min(560px,calc(100vw-2rem))] h-[min(780px,80vh)]'
    : 'w-[min(380px,calc(100vw-2rem))] h-[min(560px,80vh)]';

  return (
    <>
      {trigger}

      <div
        role="dialog"
        aria-label="Data assistant chat"
        className={`fixed bottom-24 right-6 z-50 ${cardSize} bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-[fadeIn_.2s_ease-out]`}
        style={{ animation: 'popupIn .22s ease-out' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 text-white"
          style={{ background: gradientCss(theme) }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <FiZap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-semibold text-sm leading-tight truncate ${theme.fontTracking}`}>
                Data Assistant
              </h3>
              <p className="text-[11px] opacity-90 flex items-center gap-1 leading-tight">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    fileId ? 'bg-emerald-300' : 'bg-amber-300'
                  }`}
                />
                {fileId ? `${domain || theme.label} · Ready` : 'Waiting for data'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={isExpanded ? 'Shrink' : 'Expand'}
              title={isExpanded ? 'Shrink' : 'Expand'}
              onClick={() => setIsExpanded((v) => !v)}
              className="p-1.5 rounded hover:bg-white/15 transition"
            >
              {isExpanded ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              aria-label="Clear conversation"
              title="Clear conversation"
              onClick={handleClearConversation}
              className="p-1.5 rounded hover:bg-white/15 transition"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Close"
              title="Close (Esc)"
              onClick={() => dispatch(toggleChat())}
              className="p-1.5 rounded hover:bg-white/15 transition"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${
                message.sender === 'user'
                  ? 'ml-auto text-white'
                  : message.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-white text-gray-800 border border-gray-200'
              } p-3 rounded-xl max-w-[88%] shadow-sm`}
              style={message.sender === 'user' ? { background: gradientCss(theme) } : undefined}
            >
              {message.sender === 'user' ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              ) : (
                <div className="markdown-body text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={mdComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {message.statistics && renderStatistics(message.statistics)}
              {message.visualization && renderVisualization(message.visualization)}
              <p className="text-[10px] opacity-60 mt-1.5">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
              <span>Analyzing…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-3 pt-2 border-t border-gray-200 bg-white">
            <p className="text-[11px] text-gray-500 mb-1.5">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {getSuggestedQuestions().map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="text-[11px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full transition hover:text-white"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = gradientCss(theme);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={
                isLoading
                  ? 'Processing…'
                  : fileId
                  ? 'Ask about your data…'
                  : 'Upload a CSV first…'
              }
              className="flex-1 border border-gray-300 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
                isLoading || !input.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
              }`}
              style={
                isLoading || !input.trim()
                  ? undefined
                  : { background: gradientCss(theme) }
              }
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Inline keyframes (no tailwind plugin needed) */}
        <style>{`
          @keyframes popupIn {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
          }
        `}</style>
      </div>
    </>
  );
};

export default ChatPanel;
