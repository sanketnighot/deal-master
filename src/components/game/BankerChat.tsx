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

// Banker responses based on negotiation attempts
const BANKER_RESPONSES = [
  {
    trigger: 'higher',
    responses: [
      "I'm afraid that's my best offer. Take it or leave it!",
      "You're pushing your luck. This is a fair deal.",
      "I can't go higher. The risk is too great for me.",
      "My offer stands. What will it be?",
    ]
  },
  {
    trigger: 'lower',
    responses: [
      "Ha! You think I'm giving away money? Not a chance!",
      "My offer is already generous. Take it or continue playing!",
      "I'm not a charity! This is my final offer.",
      "You're testing my patience. Accept or walk away!",
    ]
  },
  {
    trigger: 'negotiate',
    responses: [
      "I appreciate your business, but this is my final offer.",
      "I've calculated the risk carefully. This is fair.",
      "You're a tough negotiator, but I can't budge.",
      "Time is money. Accept my offer or continue the game!",
    ]
  },
  {
    trigger: 'insult',
    responses: [
      "That's no way to negotiate! My offer stands.",
      "Insults won't change my mind. Take it or leave it!",
      "I've been in this business for years. I know what's fair.",
      "Your attitude won't get you a better deal!",
    ]
  },
  {
    trigger: 'default',
    responses: [
      "I've analyzed the remaining cases. This is my offer.",
      "Based on the risk, I believe this is fair.",
      "I'm confident in my assessment. What do you say?",
      "This offer reflects the current situation perfectly.",
    ]
  }
];

export function BankerChat({
  initialOffer,
  lastBurnedCase,
  onAccept,
  onReject,
  loading = false
}: BankerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'banker',
      message: `Hello! I've analyzed your case and the remaining boxes. I'm prepared to offer you ${formatCurrency(initialOffer)} to walk away right now. What do you think?`,
      timestamp: new Date(),
      offer: initialOffer
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentOffer, setCurrentOffer] = useState(initialOffer);
  const [negotiationCount, setNegotiationCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBankerResponse = (playerMessage: string): string => {
    const lowerMessage = playerMessage.toLowerCase();
    let responseType = 'default';
    
    // Determine response type based on player message
    if (lowerMessage.includes('higher') || lowerMessage.includes('more') || lowerMessage.includes('increase')) {
      responseType = 'higher';
    } else if (lowerMessage.includes('lower') || lowerMessage.includes('less') || lowerMessage.includes('decrease')) {
      responseType = 'lower';
    } else if (lowerMessage.includes('negotiate') || lowerMessage.includes('deal') || lowerMessage.includes('compromise')) {
      responseType = 'negotiate';
    } else if (lowerMessage.includes('stupid') || lowerMessage.includes('idiot') || lowerMessage.includes('bad')) {
      responseType = 'insult';
    }

    const responseGroup = BANKER_RESPONSES.find(r => r.trigger === responseType) || BANKER_RESPONSES.find(r => r.trigger === 'default');
    const responses = responseGroup?.responses || BANKER_RESPONSES[0].responses;
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || loading) return;

    const playerMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'player',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setNegotiationCount(prev => prev + 1);

    // Banker responds after a short delay
    setTimeout(() => {
      const bankerResponse = getBankerResponse(playerMessage.message);
      const bankerMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'banker',
        message: bankerResponse,
        timestamp: new Date()
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
    "I want to negotiate",
    "What's your final offer?",
    "I need more time"
  ];

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
        style={{ borderBottomColor: "rgb(0, 255, 255)" }}
      >
        <CardTitle
          className="text-2xl font-pixel animate-text-flicker"
          style={{ color: "rgb(0, 255, 255)" }}
        >
          🏦 NEGOTIATE WITH THE BANKER
        </CardTitle>
        {lastBurnedCase && (
          <div
            className="text-sm font-pixel mt-2"
            style={{ color: "rgb(255, 0, 0)" }}
          >
            Last opened: Case {lastBurnedCase.idx + 1} - {formatCurrency(lastBurnedCase.value_cents)}
          </div>
        )}
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
          className="text-xs font-pixel mt-4 text-center"
          style={{ color: "rgba(0, 255, 255, 0.7)" }}
        >
          Negotiations: {negotiationCount} | Remember: You can only accept or reject once!
        </div>
      </CardContent>
    </Card>
  );
}
