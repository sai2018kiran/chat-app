import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { Send, Trash2, Trash, Pin, MessageSquareOff } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId] = useState(() => {
    let id = localStorage.getItem('chatUserId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatUserId', id);
    }
    return id;
  });
  const messagesEndRef = useRef(null);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL);
    
    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('message_deleted_everyone', (updatedMsg) => {
      setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });

    socket.on('message_pinned', (updatedMsg) => {
      setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });

    return () => socket.disconnect();
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          senderId: userId
        })
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      const res = await fetch(`${API_URL}/messages/${id}?type=${type}&userId=${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Deletion failed');
      
      const updatedMsg = await res.json();
      
      // If deleted for me, update local state
      if (type === 'me') {
        setMessages(prev => prev.map(m => m.id === id ? updatedMsg : m));
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const handleTogglePin = async (id, isCurrentlyPinned) => {
    try {
      await fetch(`${API_URL}/messages/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isCurrentlyPinned })
      });
    } catch (err) {
      console.error('Failed to pin message', err);
    }
  };

  const visibleMessages = messages.filter(m => {
    let deletedFor = [];
    try { deletedFor = JSON.parse(m.deletedFor || '[]'); } catch(e){}
    return !deletedFor.includes(userId);
  });

  const pinnedMessages = visibleMessages.filter(m => m.isPinned && !m.isDeletedForEveryone);
  const regularMessages = visibleMessages;

  return (
    <div className="app-container">
      
      {/* Sidebar for Pinned Messages */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Pin size={18} color="#4f46e5" /> Pinned Messages
        </div>
        <div className="sidebar-content">
          {pinnedMessages.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '40px' }}>No pinned messages yet.</p>
          ) : (
             pinnedMessages.map(msg => (
               <div key={`pin-${msg.id}`} className="pinned-message">
                 <p>{msg.content}</p>
                 <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', display: 'block' }}>
                   {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                 </span>
                 <button onClick={() => handleTogglePin(msg.id, msg.isPinned)} className="pin-icon-btn">
                    <Pin size={14} fill="currentColor" />
                 </button>
               </div>
             ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        
        {/* Header */}
        <div className="chat-header">
          <div>
            <div className="chat-title">Adverayze Chat</div>
            <div className="chat-subtitle">Live Team Discussion</div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="messages-list">
          {regularMessages.length === 0 && (
             <div className="empty-state">
                 <MessageSquareOff size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                 <p>Start a conversation...</p>
             </div>
          )}
          
          {regularMessages.map((msg) => {
            const isMe = msg.senderId === userId;
            const isDeletedForEveryone = msg.isDeletedForEveryone;

            return (
              <div key={msg.id} className={`message-row ${isMe ? 'mine' : 'other'}`}>
                <div className="message-box">
                  
                  {/* Message Bubble */}
                  <div className={`message-bubble ${msg.isPinned && !isDeletedForEveryone ? 'is-pinned' : ''} ${isDeletedForEveryone ? 'message-deleted' : ''}`}>
                    {msg.isPinned && !isDeletedForEveryone && (
                      <div className="pin-badge">
                        <Pin size={12} fill="currentColor" />
                      </div>
                    )}

                    {isDeletedForEveryone ? (
                      <>
                        <Trash size={14} /> This message was deleted
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="message-meta">
                    <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>

                    {!isDeletedForEveryone && (
                      <div className="message-actions">
                        <button 
                          onClick={() => handleTogglePin(msg.id, msg.isPinned)}
                          className="action-btn"
                          title={msg.isPinned ? "Unpin" : "Pin"}
                        >
                          <Pin size={14} fill={msg.isPinned ? "currentColor" : "none"} />
                        </button>
                        
                        <div className="action-dropdown">
                           <button className="action-btn" title="Delete Options">
                            <Trash2 size={14} />
                           </button>
                           {/* Popover */}
                           <div className="popover">
                             <button onClick={() => handleDelete(msg.id, 'me')} className="popover-btn">Delete for me</button>
                             {isMe && (
                                <button onClick={() => handleDelete(msg.id, 'everyone')} className="popover-btn danger">Delete for everyone</button>
                             )}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message..."
              className="chat-input"
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="send-btn"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
