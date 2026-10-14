import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minus, Maximize2, Image as ImageIcon, Loader2, User, Bot, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateChatResponse } from '../services/ragService.ts';
import { useLocation } from '../../../shared/hooks/useLocation.ts';
import { agricultureService } from '../services/aiService.ts';
import { ChatSkeleton, ImageGenerationSkeleton } from '../../../shared/components/skeletons/index.ts';
import botImg from '../../../../assets/bot.png';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  image?: string;
  isStreaming?: boolean;
  isImageAnalyzing?: boolean;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: "Hello! I'm your Smart Agriculture Assistant. How can I help you today? You can ask about crops, diseases, weather, or even upload a photo of a plant for diagnosis.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const { locationName } = useLocation();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isImageProcessing]);

  /**
   * ChatGPT-style word-by-word typewriter streaming
   */
  const streamWords = async (fullText: string, messageId: string) => {
    const tokens = fullText.split(/(\s+)/);
    let accumulated = '';
    for (let i = 0; i < tokens.length; i++) {
      accumulated += tokens[i];
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: accumulated, isStreaming: i < tokens.length - 1 } : m));
      scrollToBottom();
      if (tokens[i].trim().length > 0) {
        await new Promise(r => setTimeout(r, 16));
      }
    }
  };

  const handleSend = async (text: string = input, imageFile?: File) => {
    if (!text.trim() && !imageFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      image: imageFile ? URL.createObjectURL(imageFile) : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (imageFile) {
      setIsImageProcessing(true);
    } else {
      setIsLoading(true);
    }

    try {
      let botResponse = "";
      
      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(imageFile);
        });
        const base64Image = await base64Promise;
        const result = await agricultureService.detectDisease(base64Image);
        
        if (result.result === "Low Confidence Detection") {
          botResponse = `I've analyzed the image, but I'm not very certain about the results.\n\n**Observation:** ${result.result}\n**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n\n**Suggestions:**\n${result.recommendations.map(r => `- ${r}`).join('\n')}`;
        } else {
          botResponse = `I've analyzed the image.\n\n**Detection:** ${result.result}\n**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n\n**Details & Recommendations:**\n${result.recommendations.join('\n')}`;
        }
      } else {
        const history = messages.slice(-10).map(m => ({ 
          role: m.role === 'bot' ? 'model' : 'user', 
          content: m.content 
        }));
        const fullQuery = locationName ? `${text} (User location: ${locationName})` : text;
        botResponse = await generateChatResponse(fullQuery, history);
      }

      setIsLoading(false);
      setIsImageProcessing(false);

      const botMsgId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMsgId,
        role: 'bot',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, botMessage]);
      await streamWords(botResponse || "I'm sorry, I encountered an error while processing your request.", botMsgId);
    } catch (error: any) {
      console.error("Chat error:", error);
      setIsLoading(false);
      setIsImageProcessing(false);
      
      let errorMessage = "Sorry, I'm having trouble connecting to the server. Please try again later.";
      
      if (error.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "I'm receiving too many requests right now. Please wait a moment and try again.";
      } else if (error.message?.includes("max tokens limit")) {
        errorMessage = "The response was too long for me to process. Could you try asking a more specific question?";
      }

      const errId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: errId,
        role: 'bot',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }]);
      await streamWords(errorMessage, errId);
    } finally {
      setIsLoading(false);
      setIsImageProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSend("Analyzing this plant image...", file);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '500px',
              width: '380px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-stone-900 border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4"
          >
            {/* Header */}
            <div className="p-4 bg-brand-green/10 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src={botImg} alt="Bot" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Farmer Assistant</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-stone-700">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] flex space-x-2",
                        msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden",
                          msg.role === 'user' ? "bg-brand-green/20" : "bg-transparent"
                        )}>
                          {msg.role === 'user' ? (
                            <User size={14} className="text-brand-green" />
                          ) : (
                            <img src={botImg} alt="Bot" className="w-6 h-6 object-contain" />
                          )}
                        </div>
                        <div className={cn(
                          "p-3 rounded-2xl text-sm",
                          msg.role === 'user' 
                            ? "bg-brand-green text-white rounded-tr-none" 
                            : "bg-stone-800/50 text-stone-200 border border-dark-border rounded-tl-none"
                        )}>
                          {msg.image && (
                            <img src={msg.image} alt="Uploaded" className="max-w-full rounded-lg mb-2 border border-white/10" referrerPolicy="no-referrer" />
                          )}
                          <div className="prose prose-invert prose-sm max-w-none inline">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            {msg.isStreaming && (
                              <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle rounded-xs" />
                            )}
                          </div>
                          <div className={cn(
                            "text-[10px] mt-1 opacity-50",
                            msg.role === 'user' ? "text-right" : "text-left"
                          )}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* ChatGPT-style Image Generation & Analysis Skeleton */}
                  {isImageProcessing && (
                    <div className="py-2 max-w-[85%]">
                      <ImageGenerationSkeleton 
                        aspectRatio="video" 
                        label="Analyzing leaf lesions with ChatGPT Vision..." 
                      />
                    </div>
                  )}

                  {isLoading && (
                    <div className="py-1">
                      <ChatSkeleton />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-dark-border bg-stone-900/50">
                  {locationName && (
                    <div className="flex items-center space-x-1 mb-2 px-1">
                      <MapPin size={10} className="text-brand-green" />
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider">Location: {locationName}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      title="Upload plant image"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything about farming..."
                        className="w-full bg-stone-800 border border-dark-border rounded-xl py-2 px-4 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-green/50 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="p-2 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-transparent border-0 p-0 cursor-pointer outline-none focus:outline-none select-none transition-transform"
        title="AI Assistant"
      >
        {isOpen ? (
          <div className="w-14 h-14 rounded-full bg-stone-800 text-white flex items-center justify-center shadow-2xl border border-white/10 hover:bg-stone-700 transition-colors">
            <X size={26} />
          </div>
        ) : (
          <div className="relative group">
            <img 
              src={botImg} 
              alt="AI Bot" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] filter group-hover:brightness-110 transition-all duration-300" 
            />
          </div>
        )}
      </motion.button>
    </div>
  );
};
