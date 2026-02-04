'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useSession } from '@/components/providers/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArthurInput } from '@/app/(features)/brain/components/ArthurInput';

interface ChatInterfaceProps {
  viewState: 'overview' | 'chat';
  onInteraction?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ viewState }) => {
  const { messages, isLoading } = useSession();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-10 space-y-8 scrollbar-hide pb-36">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full opacity-30 select-none"
            >
              <Sparkles size={28} className="mb-4 text-[#4A453E]" />
              <p className="font-serif text-2xl text-[#4A453E]">Arthur is listening.</p>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex w-full group',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/40 border border-white/50 flex items-center justify-center mr-4 mt-1 shrink-0 shadow-sm text-xs font-serif font-bold text-[#4A453E]">
                  A
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] p-5 rounded-2xl text-[15px] leading-relaxed font-sans shadow-sm relative overflow-hidden border border-transparent',
                  msg.role === 'user'
                    ? 'bg-[#4A453E] text-[#F5F2EB] border-[#4A453E]/20'
                    : 'bg-white/40 backdrop-blur-md text-[#2C2824] border-white/40'
                )}
              >
                <p className="whitespace-pre-wrap font-normal">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full pl-12">
              <div className="flex gap-1.5 p-4 rounded-xl bg-white/40 border border-white/40 backdrop-blur-md">
                <span className="w-1.5 h-1.5 bg-[#4A453E]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#4A453E]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#4A453E]/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {viewState === 'chat' && (
        <div className="absolute bottom-0 left-0 right-0 pb-6 z-40">
          <div className="max-w-2xl mx-auto">
            <ArthurInput
              input={input}
              setInput={setInput}
              handleInputChange={handleInputChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};