import { Avatar, AvatarBadge } from "@chakra-ui/react";
import { AiOutlineSend } from "react-icons/ai";
import moment from "moment";

const groupMessagesByTime = (messages) => {
  const groupedMessages = [];
  let currentGroup = [];

  messages.forEach((message, index) => {
    if (currentGroup.length === 0) {
      currentGroup.push(message);
    } else {
      const lastMessage = currentGroup[currentGroup.length - 1];
      if (
        moment(message.timestamp).diff(
          moment(lastMessage.timestamp),
          "minutes"
        ) < 1
      ) {
        currentGroup.push(message);
      } else {
        groupedMessages.push(currentGroup);
        currentGroup = [message];
      }
    }
  });

  if (currentGroup.length > 0) {
    groupedMessages.push(currentGroup);
  }

  return groupedMessages;
};

const groupMessagesByDate = (messages) => {
  const groupedMessages = {};

  messages.forEach((message) => {
    const messageDate = moment(message.timestamp)
      .startOf("day")
      .format("YYYY-MM-DD");

    if (!groupedMessages[messageDate]) {
      groupedMessages[messageDate] = [];
    }

    groupedMessages[messageDate].push(message);
  });

  return Object.entries(groupedMessages).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
};

const groupMessagesByDateAndTime = (messages) => {
  const dateGroupedMessages = groupMessagesByDate(messages);
  return dateGroupedMessages.map(({ date, messages }) => ({
    date,
    timeGroups: groupMessagesByTime(messages),
  }));
};

const ChatDesign = ({
  user,
  selectedUser,
  onlineUsers,
  messages,
  newMessage,
  setNewMessage,
  formatTimestamp,
  formatDate,
  handleKeyPress,
  handleSendMessage,
  messageEndRef,
}) => {
  const groupedMessages = groupMessagesByDateAndTime(messages);

  return (
    <div className="mx-auto bg-[#ecececef] relative">
      <div className="flex justify-start items-center gap-2 bg-slate-50 w-full p-3 z-50">
        <Avatar size="md" name={selectedUser.username} src="">
          <AvatarBadge
            boxSize="1em"
            bg={
              onlineUsers.includes(selectedUser.username)
                ? "green.500"
                : "gray.500"
            }
          />
        </Avatar>
        <div className="flex flex-col">
          <p>{selectedUser.username}</p>
          <span className="text-[9px]">
            {onlineUsers.includes(selectedUser.username) ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      {/* messages box below  */}
      <ul className="overflow-y-auto h-[85vh] px-10 pt-6 pb-[100px]">
        {groupedMessages.map(({ date, timeGroups }, dateGroupIndex) => (
          <li key={dateGroupIndex}>
            <center>
              <button className="text-[9px] my-1 text-center px-3 py-1 bg-gray-500 text-white rounded-full cursor-text">
                {formatDate(date)}
              </button>
            </center>
            {timeGroups.map((group, timeGroupIndex) => (
              <div key={timeGroupIndex}>
                <div className="text-[9px] my-1 text-center">
                  {formatTimestamp(group[group.length - 1].timestamp)}
                </div>
                {group.map((message, messageIndex) => (
                  <li
                    key={messageIndex}
                    className={`flex mb-2 ${
                      message.from === user.username
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className={`flex flex-col items-end text max-w-[60%]`}>
                      <div className="flex gap-2">
                        {message.from !== user.username && (
                          <Avatar size="sm" name={message.from} src="">
                            <AvatarBadge
                              boxSize="1em"
                              bg={
                                onlineUsers.includes(message.from)
                                  ? "green.500"
                                  : "gray.500"
                              }
                            />
                          </Avatar>
                        )}
                        <p
                          className={`px-4 py-[7px] ${
                            message.from === user.username
                              ? "bg-slate-100"
                              : "bg-blue-200"
                          } text-[#333] rounded-t-3xl rounded-l-3xl`}
                        >
                          {message.text}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </div>
            ))}
          </li>
        ))}
        <div ref={messageEndRef} />
      </ul>
      <div className="bg-slate-50 pl-6 absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full z-50">
        <div className="flex justify-between w-full">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="w-[80%] px-4 pt-4 outline-none bg-slate-50 resize-none h-10"
            onKeyDown={handleKeyPress}
            rows="1"
          />
          <button
            onClick={handleSendMessage}
            className="px-8 text-[18px] font-bold bg-blue-600 text-white py-4 flex gap-3 items-center"
          >
            Send <AiOutlineSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDesign;
