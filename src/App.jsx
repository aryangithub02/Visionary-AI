import { useState, useRef, useEffect } from 'react';

function App() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('aiChatHistory');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChatHistory(parsedChats);
        
        // If there are chats, open the most recent one
        if (parsedChats.length > 0) {
          setActiveChatId(parsedChats[0].id);
          setConversation(parsedChats[0].messages);
        }
      } catch (error) {
        console.error("Error parsing saved chats:", error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to render text with Markdown-like formatting
  const renderWithFormatting = (text) => {
    if (!text) return null;
    
    // Escape HTML first to prevent XSS
    let processedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Process code blocks first (```code```)
    processedText = processedText.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Process inline code (`code`)
    processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Process bold text (**text**)
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Process italic text (*text*)
    processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process headers (### Header)
    processedText = processedText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processedText = processedText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processedText = processedText.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Process lists
    processedText = processedText.replace(/^\* (.*$)/gim, '<li>$1</li>');
    processedText = processedText.replace(/^- (.*$)/gim, '<li>$1</li>');
    processedText = processedText.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');
    
    // Wrap consecutive list items in ul tags
    processedText = processedText.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    processedText = processedText.replace(/<\/ul>\s*<ul>/g, '');
    
    // Process line breaks
    processedText = processedText.replace(/\n/g, '<br />');
    
    return { __html: processedText };
  };

  // Create a new chat
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setActiveChatId(newChatId);
    setConversation([]);
    
    // Add to chat history
    const newChat = { 
      id: newChatId, 
      title: "New Chat", 
      messages: [], 
      timestamp: new Date(),
      lastUpdated: new Date()
    };
    
    setChatHistory(prev => [newChat, ...prev]);
  };

  // Switch to a different chat
  const switchChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setConversation(chat.messages);
    }
  };

  // Delete a chat
  const deleteChat = (chatId, e) => {
    e.stopPropagation(); // Prevent triggering the chat switch
    
    // If we're deleting the active chat, switch to a new one
    if (chatId === activeChatId) {
      const otherChats = chatHistory.filter(c => c.id !== chatId);
      if (otherChats.length > 0) {
        setActiveChatId(otherChats[0].id);
        setConversation(otherChats[0].messages);
      } else {
        createNewChat();
      }
    }
    
    // Remove from history
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
  };

  // Clear all chats
  const clearAllChats = () => {
    if (window.confirm("Are you sure you want to delete all chats? This cannot be undone.")) {
      setChatHistory([]);
      setActiveChatId(null);
      setConversation([]);
    }
  };

  async function generateAnswer() {
    if (!question.trim()) return;
    
    setIsLoading(true);
    
    // Create a new chat if none exists
    let currentChatId = activeChatId;
    if (!currentChatId) {
      const newChatId = Date.now().toString();
      currentChatId = newChatId;
      setActiveChatId(newChatId);
      
      // Add to chat history
      const newChat = { 
        id: newChatId, 
        title: question.slice(0, 30) + (question.length > 30 ? "..." : ""), 
        messages: [], 
        timestamp: new Date(),
        lastUpdated: new Date()
      };
      
      setChatHistory(prev => [newChat, ...prev]);
    }
    
    // Add user question to conversation
    const userMessage = { 
      type: 'user', 
      content: question, 
      timestamp: new Date() 
    };
    
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    
    // Clear the input immediately
    const currentQuestion = question;
    setQuestion("");
    
    // Update chat history with user message
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              messages: updatedConversation,
              title: chat.title === "New Chat" && currentQuestion.length > 0 
                ? currentQuestion.slice(0, 30) + (currentQuestion.length > 30 ? "..." : "")
                : chat.title,
              lastUpdated: new Date()
            } 
          : chat
      )
    );
    
    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a simulated response
      const responses = [
        `I understand you're asking about "${currentQuestion}". Here's a detailed explanation...\n\n` +
        `Here's some example code:\n\n` +
        "```javascript\nfunction example() {\n  console.log('Hello, world!');\n  return true;\n}\n```\n\n" +
        "Let me know if you need more details!",
        
        `Thanks for your question about "${currentQuestion}".\n\n` +
        "Here's a code snippet that might help:\n\n" +
        "```javascript\nconst data = [1, 2, 3, 4, 5];\nconst doubled = data.map(item => item * 2);\nconsole.log(doubled); // [2, 4, 6, 8, 10]\n```\n\n" +
        "Is there anything else you'd like to know?",
        
        `I'd be happy to help with "${currentQuestion}".\n\n` +
        "Consider this approach:\n\n" +
        "```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}\n```\n\n" +
        "This should center your content both vertically and horizontally."
      ];
      
      const botAnswer = responses[Math.floor(Math.random() * responses.length)];
      const botMessage = { 
        type: 'bot', 
        content: botAnswer, 
        timestamp: new Date() 
      };
      
      // Add bot answer to conversation
      const finalConversation = [...updatedConversation, botMessage];
      setConversation(finalConversation);
      
      // Update chat history with bot message
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChatId 
            ? { 
                ...chat, 
                messages: finalConversation,
                lastUpdated: new Date()
              } 
            : chat
        )
      );
    } catch (error) {
      console.error("Error generating answer:", error);
      const errorMessage = { 
        type: 'bot', 
        content: "Sorry, I encountered an error while generating a response. Please check your internet connection and try again.",
        timestamp: new Date(),
        isError: true
      };
      const finalConversation = [...updatedConversation, errorMessage];
      setConversation(finalConversation);
      
      // Update chat history with error message
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: finalConversation, lastUpdated: new Date() } 
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateAnswer();
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffTime = Math.abs(now - chatDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return chatDate.toLocaleDateString();
    }
  };

  const getTotalMessages = () => {
    return chatHistory.reduce((total, chat) => total + chat.messages.length, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-black bg-opacity-20 backdrop-blur-lg text-white overflow-hidden flex flex-col border-r border-white border-opacity-20`}>
        <div className="p-4 border-b border-white border-opacity-20 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Chat History</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-2">
          <button 
            onClick={createNewChat}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
          
          <div className="flex gap-2">
            {chatHistory.length > 1 && (
              <button 
                onClick={clearAllChats}
                className="flex-1 p-2 bg-red-600 hover:bg-red-500 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {/* Stats */}
        {chatHistory.length > 0 && (
          <div className="px-4 py-2 border-b border-white border-opacity-10">
            <div className="text-xs text-white text-opacity-70">
              {chatHistory.length} chats • {getTotalMessages()} messages
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="p-4 text-center text-white text-opacity-70">
              <p>No chat history yet</p>
              <p className="text-sm mt-2">Start a conversation to see it saved here</p>
            </div>
            ) : (
            <div className="space-y-1 p-2">
              {chatHistory.map(chat => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all duration-200 ${
                    activeChatId === chat.id 
                      ? 'bg-white bg-opacity-20 backdrop-blur-sm' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                  onClick={() => switchChat(chat.id)}
                >
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-white text-opacity-60 flex items-center gap-2">
                      <span>{formatDate(chat.timestamp)}</span>
                      {chat.messages.length > 0 && (
                        <span>• {chat.messages.length} msgs</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-1 rounded hover:bg-white hover:bg-opacity-20 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white border-opacity-20 text-center text-xs text-white text-opacity-50">
          <p>AI Chat Assistant © {new Date().getFullYear()}</p>
          <p className="mt-1">Chats saved to browser localStorage • Always persistent</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="py-4 px-6 bg-black bg-opacity-20 backdrop-blur-lg text-white flex items-center justify-between border-b border-white border-opacity-20">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-3xl font-bold mx-auto bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            AI Chat Assistant
          </h1>
          <div className="w-10"></div>
        </header>
        
        {/* Main Chat Container */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 overflow-hidden">
          <div className="w-full max-w-5xl h-full bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white border-opacity-30">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-indigo-50 to-white">
              {conversation.length === 0 && activeChatId ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="mb-6 bg-white p-8 rounded-3xl shadow-lg max-w-md text-center border border-purple-100">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-700 mb-3">How can I help you today?</h3>
                    <p className="text-gray-600">Ask me anything - I'm here to assist with your questions and have engaging conversations!</p>
                  </div>
                </div>
              ) : conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="mb-6 bg-white p-8 rounded-3xl shadow-lg max-w-md text-center border border-purple-100">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-700 mb-3">Welcome to AI Chat Assistant!</h3>
                    <p className="text-gray-600 mb-4">Start a new conversation or create a new chat to begin your AI-powered discussions.</p>
                    <button 
                      onClick={createNewChat}
                      className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                    >
                      Start New Chat
                    </button>
                  </div>
                </div>
              ) : (
                conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`group max-w-xs md:max-w-md lg:max-w-2xl rounded-3xl px-6 py-4 shadow-lg relative ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                          : `${msg.isError ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'} text-gray-800 rounded-bl-md markdown-content`
                      }`}
                    >
                      {msg.type === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div 
                          className="whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={renderWithFormatting(msg.content)}
                        />
                      )}
                      <div className={`text-xs mt-3 flex items-center gap-2 ${msg.type === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.type === 'bot' && (
                          <button
                            onClick={() => copyToClipboard(msg.content)}
                            className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                            title="Copy message"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-xs md:max-w-md lg:max-w-2xl bg-gray-50 border border-gray-200 text-gray-800 rounded-3xl rounded-bl-md px-6 py-4 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Using localStorage for data persistence</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="border-t border-gray-200 p-6 bg-white bg-opacity-80 backdrop-blur-sm">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    className="w-full resize-none border-2 border-gray-300 rounded-2xl py-4 px-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white bg-opacity-90 placeholder-gray-500"
                    rows="1"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    style={{ minHeight: '56px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={generateAnswer}
                    disabled={isLoading || !question.trim()}
                    className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <div className="text-xs text-gray-400">
                  {question.length}/2000
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;