import React, { useState, useRef } from 'react';
import { ArrowUp, Paperclip, Loader2, X } from 'lucide-react';
import ArthurVoice from '@/app/(features)/brain/components/ArthurVoice';
import { useSession } from '@/components/providers/SessionContext';

interface ArthurInputProps {
  input: string;
  setInput: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onInteraction?: () => void;
}

export const ArthurInput: React.FC<ArthurInputProps> = ({
  input,
  setInput,
  handleInputChange,
  isLoading,
  onInteraction,
}) => {
  const { sendMessage } = useSession();
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileInputId = "arthur-file-upload";

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    // Send to Brain
    onInteraction?.();
    sendMessage({ text: input, file: attachedFile || undefined });

    // Clear UI & Input
    setInput('');
    clearAttachment();
  };

  return (
    <form
      onSubmit={onFormSubmit}
      className="relative w-full group"
    >
      {/* HIDDEN INPUT WITH REF */}
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        onChange={onFileChange}
        className="sr-only"
      />

      <div className="relative flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/60 p-2 pl-4 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group-hover:bg-white/80">
        <label
          htmlFor={fileInputId}
          className={`p-2.5 rounded-full transition-colors cursor-pointer ${attachedFile ? 'text-[#4A453E] bg-[#EAE8E3]' : 'text-[#8B8276] hover:bg-[#EAE8E3] hover:text-[#5C554B]'}`}
        >
          <Paperclip size={20} strokeWidth={2} />
        </label>

        <div className="flex-1 flex flex-col justify-center min-w-0">
          {attachedFile && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-[#4A453E] text-[#EAE8E3] px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[200px] truncate">
                {attachedFile.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    clearAttachment();
                  }}
                  className="hover:text-white"
                >
                  <X size={10} />
                </button>
              </span>
            </div>
          )}
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={attachedFile ? 'Add a note...' : 'Ask Arthur...'}
            disabled={isLoading}
            className="w-full bg-transparent border-none outline-none text-[#2C2824] placeholder-[#A8A29D] font-sans text-lg h-full py-2 disabled:opacity-50"
            autoFocus
          />
        </div>

        <div className="pr-1">
          {isLoading ? (
            <div className="p-3 rounded-full bg-[#EAE8E3] text-[#8B8276] flex items-center justify-center">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (input.trim() || attachedFile) ? (
            <button
              type="submit"
              className="p-3 rounded-full bg-[#4A453E] text-[#EAE8E3] shadow-md hover:bg-[#2C2824] hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </button>
          ) : (
            <ArthurVoice className="" />
          )}
        </div>
      </div>
    </form>
  );
};
