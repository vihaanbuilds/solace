import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import { CrisisBanner } from './CrisisBanner';
import { AiLoadingBanner } from './AiLoadingBanner';
import { ModelPicker } from './ModelPicker';
import { CursiveReveal } from './CursiveReveal';
import { TypewriterGreeting } from './TypewriterGreeting';
import { PaperclipIcon, CloseIcon } from './icons';
import { getResponse, ConversationTurn } from '../lib/responses/responseEngine';
import { Mode } from '../lib/responses/templates';
import { processImageFile, MAX_IMAGES } from '../lib/ai/imageUpload';
import {
  StoredMessage,
  ChatTier,
  createId,
  loadMode,
  saveMode,
  loadUserProfile,
  getFirstName,
  calculateAge,
  loadAiTier,
} from '../lib/storage';

interface ChatWindowProps {
  messages: StoredMessage[];
  onMessagesChange: (messages: StoredMessage[]) => void;
}

export function ChatWindow({ messages, onMessagesChange }: ChatWindowProps) {
  const [mode, setMode] = useState<Mode>(() => (loadMode() as Mode) || 'comforter');
  const [input, setInput] = useState('');
  const [pendingBotText, setPendingBotText] = useState<string | null>(null);
  const [userProfile] = useState(() => loadUserProfile());
  const [tier, setTier] = useState<ChatTier>(() => loadAiTier() ?? 'bud');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  // Images are shown for the current session only, keyed by message id —
  // they're deliberately not written into StoredMessage/localStorage, since
  // even resized photos could quickly eat through the origin's storage
  // quota and break chat persistence entirely for every conversation, not
  // just the ones with images.
  const [sessionImages, setSessionImages] = useState<Record<string, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const age = userProfile ? calculateAge(userProfile.dateOfBirth) : null;
  const firstName = userProfile ? getFirstName(userProfile.fullName) : null;

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingBotText]);

  const lastBotMessage = [...messages].reverse().find((m) => m.sender === 'bot');
  const showCrisisBanner = lastBotMessage?.isCrisis === true;

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_IMAGES - pendingImages.length;
    const files = Array.from(fileList).slice(0, remaining);
    setImageError(null);

    for (const file of files) {
      try {
        const dataUrl = await processImageFile(file);
        setPendingImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, dataUrl]));
      } catch (err) {
        setImageError(err instanceof Error ? err.message : 'Could not process that image.');
      }
    }
  }

  function removePendingImage(index: number) {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    const text = input.trim();
    const images = pendingImages;
    if ((!text && images.length === 0) || pendingBotText !== null) return;
    setInput('');
    setPendingImages([]);
    setImageError(null);

    const userMessage: StoredMessage = {
      id: createId(),
      sender: 'user',
      text: text || 'Shared an image',
      timestamp: Date.now(),
    };
    if (images.length > 0) {
      setSessionImages((prev) => ({ ...prev, [userMessage.id]: images }));
    }
    const messagesWithUser = [...messages, userMessage];
    onMessagesChange(messagesWithUser);

    const history: ConversationTurn[] = messages.map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));

    setPendingBotText('');

    const reply = await getResponse(
      text,
      mode,
      history,
      (partial) => {
        setPendingBotText(partial);
      },
      age,
      images
    );

    const botMessage: StoredMessage = {
      id: createId(),
      sender: 'bot',
      text: reply.text,
      isCrisis: reply.isCrisis,
      timestamp: Date.now(),
    };

    setPendingBotText(null);
    onMessagesChange([...messagesWithUser, botMessage]);
  }

  function handleStartFresh() {
    if (window.confirm('This will clear your saved conversation. Continue?')) {
      onMessagesChange([]);
    }
  }

  return (
    <div className="chat-window">
      <ModeSelector mode={mode} onChange={setMode} />
      <AiLoadingBanner />
      {showCrisisBanner && <CrisisBanner />}
      <div className="message-list">
        {messages.length === 0 && pendingBotText === null && (
          <div className="chat-empty-state">
            <CursiveReveal variant="solace" className="cursive-reveal-chat-hero" />
            <TypewriterGreeting name={firstName} className="chat-hero-greeting" />
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} images={sessionImages[m.id]} />
        ))}
        {pendingBotText !== null && (
          <MessageBubble
            message={{ id: 'pending', sender: 'bot', text: pendingBotText, timestamp: Date.now() }}
            pending
          />
        )}
        <div ref={endRef} />
      </div>
      {tier === 'canopy' && pendingImages.length > 0 && (
        <div className="chat-image-preview-row">
          {pendingImages.map((src, i) => (
            <div key={i} className="chat-image-preview">
              <img src={src} alt="" />
              <button type="button" onClick={() => removePendingImage(i)} aria-label="Remove image">
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}
      {tier === 'canopy' && imageError && <p className="chat-image-error">{imageError}</p>}
      <div className="chat-input-row glass">
        {tier === 'canopy' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={pendingImages.length >= MAX_IMAGES || pendingBotText !== null}
              aria-label="Attach an image"
              title={`Attach up to ${MAX_IMAGES} images`}
            >
              <PaperclipIcon />
            </button>
          </>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type how you're feeling..."
          aria-label="Message input"
          disabled={pendingBotText !== null}
        />
        <ModelPicker onTierChange={setTier} />
        <button onClick={handleSend} disabled={pendingBotText !== null}>
          Send
        </button>
        <button onClick={handleStartFresh} className="start-fresh-btn">
          Start fresh
        </button>
      </div>
    </div>
  );
}
