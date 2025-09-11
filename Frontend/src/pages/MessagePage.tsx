import React, { useState, useEffect } from "react";
// Footer rendered globally in _app.tsx
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search,
  MoreVertical,
  Phone,
  Video
} from "lucide-react";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";

interface MessagingPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

interface Conversation {
  id: number;
  name: string;
  company: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  unreadCount?: number;
  isOnline?: boolean;
}

interface Message {
  id: number;
  text: string;
  timestamp: string;
  isOwn: boolean;
  sender?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
}

export default function MessagingPage({ onNavigate }: MessagingPageProps) {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesList, setMessagesList] = useState<Message[]>([]);

  const apiGet = async (path: string) => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
      const url = path.startsWith('/api/') && base ? `${base}${path}` : path;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const loadConversations = async () => {
  const json = await apiGet('/api/conversations/');
      if (json) {
        setConversations(json);
        if (json.length > 0 && selectedConversation === null) {
          setSelectedConversation(json[0].id);
        }
      }
    };
    loadConversations();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;
  const json = await apiGet(`/api/messages/?conversation_id=${selectedConversation}`);
      if (json) {
        setMessagesList(json);
        // mark messages in this conversation as read
                        await fetch('/api/messages/mark_read/', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({conversation_id: selectedConversation}) });
      }
    };
    loadMessages();
  }, [selectedConversation]);
  

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
  // Here you would add the message to the conversation
      setNewMessage("");
    }
  };

  const handleAttachment = () => {
  // Here you would handle adding attachments
  console.log("Add attachment");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Messaging</h1>
          <p className="text-xl text-gray-600">
            Communicate with your professional network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Conversation list */}
          <div className="lg:col-span-1">
            <Card className="bg-white h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Conversations</h3>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search for a conversation..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-4">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <img
                              src={conv.avatar}
                              alt={conv.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            {conv.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm truncate">{conv.name}</p>
                                <p className="text-xs text-gray-500 truncate">{conv.company}</p>
                              </div>
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-xs text-gray-500">{conv.timestamp}</span>
                                {conv.unread && conv.unreadCount && (
                                  <Badge variant="default" className="text-xs min-w-[20px] h-5 rounded-full">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2">
            <Card className="bg-white h-full flex flex-col">
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={selectedConv.avatar}
                            alt={selectedConv.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {selectedConv.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedConv.name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedConv.company} • {selectedConv.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {messagesList.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              {message.hasAttachment && (
                                <div className="flex items-center space-x-2 mt-2 p-2 bg-black/10 rounded">
                                  <Paperclip className="h-3 w-3" />
                                  <span className="text-xs">{message.attachmentName}</span>
                                </div>
                              )}
                              <p className={`text-xs mt-1 ${
                                message.isOwn ? "text-primary-foreground/70" : "text-gray-500"
                              }`}>
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Send area */}
                  <div className="border-t p-4">
                    <div className="flex items-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleAttachment}
                        className="mb-2"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                          rows={2}
                          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="mb-2"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  {/* Footer moved to _app.tsx */}
    </div>
  );
}