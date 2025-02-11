import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, ChartBar, MessageSquare, Menu, Download, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import ReactMarkdown from "react-markdown";
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ChartViewer } from './components/ChartViewer';


type LocationState = {
  kitoneData: File;
  zacData: File;
  dataCodeData: File;
} | null;
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
};
type ReportData = {
  'Parent Code': string;
  'Customer Name': string;
  'Project Name': string;
  'Project Rank': string;
  'Project Code': string;
  'April': number;
  'May': number;
  'June': number;
  'July': number;
  'August': number;
  'September': number;
  'October': number;
  'November': number;
  'December': number;
  'January': number;
  'February': number;
  'March': number;
  'Net sales amount': number;
};
const ProcessFiles = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'performance' | 'chat' | 'chart'>('performance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [showMonthlyView, setShowMonthlyView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const state = location.state as LocationState;
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'report.xlsx');
  };
  const downloadPDF = () => {
    const doc = new jsPDF();
    const tableColumn = showMonthlyView 
      ? ['Customer', 'Project', 'Rank', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Net Sales']
      : ['Customer', 'Project', 'Rank', 'Net Sales'];
    
    const tableRows = reportData.map(item => showMonthlyView 
      ? [
          item['Customer Name'],
          item['Project Name'],
          item['Project Rank'],
          item['April'].toLocaleString(),
          item['May'].toLocaleString(),
          item['June'].toLocaleString(),
          item['July'].toLocaleString(),
          item['August'].toLocaleString(),
          item['September'].toLocaleString(),
          item['October'].toLocaleString(),
          item['November'].toLocaleString(),
          item['December'].toLocaleString(),
          item['January'].toLocaleString(),
          item['February'].toLocaleString(),
          item['March'].toLocaleString(),
          item['Net sales amount'].toLocaleString()
        ]
      : [
          item['Customer Name'],
          item['Project Name'],
          item['Project Rank'],
          item['Net sales amount'].toLocaleString()
        ]
    );

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 16, 242] }
    });

    doc.save('report.pdf');
  };

  const downloadMessageAsDoc = async (markdown: string) => {
    console.log('Markdown:', markdown);
    const lines = markdown.split("\n"); // Split markdown into lines
    const paragraphs: Paragraph[] = [];

    lines.forEach((line) => {
        if (line.startsWith("### ")) {
            // Level 3 heading
            paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.replace("### ", ""), bold: true, size: 28 })] }));
        } else if (line.startsWith("## ")) {
            // Level 2 heading
            paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.replace("## ", ""), bold: true, size: 32 })] }));
        } else if (line.startsWith("- **")) {
            // Bullet point with bold text
            const parts = line.match(/\*\*(.*?)\*\*(.*)/);
            if (parts) {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: `• ${parts[1]}`, bold: true }),
                            new TextRun({ text: parts[2] }),
                        ],
                    })
                );
            }
        } else if (line.startsWith("- ")) {
            // Regular bullet points
            paragraphs.push(new Paragraph({ children: [new TextRun({ text: `• ${line.replace("- ", "")}` })] }));
        } else if (line.match(/\*\*(.*?)\*\*/)) {
            // Bold text inside a sentence
            const parts = line.split(/\*\*(.*?)\*\*/);
            const runs: TextRun[] = [];
            parts.forEach((part, index) => {
                runs.push(new TextRun({ text: part, bold: index % 2 !== 0 }));
            });
            paragraphs.push(new Paragraph({ children: runs }));
        } else {
            // Normal text
            paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
        }
    });

    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance-report-${new Date().toISOString()}.docx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };
  

  const generateReport = async () => {
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
          agent_id: "67a616975554cc81102b9ed1",
          session_id: "67a616975554cc81102b9ed1",
          message: JSON.stringify({
            zac_data: state?.zacData,
            datacode_data: state?.dataCodeData,
            kintone_data: state?.kitoneData
          })
        })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (typeof data.response === 'string') {
        const jsonMatch = data.response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const extractedJson = JSON.parse(jsonMatch[1]);
          setReportData(extractedJson);
          console.log('Report generated successfully:', extractedJson);
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateBotResponse = async (userMessage: string) => {
    try {
        const response = await fetch('https://agent-dev.test.studio.lyzr.ai/v3/inference/chat/', {
            method: 'POST',
            headers: {
                'x-api-key': 'sk-default-PPcvzcCe4cJRRP8JkEXnT51woYJUXzMZ',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: "pranav@lyzr.ai",
                agent_id: "67a6f5bf5554cc81102b9fd0",
                session_id: "67a6f5bf5554cc81102b9fd0",
                message: JSON.stringify({
                    user_message: userMessage, // Pass user message
                    zac_data: state?.zacData,
                    datacode_data: state?.dataCodeData,
                    kintone_data: state?.kitoneData
                })
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        console.log('Bot response:', data);

        return data?.response
    } catch (error) {
        console.error('Error generating bot response:', error);
        return "Error: Unable to generate bot response.";
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message to UI
    const userMessage: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsChatLoading(true);

    // Await bot response and display it in the UI
    const botResponseText = await simulateBotResponse(newMessage);

    const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: Date.now(),
    };

    setMessages(prev => [...prev, botMessage]);
    setIsChatLoading(false);
};


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(value);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-64' : 'w-16'} 
        bg-white shadow-lg transition-all duration-300
        flex flex-col
      `}>
        
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-4 hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        
        <button 
          onClick={() => setActiveTab('performance')}
          className={`
            flex items-center p-4 gap-3 transition-colors
            ${activeTab === 'performance' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}
          `}
        >
          <ChartBar className="w-6 h-6" />
          {isSidebarOpen && <span>Performance</span>}
        </button>
        
        <button 
          onClick={() => setActiveTab('chat')}
          className={`
            flex items-center p-4 gap-3 transition-colors
            ${activeTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}
          `}
        >
          
          <MessageSquare className="w-6 h-6" />
          {isSidebarOpen && <span>Chat</span>}
        </button>

        {/* <button 
          onClick={() => setActiveTab('chart')}
          className={`
            flex items-center p-4 gap-3 transition-colors
            ${activeTab === 'chart' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}
          `}
        >
          
          <ChartCandlestick className="w-6 h-6" />
          {isSidebarOpen && <span>Chart</span>}
        </button> */}
      </div>
      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === 'performance' ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-medium text-gray-800">Performance Report</h2>
              {reportData.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMonthlyView(!showMonthlyView)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ChartBar className="w-4 h-4" />
                    {showMonthlyView ? 'Hide Monthly View' : 'Show Monthly View'}
                  </button>
                  <button
                    onClick={downloadExcel}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              )}
            </div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-blue-600">Analyzing your files...</p>
              </div>
            ) : reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left text-sm font-medium text-gray-500">Customer</th>
                      <th className="py-4 px-4 text-left text-sm font-medium text-gray-500">Project</th>
                      <td className="py-4 px-4 text-sm text-gray-800">Project Code</td>
                      <th className="py-4 px-4 text-center text-sm font-medium text-gray-500">Rank</th>
                      {showMonthlyView && (
                        <>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Apr</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">May</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Jun</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Jul</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Aug</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Sep</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Oct</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Nov</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Dec</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Jan</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Feb</th>
                          <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Mar</th>
                        </>
                      )}
                      <th className="py-4 px-4 text-right text-sm font-medium text-gray-500">Net Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, index) => (
                      <tr 
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-gray-800">{item['Customer Name']}</td>
                        <td className="py-4 px-4 text-sm text-gray-800">{item['Project Name']}</td>
                        <td className="py-4 px-4 text-sm text-gray-800">{item['Project Code']}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                            ${item['Project Rank'] === 'SA' ? 'bg-blue-100 text-blue-700' :
                              item['Project Rank'] === 'A' ? 'bg-blue-100 text-blue-700' :
                              item['Project Rank'] === 'B' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'}
                          `}>
                            {item['Project Rank']}
                          </span>
                        </td>
                        {showMonthlyView && (
                          <>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['April'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['May'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['June'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['July'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['August'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['September'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['October'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['November'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['December'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['January'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['February'])}</td>
                            <td className="py-4 px-4 text-right text-sm text-gray-800">{formatCurrency(item['March'])}</td>
                          </>
                        )}
                        <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item['Net sales amount'])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <button
                onClick={generateReport}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Report
              </button>
            )}
          </div>
        ) : activeTab === 'chat' ? (
          <div className="bg-white rounded-lg p-8 shadow-lg h-[calc(90vh)]">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Chat Assistant</h2>
            <div className="flex flex-col h-[75vh]">
              <div className="flex-1 border border-gray-200 rounded-lg p-4 mb-4 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    Start a conversation with our AI assistant
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <ReactMarkdown className="text-sm">{message.text}</ReactMarkdown>
                          {message.sender === 'bot' && (
                            <button
                              onClick={() => downloadMessageAsDoc(message.text)}
                              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                            >
                              <Download className="w-4 h-4" />
                              Download as DOCX
                            </button>
                          )}
                        </div>
                       
                      </div>
                    ))}
                  </div>
                )}
                {isChatLoading && (
                  <div className="flex justify-start mt-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 border-gray-200"
                  disabled={isChatLoading}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ): activeTab === 'chart' ? (
          <div>
            <ChartViewer/>
          </div>
        ):null}
      </div>
    </div>
  );
};
export default ProcessFiles;