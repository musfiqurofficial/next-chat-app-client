"use client";

import React, { useState } from "react";
import { Button, Center, Text } from "@chakra-ui/react";
import axios from "axios";

const Chat = () => {
  const [username, setUsername] = useState("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");

  const handleUsernameChange = (event) => {
    const input = event.target.value;
    setUsername(input);

    const usernameRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,}$/;
    if (usernameRegex.test(input)) {
      setIsButtonEnabled(true);
      setError("");
    } else {
      setIsButtonEnabled(false);
      setError("Username example: example12");
    }
  };

  const handleButtonClick = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/saveUsername`,
        {
          username,
        }
      );
      if (response.status === 200) {
        localStorage.setItem("username", username);
        window.location.href = `/messenger?username=${username}`;
      }
    } catch (error) {
      console.error("Error saving username:", error);
      setApiError("Failed to save username. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.keyCode === 13) {
      handleButtonClick();
    }
  };

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Center>
          <div>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Type user Name..."
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleKeyPress}
              className="my-2 px-4 py-2 rounded placeholder:text-gray-400 border border-gray-300 outline-none focus:border-blue-400 focus:border-2"
            />
          </div>
        </Center>
        <Center>
          {error && (
            <Text color="red.500" fontSize="sm" className="!text-[12px] mb-2">
              {error}
            </Text>
          )}
        </Center>
        <Center>
          {apiError && (
            <Text color="red.500" fontSize="sm" className="!text-[12px] mb-2">
              {apiError}
            </Text>
          )}
        </Center>
        <Center>
          <Button
            className="!px-5 !bg-blue-500 hover:!bg-blue-400 !text-white"
            isDisabled={!isButtonEnabled}
            onClick={handleButtonClick}
          >
            Let&apos;s Chat
          </Button>
        </Center>
      </div>
    </div>
  );
};

export default Chat;
