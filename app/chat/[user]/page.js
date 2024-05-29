"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import moment from "moment";
import ChatDesign from "@/app/component/common/ChatDesign";
import { Avatar, AvatarBadge, Badge, Tooltip } from "@chakra-ui/react";
import { MdDeleteForever } from "react-icons/md";

const Messenger = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [latestMessages, setLatestMessages] = useState({});

  const messageEndRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUser({ username: storedUsername });
    }
  }, []);

  useEffect(() => {
    const storedUnreadMessages = JSON.parse(
      localStorage.getItem("unreadMessages")
    );
    if (storedUnreadMessages) {
      setUnreadMessages(storedUnreadMessages);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error);
      });

      newSocket.emit("join", user.username);

      newSocket.on("privateMessage", (message) => {
        if (
          message.from === selectedUser?.username ||
          message.to === selectedUser?.username
        ) {
          setMessages((prevMessages) => [...prevMessages, message]);
        } else {
          setUnreadMessages((prev) => {
            const newUnreadMessages = {
              ...prev,
              [message.from]: (prev[message.from] || 0) + 1,
            };
            localStorage.setItem(
              "unreadMessages",
              JSON.stringify(newUnreadMessages)
            );
            return newUnreadMessages;
          });
        }
        setLatestMessages((prev) => ({
          ...prev,
          [message.from]: message.timestamp,
        }));
      });

      newSocket.on("updateUserStatus", (onlineUsers) => {
        setOnlineUsers(onlineUsers);
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user, selectedUser]);

  useEffect(() => {
    if (user) {
      axios
        .get("http://localhost:5000/chatUsers")
        .then((response) => {
          setUsers(response.data);
          response.data.forEach((chatUser) => {
            axios
              .get(
                `http://localhost:5000/messages/${user.username}/${chatUser.username}`
              )
              .then((res) => {
                const userMessages = res.data;
                if (userMessages.length > 0) {
                  const latestMessage = userMessages[userMessages.length - 1];
                  setLatestMessages((prev) => ({
                    ...prev,
                    [chatUser.username]: latestMessage.timestamp,
                  }));
                }
              })
              .catch((error) =>
                console.error("Error fetching messages:", error)
              );
          });
        })
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, [user]);

  const handleSendMessage = useCallback(() => {
    if (socket && newMessage.trim() && selectedUser) {
      const message = {
        from: user.username,
        to: selectedUser.username,
        text: newMessage,
        timestamp: new Date(),
      };
      socket.emit("privateMessage", message);
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage("");
    }
  }, [socket, newMessage, selectedUser, user]);

  const handleKeyPress = (e) => {
    if (e.keyCode === 13) {
      handleSendMessage();
    }
  };

  const handleUserSelect = useCallback(
    (username) => {
      setSelectedUser({ username });
      axios
        .get(`http://localhost:5000/messages/${user.username}/${username}`)
        .then((response) => {
          setMessages(response.data);
          setUnreadMessages((prev) => {
            const newUnreadMessages = {
              ...prev,
              [username]: 0,
            };
            localStorage.setItem(
              "unreadMessages",
              JSON.stringify(newUnreadMessages)
            );
            return newUnreadMessages;
          });
          socket.emit("markAsSeen", { from: username, to: user.username });
        })
        .catch((error) => console.error("Error fetching messages:", error));
    },
    [user, socket]
  );

  const formatTimestamp = (timestamp) => {
    const now = moment();
    const time = moment(timestamp);
    const diff = now.diff(time, "minutes");

    if (diff < 1) return "Just now";
    if (diff < 10) return `${diff} min ago`;
    return time.format("HH:mm");
  };

  const formatDate = (dateString) => {
    const date = moment(dateString);
    const now = moment();

    if (now.isSame(date, "day")) {
      return "Today";
    } else if (now.subtract(1, "days").isSame(date, "day")) {
      return "Yesterday";
    } else {
      return date.format("D MMMM YYYY");
    }
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on("messagesSeen", ({ from, to }) => {
        if (from === selectedUser?.username) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.from === from && msg.to === to ? { ...msg, seen: true } : msg
            )
          );
        }
      });

      return () => {
        socket.off("messagesSeen");
      };
    }
  }, [socket, selectedUser]);

  if (!user) {
    return <div>Loading...</div>;
  }

  // Sort users based on unread messages and latest message timestamp
  const sortedUsers = [...users].sort((a, b) => {
    const aUnread = unreadMessages[a.username] || 0;
    const bUnread = unreadMessages[b.username] || 0;
    if (aUnread !== bUnread) {
      return bUnread - aUnread;
    }
    const aLatest = latestMessages[a.username] || 0;
    const bLatest = latestMessages[b.username] || 0;
    return new Date(bLatest) - new Date(aLatest);
  });

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`http://localhost:5000/messages/${messageId}`);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div className="px-4 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-2xl md:px-24 lg:px-8 h-screen">
      <div className="grid grid-cols-12 relative">
        <div className="col-span-3">
          <center className="mt-4 mb-8">
            <Avatar size="md" name={user.username} src="">
              <AvatarBadge
                boxSize="1em"
                bg={
                  onlineUsers.includes(user.username) ? "green.500" : "gray.500"
                }
              />
            </Avatar>
            <h2 className="font-semibold text-[18px]">{user.username}</h2>
          </center>
          <ul className="overflow-y-auto h-[80vh]">
            {sortedUsers
              .filter((u) => u.username !== user.username)
              .map((u) => (
                <li
                  key={u._id}
                  className="flex items-center gap-4 mb-1 bg-[#ececec48] hover:bg-[#ecececef] p-2 rounded-lg relative group"
                >
                  <Avatar size="md" name={u.username} src="">
                    <AvatarBadge
                      boxSize="1em"
                      bg={
                        onlineUsers.includes(u.username)
                          ? "green.500"
                          : "gray.500"
                      }
                    />
                  </Avatar>
                  <div className="flex flex-col !justify-start items-start relative">
                    <Tooltip label={u.username} fontSize="md">
                      <button
                        onClick={() => handleUserSelect(u.username)}
                        className={` ${
                          unreadMessages[u.username] > 0
                            ? "font-bold text-blue-700"
                            : "font-semibold"
                        }`}
                      >
                        {u.username.length > 10
                          ? `${u.username.slice(0, 10)}...`
                          : u.username}
                      </button>
                    </Tooltip>
                    {unreadMessages[u.username] > 0 && (
                      <Badge className="absolute -right-7 ">
                        {unreadMessages[u.username]}
                      </Badge>
                    )}
                    <span
                      className={`text-[10px] ${
                        onlineUsers.includes(u.username)
                          ? "text-green-600 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {onlineUsers.includes(u.username) ? "Online" : "Offline"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(u._id)}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 hidden group-hover:flex"
                  >
                    <MdDeleteForever className="w-5 h-5 text-red-600" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
        <div className="col-span-9 ml-8">
          {selectedUser && (
            <ChatDesign
              user={user}
              selectedUser={selectedUser}
              onlineUsers={onlineUsers}
              messages={messages}
              formatTimestamp={formatTimestamp}
              formatDate={formatDate}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleKeyPress={handleKeyPress}
              handleSendMessage={handleSendMessage}
              messageEndRef={messageEndRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;
