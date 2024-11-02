import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const DMComponent = ({ userId, userName }) => {
  const [connection, setConnection] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const recipientUserId = "recipientUserId"; // Replace with actual recipient ID in a real app

  useEffect(() => {
    // Set up SignalR connection
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7215/communicationHub')  // Update with your backend URL
      .withAutomaticReconnect()
      .build();

    // Start the connection and set up message listener
    newConnection.start()
      .then(() => {
        console.log("Connected to SignalR hub");

        // Listen for incoming direct messages
        newConnection.on("ReceiveDirectMessage", (senderUserId, senderName, message, timestamp) => {
          setMessages(prevMessages => [
            ...prevMessages,
            { sender: senderName, message, timestamp, senderUserId }
          ]);
        });
      })
      .catch(err => console.error("Connection failed: ", err));

    setConnection(newConnection);

    // Clean up the connection when the component unmounts
    return () => {
      newConnection.stop();
    };
  }, []);

  const handleSendMessage = async () => {
    if (newMessage.trim() && connection && connection.state === signalR.HubConnectionState.Connected) {
      const timestamp = new Date().toLocaleTimeString();
      try {
        await connection.invoke("SendDirectMessage", recipientUserId, userId, userName, newMessage, timestamp);
        setMessages(prevMessages => [
          ...prevMessages,
          { sender: userName, message: newMessage, timestamp, senderUserId: userId }
        ]);
        setNewMessage(''); // Clear the input after sending
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      console.warn("Connection is not established. Please wait and try again.");
    }
  };

  return (
    <div>
      <h3>Chat with {recipientUserId}</h3>
      <div>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.sender}:</strong> {msg.message} <em>{msg.timestamp}</em></p>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default DMComponent;
