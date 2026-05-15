import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Chat.css";
import { MessageCircle, Send, User, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useSocket } from "../context/socketContext";
import { RootState } from "../redux/store";

interface Message {
  id: number;
  text: string;
  senderId: string;
  senderName: string;
  sentAt?: string;
}

type Participant = {
  socketID: string;
  userData?: {
    name?: string;
    avatar?: {
      secure_url?: string;
    };
  };
};

type TypingUser = {
  socketID: string;
  name: string;
};

interface ChatProps {
  participantsData: Participant[];
}

const Chat: React.FC<ChatProps> = ({ participantsData }) => {
  const [open, setOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [searchParams] = useSearchParams();
  const roomID = searchParams.get("ID");
  const socket = useSocket();
  const { userData } = useSelector((state: RootState) => state.User);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current && open) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    };

    setTimeout(scrollToBottom, 0);
  }, [messages, typingUsers, open]);

  useEffect(() => {
    const handleReceive = (data: Message) => {
      setMessages((messages) => [...messages, data]);

      if (!open && data.senderId !== socket?.id) {
        setUnseenCount((prev) => prev + 1);
      }
    };

    const handleTyping = (typingUser: TypingUser | string) => {
      const nextTypingUser =
        typeof typingUser === "string"
          ? { socketID: "", name: typingUser }
          : typingUser;

      if (
        nextTypingUser.socketID === socket?.id ||
        nextTypingUser.name === userData?.name
      ) {
        return;
      }

      setTypingUsers((prev) => {
        const alreadyTyping = prev.some((user) =>
          nextTypingUser.socketID
            ? user.socketID === nextTypingUser.socketID
            : user.name === nextTypingUser.name
        );

        return alreadyTyping ? prev : [...prev, nextTypingUser];
      });

      setTimeout(() => {
        setTypingUsers((prev) => {
          if (nextTypingUser.socketID) {
            return prev.filter(
              (user) => user.socketID !== nextTypingUser.socketID
            );
          }

          return prev.filter((user) => user.name !== nextTypingUser.name);
        });
      }, 2000);
    };

    socket?.on("receive-msg", handleReceive);
    socket?.on("typing", handleTyping);

    return () => {
      socket?.off("receive-msg", handleReceive);
      socket?.off("typing", handleTyping);
    };
  }, [socket, open, userData?.name]);

  const getParticipant = useCallback(
    (socketID?: string) =>
      participantsData.find((participant) => participant.socketID === socketID),
    [participantsData]
  );

  const getAvatarUrl = useCallback(
    (socketID?: string) =>
      socketID === socket?.id
        ? userData?.avatar?.secure_url
        : getParticipant(socketID)?.userData?.avatar?.secure_url,
    [getParticipant, socket?.id, userData?.avatar?.secure_url]
  );

  const getDisplayName = useCallback(
    (socketID: string | undefined, fallbackName: string) =>
      socketID === socket?.id
        ? "You"
        : getParticipant(socketID)?.userData?.name || fallbackName,
    [getParticipant, socket?.id]
  );

  const formatTime = (time?: string) => {
    if (!time) return "";

    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(time));
  };

  const handleTypingEvent = () => {
    socket?.emit("typing", { roomID, name: userData?.name });
  };

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: input.trim(),
      senderId: socket?.id || "",
      senderName: userData?.name as string,
      sentAt: new Date().toISOString(),
    };

    socket?.emit("send-msg", roomID, newMessage);
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  }, [input, roomID, socket, userData?.name]);

  const toggleChat = () => {
    setOpen((prev) => !prev);
    if (!open) setUnseenCount(0);
  };

  const renderAvatar = (name: string, avatarUrl?: string) => (
    <span className="chat-avatar" title={name || "User"}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name || "User avatar"} loading="lazy" />
      ) : (
        <User size={17} />
      )}
    </span>
  );

  return (
    <div>
      <button
        type="button"
        className="chat-circle"
        onClick={toggleChat}
        aria-label={open ? "Close room chat" : "Open room chat"}
      >
        <MessageCircle size={24} />
        {unseenCount > 0 && <span className="chat-badge">{unseenCount}</span>}
      </button>

      {open && (
        <div className="chat-container">
          <div className="chat-header">
            <div>
              <span>Room Chat</span>
              <small>{messages.length} messages</small>
            </div>
            <button
              type="button"
              className="close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close room chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages" ref={messagesContainerRef}>
            {messages.length === 0 && (
              <div className="chat-empty">Start the room conversation here.</div>
            )}

            {messages.map((msg) => {
              const isMe = msg.senderId === socket?.id;
              const displayName = getDisplayName(msg.senderId, msg.senderName);
              const avatarUrl = getAvatarUrl(msg.senderId);

              return (
                <div
                  key={msg.id}
                  className={`chat-message-row ${isMe ? "me" : "other"}`}
                >
                  {!isMe && renderAvatar(displayName, avatarUrl)}
                  <div className="chat-message-stack">
                    <span className="chat-sender">
                      {displayName}
                      {msg.sentAt && <time>{formatTime(msg.sentAt)}</time>}
                    </span>
                    <div className={`chat-bubble ${isMe ? "me" : "other"}`}>
                      {msg.text}
                    </div>
                  </div>
                  {isMe && renderAvatar(displayName, avatarUrl)}
                </div>
              );
            })}

            {typingUsers.map((typingUser) => {
              const displayName = getDisplayName(
                typingUser.socketID,
                typingUser.name
              );
              const avatarUrl = getAvatarUrl(typingUser.socketID);

              return (
                <div
                  className="chat-typing-row"
                  key={typingUser.socketID || typingUser.name}
                >
                  {renderAvatar(displayName, avatarUrl)}
                  <div
                    className="typing-bubble"
                    aria-label={`${displayName} is typing`}
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                handleTypingEvent();
              }}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} aria-label="Send message">
              <Send size={14} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
