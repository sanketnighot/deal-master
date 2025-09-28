'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: 'player' | 'banker';
  message: string;
  timestamp: Date;
  offer?: number;
}

interface BankerChatProps {
  initialOffer: number;
  lastBurnedCase?: { idx: number; value_cents: number } | null;
  onAccept: (offer: number) => void;
  onReject: () => void;
  loading?: boolean;
}

// Enhanced banker personality with more human-like responses
const BANKER_PERSONALITY = {
  name: "Mr. Goldsworth",
  mood: "professional", // professional, frustrated, encouraging, defensive
  patience: 5, // decreases with each negotiation
  maxNegotiations: 8,
  
  responses: {
    initial: [
      "Hello! I'm Mr. Goldsworth, your banker for today. I've analyzed your case and the remaining boxes very carefully.",
      "Good day! I've been in this business for over 20 years, and I believe I've made you a very fair offer.",
      "Welcome! I've calculated the statistical probability of your case value, and I'm prepared to make you an offer."
    ],
    
    higher: [
      "I understand your position, but I've already factored in the risk. My offer is based on solid mathematics.",
      "You're a shrewd negotiator, but I can't ignore the numbers. This offer reflects the true value.",
      "I appreciate your persistence, but I've been doing this long enough to know when to draw the line.",
      "Look, I've got shareholders to answer to. I can't just throw money around based on emotions.",
      "I respect your confidence, but I've calculated this down to the penny. My offer is final."
    ],
    
    lower: [
      "Ha! You're testing my patience now. I'm not running a charity here!",
      "That's not how negotiations work, my friend. I'm already taking a risk with this offer.",
      "You're asking me to give away money? I've got a reputation to maintain!",
      "I'm a businessman, not a philanthropist. This offer is already generous given the circumstances.",
      "Come on now, be reasonable. I'm not going to lose money just to make you happy."
    ],
    
    negotiate: [
      "I like your style, but I've been doing this for decades. I know what's fair.",
      "You remind me of myself when I was starting out. Persistent, but I can't budge on this.",
      "I appreciate good negotiation skills, but my offer is based on cold, hard facts.",
      "You're making this interesting, but I've got a board meeting tomorrow. My offer stands.",
      "I admire your determination, but I've already factored in every possible scenario."
    ],
    
    compliment: [
      "Well, thank you for that. I do try to be fair in all my dealings.",
      "That's very kind of you to say. Experience has taught me the value of honesty.",
      "I appreciate that. I've built my reputation on being straightforward with people.",
      "You're too kind. I just believe in giving people what they deserve.",
      "Thank you. I've learned that fairness is the foundation of good business."
    ],
    
    pressure: [
      "Look, I've got other games to manage today. Time is money, you know?",
      "I'm a busy man with other clients waiting. What's it going to be?",
      "I've given you my best offer. Don't make me regret being generous.",
      "I don't have all day for this back and forth. Make your decision.",
      "I'm starting to think you're wasting my time. This is my final offer."
    ],
    
    frustrated: [
      "This is getting ridiculous! I've made my position clear multiple times.",
      "I'm beginning to question your business sense. My offer is more than fair.",
      "You're testing my patience, and I don't like it. Take it or leave it!",
      "I've been patient, but this is going nowhere. My offer stands, period.",
      "I'm done with this charade. Accept my offer or continue playing the game."
    ],
    
    final: [
      "I've reached my limit with this negotiation. This is absolutely my final offer.",
      "I'm a patient man, but even I have my limits. Take it or leave it.",
      "I've given you every opportunity to accept a fair deal. This is it.",
      "I'm calling an end to this negotiation. My offer is final.",
      "I've been more than fair. This conversation is over unless you accept."
    ]
  }
};

// Dynamic offer adjustment based on negotiation tactics
const calculateOfferAdjustment = (originalOffer: number, negotiationCount: number, playerTactics: string[]): number => {
  let adjustment = 0;
  const baseAdjustment = originalOffer * 0.02; // 2% base adjustment
  
  // Positive adjustments for good tactics
  if (playerTactics.includes('compliment')) adjustment += baseAdjustment * 0.5;
  if (playerTactics.includes('reasonable')) adjustment += baseAdjustment * 0.3;
  if (playerTactics.includes('business_sense')) adjustment += baseAdjustment * 0.4;
  
  // Negative adjustments for poor tactics
  if (playerTactics.includes('insult')) adjustment -= baseAdjustment * 1.5;
  if (playerTactics.includes('unreasonable')) adjustment -= baseAdjustment * 0.8;
  if (playerTactics.includes('pressure')) adjustment -= baseAdjustment * 0.6;
  
  // Diminishing returns with more negotiations
  const diminishingFactor = Math.max(0.1, 1 - (negotiationCount * 0.15));
  
  return Math.round(originalOffer + (adjustment * diminishingFactor));
};

export function BankerChat({
  initialOffer,
  lastBurnedCase,
  onAccept,
  onReject,
  loading = false
}: BankerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialMessage = BANKER_PERSONALITY.responses.initial[
      Math.floor(Math.random() * BANKER_PERSONALITY.responses.initial.length)
    ];
    return [
      {
        id: '1',
        sender: 'banker',
        message: `${initialMessage} I'm prepared to offer you ${formatCurrency(initialOffer)} to walk away right now. What do you think?`,
        timestamp: new Date(),
        offer: initialOffer
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [currentOffer, setCurrentOffer] = useState(initialOffer);
  const [negotiationCount, setNegotiationCount] = useState(0);
  const [playerTactics, setPlayerTactics] = useState<string[]>([]);
  const [bankerMood, setBankerMood] = useState('professional');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzePlayerMessage = (message: string): { responseType: string; tactics: string[] } => {
    const lowerMessage = message.toLowerCase();
    const tactics: string[] = [];
    let responseType = 'negotiate';

    // Analyze message content for tactics
    if (lowerMessage.includes('higher') || lowerMessage.includes('more') || lowerMessage.includes('increase')) {
      responseType = 'higher';
    } else if (lowerMessage.includes('lower') || lowerMessage.includes('less') || lowerMessage.includes('decrease')) {
      responseType = 'lower';
    } else if (lowerMessage.includes('stupid') || lowerMessage.includes('idiot') || lowerMessage.includes('bad') || lowerMessage.includes('terrible')) {
      responseType = 'frustrated';
      tactics.push('insult');
    } else if (lowerMessage.includes('good') || lowerMessage.includes('fair') || lowerMessage.includes('reasonable') || lowerMessage.includes('thank')) {
      responseType = 'compliment';
      tactics.push('compliment');
    } else if (lowerMessage.includes('hurry') || lowerMessage.includes('quick') || lowerMessage.includes('fast')) {
      responseType = 'pressure';
      tactics.push('pressure');
    } else if (lowerMessage.includes('business') || lowerMessage.includes('professional') || lowerMessage.includes('respect')) {
      tactics.push('business_sense');
    } else if (lowerMessage.includes('please') || lowerMessage.includes('understand') || lowerMessage.includes('consider')) {
      tactics.push('reasonable');
    }

    // Check for unreasonable demands
    if (lowerMessage.includes('double') || lowerMessage.includes('triple') || lowerMessage.includes('10x')) {
      tactics.push('unreasonable');
    }

    return { responseType, tactics };
  };

  const getBankerResponse = (playerMessage: string, newTactics: string[]): { message: string; newOffer?: number; moodChange?: string } => {
    const { responseType } = analyzePlayerMessage(playerMessage);
    const updatedTactics = [...playerTactics, ...newTactics];
    let currentMood = bankerMood;

    // Determine mood based on negotiation count and tactics
    if (negotiationCount >= 6) {
      currentMood = 'frustrated';
    } else if (negotiationCount >= 4) {
      currentMood = 'pressure';
    } else if (updatedTactics.includes('insult')) {
      currentMood = 'frustrated';
    } else if (updatedTactics.includes('compliment')) {
      currentMood = 'professional';
    }

    // Get appropriate responses based on mood and negotiation count
    let responseCategory = responseType;
    if (negotiationCount >= BANKER_PERSONALITY.maxNegotiations - 2) {
      responseCategory = 'final';
    } else if (currentMood === 'frustrated') {
      responseCategory = 'frustrated';
    } else if (negotiationCount >= 4 && currentMood !== 'professional') {
      responseCategory = 'pressure';
    }

    const responses = BANKER_PERSONALITY.responses[responseCategory as keyof typeof BANKER_PERSONALITY.responses] || BANKER_PERSONALITY.responses.negotiate;
    const message = responses[Math.floor(Math.random() * responses.length)];

    // Calculate potential offer adjustment
    let newOffer = currentOffer;
    if (negotiationCount < BANKER_PERSONALITY.maxNegotiations && responseCategory !== 'final' && responseCategory !== 'frustrated') {
      newOffer = calculateOfferAdjustment(initialOffer, negotiationCount, updatedTactics);
      // Ensure offer doesn't go below 80% of original or above 120%
      newOffer = Math.max(
        Math.min(newOffer, Math.round(initialOffer * 1.2)),
        Math.round(initialOffer * 0.8)
      );
    }

    return {
      message,
      newOffer: newOffer !== currentOffer ? newOffer : undefined,
      moodChange: currentMood !== bankerMood ? currentMood : undefined
    };
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || loading) return;

    const messageText = inputMessage.trim();
    const { tactics } = analyzePlayerMessage(messageText);

    const playerMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'player',
      message: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setNegotiationCount(prev => prev + 1);
    setPlayerTactics(prev => [...prev, ...tactics]);

    // Banker responds after a short delay with typing indicator
    setTimeout(() => {
      const response = getBankerResponse(messageText, tactics);
      
      // Update mood if changed
      if (response.moodChange) {
        setBankerMood(response.moodChange);
      }

      // Update offer if changed
      if (response.newOffer) {
        setCurrentOffer(response.newOffer);
      }

      const bankerMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'banker',
        message: response.message,
        timestamp: new Date(),
        offer: response.newOffer || currentOffer
      };

      setMessages(prev => [...prev, bankerMessage]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickMessages = [
    "That's too low!",
    "Can you go higher?", 
    "I appreciate your professionalism",
    "Please reconsider",
    "I understand your position",
    "This seems reasonable",
    "I need to think about this"
  ];

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'professional': return '😊';
      case 'frustrated': return '😠';
      case 'pressure': return '⏰';
      default: return '😊';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'professional': return 'rgb(0, 255, 255)';
      case 'frustrated': return 'rgb(255, 0, 0)';
      case 'pressure': return 'rgb(255, 255, 0)';
      default: return 'rgb(0, 255, 255)';
    }
  };

  return (
    <Card
      variant="pixel"
      className="w-full max-w-2xl mx-auto animate-text-flicker relative z-10"
      style={{
        backgroundColor: "rgba(28, 0, 51, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardHeader
        className="text-center border-b-4"
        style={{ borderBottomColor: getMoodColor(bankerMood) }}
      >
        <CardTitle
          className="text-2xl font-pixel animate-text-flicker"
          style={{ color: getMoodColor(bankerMood) }}
        >
          🏦 NEGOTIATE WITH {BANKER_PERSONALITY.name} {getMoodEmoji(bankerMood)}
        </CardTitle>
        {lastBurnedCase && (
          <div
            className="text-sm font-pixel mt-2"
            style={{ color: "rgb(255, 0, 0)" }}
          >
            Last opened: Case {lastBurnedCase.idx + 1} - {formatCurrency(lastBurnedCase.value_cents)}
          </div>
        )}
        <div
          className="text-xs font-pixel mt-1"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          Mood: {bankerMood.toUpperCase()} | Negotiations: {negotiationCount}/{BANKER_PERSONALITY.maxNegotiations}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Chat Messages */}
        <div 
          className="h-80 overflow-y-auto border-4 p-4 mb-4 space-y-3"
          style={{ 
            borderColor: "rgb(0, 255, 255)",
            backgroundColor: "rgba(0, 0, 0, 0.3)"
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg font-pixel text-sm ${
                  msg.sender === 'player' 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-purple-600 text-white'
                }`}
                style={{
                  backgroundColor: msg.sender === 'player' 
                    ? 'rgba(0, 255, 255, 0.2)' 
                    : 'rgba(128, 0, 255, 0.2)',
                  border: `2px solid ${msg.sender === 'player' ? 'rgb(0, 255, 255)' : 'rgb(128, 0, 255)'}`
                }}
              >
                <div className="font-bold text-xs mb-1">
                  {msg.sender === 'player' ? 'YOU' : 'BANKER'}
                </div>
                <div>{msg.message}</div>
                {msg.offer && (
                  <div 
                    className="mt-2 text-lg font-bold"
                    style={{ color: "rgb(255, 255, 0)" }}
                  >
                    OFFER: {formatCurrency(msg.offer)}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Current Offer Display */}
        <div
          className="text-center mb-4 p-4 border-4"
          style={{
            borderColor: "rgb(255, 255, 0)",
            backgroundColor: "rgba(255, 255, 0, 0.1)",
          }}
        >
          <div
            className="text-sm font-pixel mb-2"
            style={{ color: "rgb(255, 255, 0)" }}
          >
            CURRENT OFFER
          </div>
          <div
            className="text-3xl font-pixel animate-text-flicker"
            style={{ color: "rgb(255, 255, 0)" }}
          >
            {formatCurrency(currentOffer)}
          </div>
        </div>

        {/* Quick Messages */}
        <div className="mb-4">
          <div
            className="text-sm font-pixel mb-2"
            style={{ color: "rgb(0, 255, 255)" }}
          >
            Quick Messages:
          </div>
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="font-pixel text-xs"
                onClick={() => setInputMessage(msg)}
                disabled={loading}
                style={{
                  borderColor: "rgb(0, 255, 255)",
                  color: "rgb(0, 255, 255)",
                  backgroundColor: "rgba(0, 255, 255, 0.1)"
                }}
              >
                {msg}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to the banker..."
            className="flex-1 p-3 font-pixel text-sm border-4 rounded"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderColor: "rgb(0, 255, 255)",
              color: "white",
              outline: "none"
            }}
            disabled={loading}
          />
          <Button
            variant="cyan"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="font-pixel"
          >
            SEND
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="cyan"
            size="lg"
            className="font-pixel"
            onClick={() => onAccept(currentOffer)}
            loading={loading}
          >
            ACCEPT {formatCurrency(currentOffer)}
          </Button>

          <Button
            variant="magenta"
            size="lg"
            className="font-pixel"
            onClick={onReject}
            disabled={loading}
          >
            NO DEAL
          </Button>
        </div>

        <div
          className="text-xs font-pixel mt-4 text-center space-y-1"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          <div>
            Negotiations: {negotiationCount}/{BANKER_PERSONALITY.maxNegotiations} | 
            {negotiationCount >= BANKER_PERSONALITY.maxNegotiations - 2 && (
              <span style={{ color: "rgb(255, 0, 0)" }}> BANKER IS GETTING IMPATIENT!</span>
            )}
          </div>
          <div>
            Original Offer: {formatCurrency(initialOffer)} | 
            Current: {formatCurrency(currentOffer)} | 
            Change: {currentOffer >= initialOffer ? '+' : ''}{Math.round(((currentOffer - initialOffer) / initialOffer) * 100)}%
          </div>
          <div style={{ color: "rgb(255, 255, 0)" }}>
            Remember: You can only accept or reject once!
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
