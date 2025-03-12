import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, ChartBar, Menu, Download, Send, Zap, FileSpreadsheet, ChevronRight, ChevronLeft, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
import ReactMarkdown from "react-markdown";
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun } from 'docx';
// import { ChartViewer } from './components/ChartViewer';
import logo from './assets/main logo.png';
import Index from './Index';
import ComparisonReport from "./components/ComparisonReport";
import ReportNameModal from './components/ReportNameModal';
import LatestUploadsInfo from './components/LatestUploadsInfo';


type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  jsonData?: any;
  // votes: {
  //   upvotes: number;
  //   downvotes: number;
  // };
  // comments: {
  //   id: string;
  //   text: string;
  //   timestamp: number;
  // }[];
  // showCommentInput?: boolean;
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

type ReportEntry = {
  id: string;
  uid: string;
  month: string;
  year:string;
  data: ReportData[];
  timestamp: number;
  isCollapsed: boolean;
  name: string; // Add this to store the report name
};

const ProcessFiles = () => {
  const [activeTab, setActiveTab] = useState<
    | "performance"
    | "chat"
    | "chart"
    | "data-validation"
    | "upload"
    | "comparison"
  >("performance");  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  // const [reportData, setReportData] = useState<ReportData[]>([]);
  // const [showMonthlyView, setShowMonthlyView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [kintoneValidation, setKintoneValidation] = useState('');
  const [zacValidation, setZacValidation] = useState('');
  // const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [previousReports, setPreviousReports] = useState<ReportEntry[]>([]);
  const [sessionID, setSessionID] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(name: string) => void>(() => () => null);
  const [actionDescription, setActionDescription] = useState<'generate' | 'regenerate'>('generate');

  useEffect(() => {
    setSessionID(Date.now().toString()); // Generate a unique sessionID
  }, []);
  

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


  const formatHeader = (key: string) => {
    return key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
      }).format(value);
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return value?.toString() || '-';
  };

  const downloadExcel = (reportData: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `report-${Date.now()}.xlsx`);
  };

  const handleDataValidation = async () => {
    console.log("printing ")
    setIsValidating(true);
    const response = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/latest_uploads');
    if (!response.ok) {
      throw new Error('Failed to fetch latest uploads');
    }
    const data = await response.json();
    console.log("data",data);
    try {
      // Validate Kintone Data
      const kintoneResponse = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'x-api-key': 'sk-default-8roIgovhvCvAZtXXi4ZdosCHmnTt0LiF',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: "pranav@lyzr.ai",
          agent_id: "67c6a7490606a0f240482d8c",
          session_id: sessionID,
          message: JSON.stringify({ kintone_data: data.crm.data })
        })
      });
  
      // Validate ZAC Data
      const zacResponse = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'x-api-key': 'sk-default-8roIgovhvCvAZtXXi4ZdosCHmnTt0LiF',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: "pranav@lyzr.ai",
          agent_id: "67c6a7750606a0f240482d8d",
          session_id: sessionID,
          message: JSON.stringify({ zac_data: data.erp.data })
        })
      });
  
      const kintoneData = await kintoneResponse.json();
      const zacData = await zacResponse.json();
  
      setKintoneValidation(kintoneData.response);
      setZacValidation(zacData.response);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };


  // const downloadPDF = () => {
  //   const doc = new jsPDF();
  //   const tableColumn = showMonthlyView 
  //     ? ['Customer', 'Project', 'Rank', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Net Sales']
  //     : ['Customer', 'Project', 'Rank', 'Net Sales'];
    
  //   const tableRows = reportData.map(item => showMonthlyView 
  //     ? [
  //         item['Customer Name'],
  //         item['Project Name'],
  //         item['Project Rank'],
  //         item['April'].toLocaleString(),
  //         item['May'].toLocaleString(),
  //         item['June'].toLocaleString(),
  //         item['July'].toLocaleString(),
  //         item['August'].toLocaleString(),
  //         item['September'].toLocaleString(),
  //         item['October'].toLocaleString(),
  //         item['November'].toLocaleString(),
  //         item['December'].toLocaleString(),
  //         item['January'].toLocaleString(),
  //         item['February'].toLocaleString(),
  //         item['March'].toLocaleString(),
  //         item['Net sales amount'].toLocaleString()
  //       ]
  //     : [
  //         item['Customer Name'],
  //         item['Project Name'],
  //         item['Project Rank'],
  //         item['Net sales amount'].toLocaleString()
  //       ]
  //   );

  //   (doc as any).autoTable({
  //     head: [tableColumn],
  //     body: tableRows,
  //     startY: 20,
  //     theme: 'grid',
  //     styles: { fontSize: 8 },
  //     headStyles: { fillColor: [102, 16, 242] }
  //   });

  //   doc.save('report.pdf');
  // };

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
  
  const handleModalSubmit = (name: string) => {
    if (pendingAction && name.trim()) {
      pendingAction(name); // Execute the stored action with the report name
    }
    setIsModalOpen(false);
    setPendingAction(() => () => null); // Reset to a no-op function
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchLatestReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://dolbix-dev.test.studio.lyzr.ai/api/latest_report");
      if (!response.ok) throw new Error("Failed to fetch report");
  
      const data = await response.json();
  
      setPreviousReports((prev) => [
        {
          id: data.report_id.toString(),
          uid: `report-${data.report_id}-${Date.now()}`,
          data: data.report_snapshot,
          timestamp: new Date(data.generated_at).getTime(),
          isCollapsed: false,
          name: data.name || "Unnamed Report", // Use the name from the API, fallback to default
          month: data.month,
          year: data.year,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateReport = async (reportName: string) => {
    setIsLoading(true);
    try {
      const chatHistory = messages
        .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
        .join("\n");
      const latestReport = previousReports[0]?.data || [];
  
      // const response = await fetch("https://dolbix-dev.test.studio.lyzr.ai/api/chat", {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatHistory + JSON.stringify(latestReport),
          session_id: sessionID,
          name: reportName, // Pass the report name to the API
        }),
      });
  
      if (!response.ok) throw new Error("Failed to regenerate report");
  
      const data = await response.json();
  
      setPreviousReports((prev) => [
        {
          id: `report-${Date.now()}`,
          uid: `report-${data.report_id}-${Date.now()}`,
          data: data.report_data,
          timestamp: Date.now(),
          isCollapsed: false,
          name: reportName, // Store the name provided by the user
          month:data.month,
          year:data.year
        },
        ...prev,
      ]);
  
      const systemMessage: Message = {
        id: Date.now().toString(),
        text: `Successfully regenerated report "${reportName}" based on chat history`,
        sender: "bot",
        timestamp: Date.now(),
        jsonData: data.report_data,
      };
  
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Regeneration error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Failed to regenerate report. Please try again.",
        sender: "bot",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReportCollapse = (reportUid: string) => {
    setPreviousReports(prev => 
      prev.map(report => 
        report.uid === reportUid 
          ? {...report, isCollapsed: !report.isCollapsed} 
          : report
      )
    );
  };

  // const downloadChatAsDocx = (messages: Message[]) => {
  //   const doc = new Document({
  //     sections: [
  //       {
  //         properties: {},
  //         children: messages.map(message => new Paragraph({
  //           children: [
  //             new TextRun({
  //               text: `${message.sender === 'user' ? 'You: ' : 'Bot: '}${message.text}`,
  //               bold: message.sender === 'user',
  //             }),
  //           ],
  //         })),
  //       },
  //     ],
  //   });
  
  //   Packer.toBlob(doc).then(blob => {
  //     const link = document.createElement('a');
  //     link.href = URL.createObjectURL(blob);
  //     link.download = 'chat_history.docx';
  //     link.click();
  //     URL.revokeObjectURL(link.href);
  //   });
  // };

  const generateNewReport = async (reportName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://dolbix-dev.test.studio.lyzr.ai/api/generate_latest_report?name=${encodeURIComponent(reportName)}`,
        {
          method: "POST",  // ✅ Use POST instead of the default GET
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // ✅ Ensure the request body is not missing
        }
      );
  
      if (!response.ok) throw new Error("Failed to generate report");
  
      const data = await response.json();
  
      setPreviousReports((prev) => [
        {
          id: data.report_id.toString(),
          uid: `report-${data.report_id}-${Date.now()}`,
          data: data.report_snapshot,
          timestamp: new Date(data.generated_at).getTime(),
          isCollapsed: false,
          name: reportName, // Store the name provided by the user
          month: data.month,
          year: data.year,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const simulateBotResponse = async (userMessage: string) => {
    try {
      // Call the first agent
      console.log("Previous Reports",previousReports[0]);
      const firstAgentResponse = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'x-api-key': 'sk-default-8roIgovhvCvAZtXXi4ZdosCHmnTt0LiF',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: "pranav@lyzr.ai",
          agent_id: "67c6a8578cfac3392e3a5ca5",
          session_id: sessionID,
          message: JSON.stringify({
            user_message: userMessage, // Pass user message
            previous_reports: previousReports[0]
          })
        })
      });
  
      if (!firstAgentResponse.ok) {
        throw new Error('Network response was not ok');
      }
  
      const firstAgentData = await firstAgentResponse.json();
  
      // Call the second agent
      // const secondAgentResponse = await fetch('https://agent-dev.test.studio.lyzr.ai/v3/inference/chat/', {
      //   method: 'POST',
      //   headers: {
      //     'x-api-key': 'sk-default-PPcvzcCe4cJRRP8JkEXnT51woYJUXzMZ',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     user_id: "pranav@lyzr.ai",
      //     agent_id: "67b0a7473d26ba77bea966fc",
      //     session_id: sessionID,
      //     message: JSON.stringify({
      //       user_message: `Condition for generating Report ${userMessage}`, 
      //       zac_data: state?.zacData,
      //       datacode_data: state?.dataCodeData,
      //       kintone_data: state?.kitoneData
      //     })
      //   })
      // });
  
      // if (!secondAgentResponse.ok) {
      //   throw new Error('Network response was not ok');
      // }
  
      // const secondAgentData = await secondAgentResponse.json();
  
      // Return both responses
      return {
        textResponse: firstAgentData?.response, // Text response from the first API
        jsonResponse: '' // JSON response from the second API
      };
  
    } catch (error) {
      console.error('Error generating bot response:', error);
      return {
        textResponse: "Error: Unable to generate bot response.",
        jsonResponse: null
      };
    }
  };

  // const handleVote = (messageId: string, voteType: 'up' | 'down') => {
  //   setMessages(prev => prev.map(message => {
  //     if (message.id === messageId) {
  //       return {
  //         ...message,
  //         votes: {
  //           ...message.votes,
  //           upvotes: voteType === 'up' ? message.votes.upvotes + 1 : message.votes.upvotes,
  //           downvotes: voteType === 'down' ? message.votes.downvotes + 1 : message.votes.downvotes
  //         }
  //       };
  //     }
  //     return message;
  //   }));
  // };

  // const toggleCommentInput = (messageId: string) => {
  //   setMessages(prev => prev.map(message => {
  //     if (message.id === messageId) {
  //       return {
  //         ...message,
  //         showCommentInput: !message.showCommentInput
  //       };
  //     }
  //     return message;
  //   }));
  // };

  // const addComment = (messageId: string) => {
  //   if (!newComment[messageId]?.trim()) return;

  //   setMessages(prev => prev.map(message => {
  //     if (message.id === messageId) {
  //       return {
  //         ...message,
  //         comments: [
  //           ...message.comments,
  //           {
  //             id: Date.now().toString(),
  //             text: newComment[messageId],
  //             timestamp: Date.now()
  //           }
  //         ],
  //         showCommentInput: false
  //       };
  //     }
  //     return message;
  //   }));

  //   setNewComment(prev => ({
  //     ...prev,
  //     [messageId]: ''
  //   }));
  // };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: Date.now(),
      // votes: { upvotes: 0, downvotes: 0 },
      // comments: []
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsChatLoading(true);
  
    // Await bot response
    const botResponses = await simulateBotResponse(newMessage);
  
    // Add bot message with text and JSON data
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponses.textResponse,
      sender: 'bot',
      timestamp: Date.now(),
      jsonData: botResponses.jsonResponse,
      // votes: { upvotes: 0, downvotes: 0 },
      // comments: []
    };
  
    setMessages(prev => [...prev, botMessage]);
    setIsChatLoading(false);
  };

  // const downloadExcelFromJson = (jsonData: any) => {
  //   console.log('Input data:', jsonData);
  //   let extractedJson = jsonData;

  //   // Handle string input (JSON in markdown format)
  //   if (typeof jsonData === 'string') {
  //       const jsonMatch = jsonData.match(/```json\n([\s\S]*?)\n```/);
  //       if (jsonMatch) {
  //         const extractedJson = JSON.parse(jsonMatch[1]);
          
  //         setPreviousReports(prev => [{
  //           id: `excel-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  //           uid: `excel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add UID
  //           data: extractedJson,
  //           timestamp: Date.now(),
  //           isCollapsed: false,
  //           name: "Report",
  //           month: "dd",
  //           year: "dd"
  //         }, ...prev]);

  //       } else {
  //           console.error("JSON parsing failed. Invalid format.");
  //           return;
  //       }
  //   }

  //   // Function to recursively search for the first array in the object
  //   const findFirstArray = (obj: any): any[] | null => {
  //       if (Array.isArray(obj)) {
  //           return obj;
  //       }
        
  //       if (typeof obj === 'object' && obj !== null) {
  //           for (const value of Object.values(obj)) {
  //               const result = findFirstArray(value);
  //               if (result) {
  //                   return result;
  //               }
  //           }
  //       }
        
  //       return null;
  //   };

  //   // Extract the array from the data structure
  //   let dataArray: any[] = [];
    
  //   if (Array.isArray(extractedJson)) {
  //       dataArray = extractedJson;
  //   } else if (typeof extractedJson === 'object' && extractedJson !== null) {
  //       const foundArray = findFirstArray(extractedJson);
  //       if (foundArray) {
  //           dataArray = foundArray;
  //       } else {
  //           console.error("No array found in the data structure:", extractedJson);
  //           return;
  //       }
  //   } else {
  //       console.error("Invalid data structure:", extractedJson);
  //       return;
  //   }

  //   if (dataArray.length === 0) {
  //       console.error("No data to export");
  //       return;
  //   }

  //   // Generate Excel file
  //   try {
  //       const worksheet = XLSX.utils.json_to_sheet(dataArray);
  //       const workbook = XLSX.utils.book_new();
  //       XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  //       XLSX.writeFile(workbook, 'report.xlsx');
  //       console.log('Report generated successfully:', dataArray);
  //   } catch (error) {
  //       console.error("Excel generation failed:", error);
  //   }
  // };





  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('ja-JP', {
  //     style: 'currency',
  //     currency: 'JPY'
  //   }).format(value);
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV BAR */}
      <div className="bg-white shadow-sm px-2 py-4 border-b border-gray-200 fixed top-0 left-0 w-full ">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logo}
              alt="Lyzr Icon" 
              className="h-12 w-auto pr-2 border-r border-r-[#9d9d9d]"
            />
            <div className="items-baseline space-x-1">
              <h1 className="text-l font-bold text-gray-900">
                Dolbix Performance 
              </h1> 
              <h1 className="text-2xl -mt-2 font-bold text-purple-500">
                Report Agent
              </h1>
            </div>
          </div>
          
          {/* <div className="relative group ">
            <Info className="h-5 w-5 text-gray-500 cursor-help" />
            <div className="absolute z-999 right-0 w-72 px-4 py-3 mt-2 bg-gray-50 border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-sm text-gray-600">
              <p className="font-medium mb-2">How It Works:</p>
              <ul className="space-y-2">
                
              </ul>
            </div>
          </div> */}
        </div>
      </div>
      {/* SIDEBAR */}
      <div className='flex'>        
        <div className={`fixed h-screen mt-20 bg-white border-r border-t border-gray-200 transition-all duration-300 flex flex-col top-0 left-0 z-30 ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className={`font-semibold truncate ${!isSidebarOpen && "hidden"}`}>
              Performance Report
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-2">
            <button 
                onClick={() => setActiveTab('performance')}
                className={`w-full flex items-center gap-3 p-2 text-sm font-medium ${
                  activeTab === 'performance' ? 'bg-gray-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                } rounded-lg`}
              >
                <ChartBar className="w-5 h-5" />
                {isSidebarOpen && <span>Performance</span>}
              </button>
              <button 
                onClick={() => setActiveTab('data-validation')}
                className={`w-full flex items-center gap-3 p-2 text-sm font-medium ${
                  activeTab === 'data-validation' ? 'bg-gray-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                } rounded-lg`}
              >
                <CheckCircle className="w-5 h-5" />
                {isSidebarOpen && <span>Data Validation</span>}
              </button>
              
              {/* <button 
                onClick={() => setActiveTab('chart')}
                className={`w-full flex items-center gap-3 p-2 text-sm font-medium ${
                  activeTab === 'chart' ? 'bg-gray-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                } rounded-lg`}
              >
                <ChartCandlestick className="w-5 h-5" />
                {isSidebarOpen && <span>Chart</span>}
              </button> */}

              <button 
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center gap-3 p-2 text-sm font-medium ${
                  activeTab === 'upload' ? 'bg-gray-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                } rounded-lg`}
              >
                <Upload  className="w-5 h-5" />
                {isSidebarOpen && <span>Upload</span>}
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={`w-full flex items-center gap-3 p-2 text-sm font-medium ${
                  activeTab === "comparison"
                    ? "bg-gray-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                } rounded-lg`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                {isSidebarOpen && <span>Comparison Report</span>}
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className={`flex-1 p-8 pt-25 ${isSidebarOpen ? "ml-60" : "ml-15"}`}>
          {activeTab === 'data-validation' ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-medium text-gray-800 ">Data Validation</h2>
              <LatestUploadsInfo />
              <br /><br />
              <div className="space-y-6">
                <button
                  onClick={handleDataValidation}
                  disabled={isValidating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isValidating ? 'Validating Data...' : 'Validate Data Sources'}
                </button>

                {(kintoneValidation || zacValidation) && (
                  <div className="space-y-6">
                    {kintoneValidation && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">Kintone Data Validation</h3>
                        <ReactMarkdown className="prose text-sm">
                          {kintoneValidation}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {zacValidation && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">ZAC Data Validation</h3>
                        <ReactMarkdown className="prose text-sm">
                          {zacValidation}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'performance' ? (
            <div className={` ${
              isChatOpen ? "mr-75" : ""
            } ${
              isSidebarOpen ? "ml-65" : "ml-15"
            }`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-medium text-gray-800">Performance Reports</h2>
                  <LatestUploadsInfo />
                </div>

                <div>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  >
                    {isLoading ? "Processing..." : "Report Actions"}
                    <ChevronDown className="ml-2 w-5 h-5" />
                  </button>

                  {isOpen && (
                    <div className="absolute mt-2 w-48 bg-white shadow-lg rounded-lg border">
                      <button
                        onClick={() => {
                          fetchLatestReport();
                          setIsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                      >
                        {isLoading ? "Fetching..." : "Fetch Latest Report"}
                      </button>
                      <button
                        onClick={() => {
                          setPendingAction(() => (name: string) => generateNewReport(name));
                          setActionDescription("generate");
                          setIsModalOpen(true);
                          setIsOpen(false); // Close the dropdown
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                      >
                        {isLoading ? "Generating..." : "Generate Report"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {previousReports.length > 0 ? (
                <div className="space-y-8">
                  {previousReports.map((report) => (
                    <div key={report.uid}  className="bg-white rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-500">
                           {report.name} - {report.month} / {report.year}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(report.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => downloadExcel(report.data)}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => setIsChatOpen(true)}
                            className="p-2 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                          >
                            <Zap className="w-5 h-5 text-gray-600" />
                            <span className="text-sm text-gray-700">Improve with AI</span>
                          </button>
                          <button
                            onClick={() => toggleReportCollapse(report.uid)}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            {report.isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {!report.isCollapsed && report.data.length > 0 && (
                        <div className="relative h-[500px]"> {/* Fixed height container */}
                          <div className="absolute inset-0 overflow-auto border border-gray-200 rounded-lg">
                            <table className="w-full relative">
                              <thead>
                                <tr className="sticky top-0 z-20 bg-white border-b border-gray-200">
                                  {Object.keys(report.data[0]).map((key, colIndex) => (
                                    <th 
                                      key={key}
                                      className={`py-4 px-4 text-left text-sm font-medium text-gray-500 ${
                                        colIndex === 0 ? 'sticky left-0 z-30 bg-white min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : 'min-w-[160px]'
                                      }`}
                                    >
                                      {formatHeader(key)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {report.data.map((item, rowIndex) => (
                                  <tr 
                                    key={`${report.id}-${rowIndex}-${item['Project Code']}`} 
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                  >
                                    {Object.entries(item).map(([_key, value], colIndex) => (
                                      <td 
                                        key={`${report.id}-${rowIndex}-${colIndex}`} 
                                        className={`py-4 px-4 text-sm text-gray-800 ${
                                          colIndex === 0 ? 'sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                                        }`}
                                      >
                                        <span 
                                          title={String(value)} 
                                          className="cursor-help border-b border-dashed border-gray-300"
                                        >
                                          {String(value).length > 10 ? 
                                            `${String(value).substring(0, 5)}...` : 
                                            formatValue(value)
                                          }
                                        </span>
                                      </td> 
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <div className="max-w-md mx-auto">
                    <div className="bg-purple-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <ChartBar className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">Generate Your First Report</h3>
                    <p className="text-gray-500 mb-6">
                      Click the button above to analyze your data and generate a comprehensive performance report.
                    </p>
                  </div>
                </div>
              )}
            </div>
          // ) : activeTab === 'chart' ? (
          //   <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          //     <ChartViewer />
          //   </div>
            ) : activeTab === 'upload' ? (
            <div className="">
              <Index />
            </div>
          ) : activeTab === 'comparison' ? (
            <ComparisonReport />
          ) : null}

          {/* Chat panel */}
          {activeTab === 'performance' && isChatOpen && (
            <div className={`fixed top-0 right-0 h-screen bg-white border-l border-t border-gray-200 transition-all duration-300 shadow-lg z-20 mt-20 pb-20 ${
              isChatOpen ? "w-75" : ""
            }`}>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-l-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                {isChatOpen ? (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {isChatOpen && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold">Improve with AI</h2>
                  </div>
                
                  <div className="flex-1 overflow-y-auto p-4">
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
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.sender === 'user'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <ReactMarkdown className="text-sm">{message.text}</ReactMarkdown>
                              {/* {message.jsonData && (
                                <div className="mt-2 text-xs text-gray-500">
                                  {JSON.stringify(message.jsonData, null, 2)}
                                </div>
                              )} */}
                              
                              
                                
                                {message.sender === 'bot' && (
                                  <div className={`flex items-center gap-3 mt-3 pt-3 border-t border-gray-200`}>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => downloadMessageAsDoc(message.text)}
                                      className="flex items-center gap-1 text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                    >
                                      <Download className="w-3 h-3" />
                                      DOCX
                                    </button>
                                    {/* {message.jsonData && (
                                      <button
                                        onClick={() => downloadExcelFromJson(message.jsonData)}
                                        className="flex items-center gap-1 text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                      >
                                        <Download className="w-3 h-3" />
                                        Excel
                                      </button>
                                    )} */}
                                  </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg p-3">
                              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                
                  <div className="p-4 border-t border-gray-200 mt-8">
                    <div className="relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 border-gray-200"
                        disabled={isChatLoading}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={isChatLoading || !newMessage.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setActionDescription("regenerate");
                        setPendingAction(() => (name: string) => regenerateReport(name));
                        setIsModalOpen(true);
                      }}
                      className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Regenerate Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ReportNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        action={actionDescription}
      />
    </div>
  );
};
export default ProcessFiles;