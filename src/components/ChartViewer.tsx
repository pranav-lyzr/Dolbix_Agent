import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { VegaLite } from 'react-vega';

const LOCAL_STORAGE_KEY = 'chatHistory';

export const ChartViewer = () => {
  const location = useLocation();
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const state = location.state;

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateChartGeneration = async (prompt) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://agent-dev.test.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'x-api-key': 'sk-default-PPcvzcCe4cJRRP8JkEXnT51woYJUXzMZ',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: "pranav@lyzr.ai",
          agent_id: "67ab0d44389e36c11f677b2c",
          session_id: "67ab0d44389e36c11f677b2c",
          message: JSON.stringify({ user_message: prompt, zac_data: state?.zacData, datacode_data: state?.dataCodeData, kintone_data: state?.kitoneData }),
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.text();
      const botResponse = JSON.parse(data);
      const jsonMatch = botResponse.response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return { text: "Here's the chart:", imageJson: JSON.parse(jsonMatch[1].trim()) };
      } else {
        throw new Error('No valid JSON found in the response');
      }
    } catch (error) {
      console.error('Error generating bot response:', error);
      return { text: "Error: Unable to generate the graph.", imageJson: null };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const userMessage = { id: Date.now().toString(), text: newMessage, sender: 'user', timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    const response = await simulateChartGeneration(newMessage);
    const botMessage = { id: (Date.now() + 1).toString(), text: response.text, sender: 'bot', timestamp: Date.now(), imageJson: response.imageJson };
    setMessages((prev) => [...prev, botMessage]);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));

  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-lg h-[calc(90vh)]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Chart Generator</h2>
      <div className="flex flex-col h-[75vh]">
        <div className="flex-1 border border-gray-200 rounded-lg p-4 mb-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">Ask me to generate charts based on the performance data</div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p className="text-sm mb-2">{message.text}</p>
                    {message.imageJson && <VegaLite spec={message.imageJson} />}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mt-4">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ask for a specific chart..." className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 border-gray-200" disabled={isLoading} />
          <button onClick={handleSendMessage} disabled={isLoading || !newMessage.trim()} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Send</button>
        </div>
      </div>
    </div>
  );
};
