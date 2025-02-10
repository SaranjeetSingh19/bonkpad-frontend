import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

  

export default function HomePage() {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  // With this environment variable version:
const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true, // Add this for CORS
  maxHttpBufferSize: 1e8
});


  useEffect(() => {
    if (!username) {
      navigate('/');
    }

    // Register user with Socket.IO
    socket.emit('register', username);

    // Listen for incoming messages
    socket.on('receiveMessage', ({ sender, message, file }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender, message, file },
      ]);
    });

    // Cleanup
    return () => {
      socket.off('receiveMessage');
    };
  }, [username, navigate]);

  const handleSendMessage = async () => {
    if (!recipient || (!message && !fileInputRef.current?.files[0])) {
      setError('Please enter a recipient and a message or file.');
      return;
    }

    // Check if recipient exists
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/check-recipient`, {
        username: recipient,
      });

      if (!response.data.exists) {
        setError('Recipient not found. Please check the username.');
        return;
      }

      // Read file as Base64
      let file = null;
      const fileObj = fileInputRef.current?.files[0];
      if (fileObj) {
        const reader = new FileReader();
        reader.onload = () => {
          file = {
            name: fileObj.name,
            type: fileObj.type,
            data: reader.result, // Base64 string
          };

          // Emit message to the backend
          socket.emit('sendMessage', {
            sender: username,
            receiver: recipient,
            message,
            file,
          });

          // Add message to local state for sender
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: username, message, file },
          ]);

          // Clear inputs and error
          setMessage('');
          fileInputRef.current.value = '';
          setError('');
        };
        reader.readAsDataURL(fileObj);
      } else {
        // Emit text message
        socket.emit('sendMessage', {
          sender: username,
          receiver: recipient,
          message,
        });

        // Add message to local state for sender
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: username, message },
        ]);

        // Clear inputs and error
        setMessage('');
        setError('');
      }
    } catch (err) {
      setError('Error sending message. Please try again.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('username');

    // Disconnect from Socket.IO
    socket.disconnect();

    // Redirect to login page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {/* Header with Logout Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome {username}!</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Recipient Username Input */}
        <div className="mb-4">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient's username"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message Input */}
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Send Message
        </button>

        {/* Message History */}
        <div className="mt-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded ${
                msg.sender === username ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <strong>{msg.sender}: </strong>
              <span>{msg.message}</span>
              {msg.file && (
                <div className="mt-2">
                  {msg.file.type.startsWith('image/') ? (
                    <img
                      src={msg.file.data}
                      alt="Shared file"
                      className="max-w-full h-auto rounded"
                    />
                  ) : (
                    <a
                      href={msg.file.data}
                      download={msg.file.name}
                      className="text-blue-500 underline"
                    >
                      Download {msg.file.name}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 