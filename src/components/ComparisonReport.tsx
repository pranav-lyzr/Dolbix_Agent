import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatMessage, { MessageType } from "./ChatMessage";
import { compareReports } from "../services/ApiServices";

// type UploadData = {
//   upload_id: number;
//   file_name: string;
//   timestamp: string;
// };

type ReportData = {
  report_id: number;
  upload_id: number;
  generated_at: string;
  name?: string;
  month: string;
  year: string;
};

type ReportDetails = {
  "Parent Code": string;
  "Customer Name": string;
  "Project Name": string;
  "Project Rank": string;
  "Project Code": string;
  April: number;
  May: number;
  June: number;
  July: number;
  August: number;
  September: number;
  October: number;
  November: number;
  December: number;
  January: number;
  February: number;
  March: number;
  "Net sales amount"?: number;
};

// Define a union type for the month names
type Month = 
  | 'January' 
  | 'February' 
  | 'March' 
  | 'April' 
  | 'May' 
  | 'June' 
  | 'July' 
  | 'August' 
  | 'September' 
  | 'October' 
  | 'November' 
  | 'December';

const ComparisonReport = () => {
  const [selectedValues, setSelectedValues] = useState<{
    crm1: string;
    crm2: string;
    erp1: string;
    erp2: string;
    datacode1: string;
    datacode2: string;
    report1: string;
    report2: string;
  }>({
    crm1: "",
    crm2: "",
    erp1: "",
    erp2: "",
    datacode1: "",
    datacode2: "",
    report1: "",
    report2: "",
  });
  // const [selectedType, setSelectedType] = useState<'crm' | 'erp' | 'datacode' | 'report'>('report');
  const selectedType = 'report';
  const [uploadData, setUploadData] = useState<{
    reports: ReportData[];
  }>({
    reports: [],
  });

  const [reportDetails, setReportDetails] = useState<{
    report1: ReportDetails[];
    report2: ReportDetails[];
  }>({
    report1: [],
    report2: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState({
    report1: false,
    report2: false,
    chat: false,
  });
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState("");
  // const [currentComparisonId, setCurrentComparisonId] = useState<number | null>(null);
  // const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistory[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const monthOrder: Record<Month, number> = {
    'January': 1,
    'February': 2,
    'March': 3,
    'April': 4,
    'May': 5,
    'June': 6,
    'July': 7,
    'August': 8,
    'September': 9,
    'October': 10,
    'November': 11,
    'December': 12,
  };
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Generate a session ID when the component mounts
    setSessionId(uuidv4());
    
    const fetchData = async () => {
      try {
        const [reportsRes] = await Promise.all([
          // fetch("http://localhost:5000/api/uploads/crm"),
          // fetch("http://localhost:5000/api/uploads/erp"),
          // fetch("http://localhost:5000/api/uploads/datacode"),
          fetch("https://dolbix-dev.test.studio.lyzr.ai/api/reports"),
        ]);

        const [ reports] = await Promise.all([

          reportsRes.json(),
        ]);
        console.log("Reports",reports);
        setUploadData({ reports });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // fetchComparisonHistory();
  }, []);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchReport = async (reportId: string, reportKey: 'report1' | 'report2') => {
      if (!reportId) return;
      
      try {
        const response = await fetch(`https://dolbix-dev.test.studio.lyzr.ai/api/report/${reportId}`);
        if (!response.ok) throw new Error('Failed to fetch report');
        const data = await response.json();
        
        // Ensure we always get an array, even if the response structure changes
        const snapshot = data.report_snapshot || data || [];
        
        setReportDetails(prev => ({
          ...prev,
          [reportKey]: Array.isArray(snapshot) ? snapshot : []
        }));
      } catch (error) {
        console.error(`Error fetching ${reportKey}:`, error);
        setReportDetails(prev => ({
          ...prev,
          [reportKey]: []
        }));
      }
    };

    // Fetch both reports when their IDs change
    fetchReport(selectedValues.report1, 'report1');
    fetchReport(selectedValues.report2, 'report2');
  }, [selectedValues.report1, selectedValues.report2]);

  // const fetchComparisonHistory = async () => {
  //   try {
  //     const data = await getComparisonHistory();
  //     setComparisonHistory(data);
  //   } catch (error) {
  //     console.error("Error fetching comparison history:", error);
  //   }
  // };

  const isGenerateDisabled = () => {
    // Only require the selected type's fields
    switch (selectedType) {
      // case 'crm': return !selectedValues.crm1 || !selectedValues.crm2;
      // case 'erp': return !selectedValues.erp1 || !selectedValues.erp2;
      // case 'datacode': return !selectedValues.datacode1 || !selectedValues.datacode2;
      case 'report': return !selectedValues.report1 || !selectedValues.report2;
      default: return true;
    }
  };

  const handleChange = (field: keyof typeof selectedValues, value: string) => {
    setSelectedValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateComparison = async () => {
    setIsLoading(true);
    try {
      const [reportResponse1, reportResponse2] = await Promise.all([
        fetch(`https://dolbix-dev.test.studio.lyzr.ai/api/report/${selectedValues.report1}`).then((res) => res.json()),
        fetch(`https://dolbix-dev.test.studio.lyzr.ai/api/report/${selectedValues.report2}`).then((res) => res.json()),
      ]);
  
      const reportSnapshot1 = reportResponse1.report_snapshot || [];
      const reportSnapshot2 = reportResponse2.report_snapshot || [];
  
      setReportDetails({ report1: reportSnapshot1, report2: reportSnapshot2 });
      setChatActive(true);
  
      const initialQuery = "Compare the reports and highlight the key differences.";
      const newUserMessage: MessageType = {
        id: uuidv4(),
        content: initialQuery,
        sender: "user",
        timestamp: new Date(),
      };
  
      setMessages([newUserMessage]);
      setIsLoadingChat(true);
  
      // Direct LYZR API call
      const response = await compareReports(
        selectedValues.report1,
        selectedValues.report2,
        initialQuery,
        sessionId,
        reportSnapshot1,
        reportSnapshot2
      );

      console.log("response",response);
  
      const newAiMessage: MessageType = {
        id: uuidv4(),
        content: response.response || "No significant differences found.",
        sender: "ai",
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Error generating comparison:", error);
      const errorMessage: MessageType = {
        id: uuidv4(),
        content: "Failed to generate comparison. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsLoadingChat(false);
    }
  };
  
  // Update handleSendMessage
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
  
    const newUserMessage: MessageType = {
      id: uuidv4(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
  
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsLoadingChat(true);
  
    try {
      const response = await compareReports(
        selectedValues.report1,
        selectedValues.report2,
        inputValue,
        sessionId,
        reportDetails.report1,
        reportDetails.report2
      );
      console.log("reponse 2",response);
      const newAiMessage: MessageType = {
        id: uuidv4(),
        content: response.response || "I couldn't find meaningful differences.",
        sender: "ai",
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: MessageType = {
        id: uuidv4(),
        content: "Error processing request. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const groupedReports = useMemo(() => {
    const reports = uploadData.reports;
    if (!reports || reports.length === 0) return [];
  
    // Group reports by month-year while preserving all entries
    const groups = reports.reduce((acc, report) => {
      const key = `${report.year}-${report.month}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(report);
      return acc;
    }, {} as Record<string, ReportData[]>);
  
    // Process groups and sort internal reports
    return Object.entries(groups)
      .map(([key, reports]) => ({
        key,
        month: reports[0].month,
        year: reports[0].year,
        reports: [...reports].sort((a, b) => 
          new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
        )
      }))
      .sort((a, b) => {
        const yearDiff = parseInt(b.year) - parseInt(a.year);
        return yearDiff !== 0 ? yearDiff : 
          monthOrder[b.month as Month] - monthOrder[a.month as Month];
      });
  }, [uploadData.reports]);

  



  // const loadComparisonChat = (comparison: ComparisonHistory) => {
  //   // Set the current comparison context
  //   setCurrentComparisonId(comparison.comparison_id);
  //   setSelectedValues(prev => ({
  //     ...prev,
  //     report1: comparison.old_report_id.toString() || 'NA',
  //     report2: comparison.new_report_id.toString() || 'NA'
  //   }));
    
  //   // Create messages from this comparison
  //   const newMessages: MessageType[] = [
  //     {
  //       id: uuidv4(),
  //       content: comparison.query,
  //       sender: "user",
  //       timestamp: new Date(comparison.created_at),
  //     },
  //     {
  //       id: uuidv4(),
  //       content: comparison.response,
  //       sender: "ai",
  //       timestamp: new Date(comparison.created_at),
  //     }
  //   ];
    
  //   setMessages(newMessages);
  //   setChatActive(true);
  // };

  const toggleCollapse = (section: "report1" | "report2" | "chat") => {
    setIsCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // const startNewChat = () => {
  //   setMessages([]);
  //   setCurrentComparisonId(null);
  // };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-2xl font-medium text-gray-800 mb-6">
        Report Comparison Chat
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Report selection and history */}
        <div className="lg:col-span-1 space-y-6">
          {/* Type selector dropdown */}
          {/* <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comparison Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="crm">CRM</option>
              <option value="erp">ERP</option>
              <option value="datacode">Datacode</option>
              <option value="report">Report</option>
            </select>
          </div> */}

          {/* {selectedType === 'crm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CRM Upload 1
                  </label>
                  <select
                    value={selectedValues.crm1}
                    onChange={(e) => handleChange("crm1", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select CRM Upload</option>
                    {uploadData.crm.map((item) => (
                      <option key={item.upload_id} value={item.upload_id}>
                        {formatTimestamp(item.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CRM Upload 2
                  </label>
                  <select
                    value={selectedValues.crm2}
                    onChange={(e) => handleChange("crm2", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select CRM Upload</option>
                    {uploadData.crm.map((item) => (
                      <option key={item.upload_id} value={item.upload_id}>
                        {formatTimestamp(item.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )} */}

          {/* {selectedType === 'erp' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ERP Upload 1
                  </label>
                  <select
                    value={selectedValues.erp1}
                    onChange={(e) => handleChange("erp1", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select ERP Upload</option>
                    {uploadData.erp.map((item) => (
                      <option key={item.upload_id} value={item.upload_id}>
                        {formatTimestamp(item.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ERP Upload 2
                  </label>
                  <select
                    value={selectedValues.erp2}
                    onChange={(e) => handleChange("erp2", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select ERP Upload</option>
                    {uploadData.erp.map((item) => (
                      <option key={item.upload_id} value={item.upload_id}>
                        {formatTimestamp(item.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )} */}

          {/* {selectedType === 'datacode' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datacode Upload 1
                  </label>
                  <select
                    value={selectedValues.datacode1}
                    onChange={(e) => handleChange("datacode1", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select Datacode Upload</option>
                    {uploadData.datacode.map((item) => (
                      <option key={item.upload_id} value={item.upload_id}>
                        {formatTimestamp(item.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datacode Upload 2
                  </label>
                  <select
                    value={selectedValues.datacode2}
                    onChange={(e) => handleChange("datacode2", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select Datacode Upload</option>
                    {uploadData.datacode.map((item) => (
                      <option key={item.upload_id} value={item.upload_id}>
                        {formatTimestamp(item.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )} */}

          {/* Always show report selects */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Report
                </label>
                <select
                  value={selectedValues.report2}
                  onChange={(e) => handleChange("report2", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Select Report</option>
                  {groupedReports.map((group) => (
                    <optgroup 
                      key={group.key} 
                      label={`${group.month} ${group.year}`}
                    >
                      {group.reports.map((report) => (
                        <option 
                          key={report.report_id} 
                          value={report.report_id}
                        >
                          {report.name || 'Unnamed Report'} - {formatTimestamp(report.generated_at)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Report
                </label>
                {/* <select
                  value={selectedValues.report1}
                  onChange={(e) => handleChange("report1", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Select Report</option>
                  {uploadData.reports.map((item) => (
                    <option key={item.report_id} value={item.report_id}>
                      {item.name ? item.name : ""} <span className="ml-5 ">{item.generated_at ? formatTimestamp(item.generated_at) : "N/A"}</span> 
                    </option>
                  ))}
                </select> */}
                <select
                  value={selectedValues.report1}
                  onChange={(e) => handleChange("report1", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Select Report</option>
                  {groupedReports.map((group) => (
                    <optgroup 
                      key={group.key} 
                      label={`${group.month} ${group.year}`}
                    >
                      {group.reports.map((report) => (
                        <option 
                          key={report.report_id} 
                          value={report.report_id}
                        >
                          {report.name || 'Unnamed Report'} - {formatTimestamp(report.generated_at)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateComparison}
            disabled={isGenerateDisabled() || isLoading}
            className="w-full mt-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate Comparison"}
          </button>

          {/* Chat History Section
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Previous Comparisons</h3>
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              {comparisonHistory.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {comparisonHistory.map((comparison) => (
                    <li
                      key={comparison.comparison_id}
                      onClick={() => loadComparisonChat(comparison)}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-sm truncate">{comparison.query}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {comparison.created_at ? new Date(comparison.created_at).toLocaleString() : "N/A"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-gray-500 text-sm">No comparison history</p>
              )}
            </div> 
            {messages.length > 0 && (
              <button
                onClick={startNewChat}
                className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm"
              >
                Start New Chat
              </button>
            )}
          </div> */}
        </div>

        {/* Right side - Report tables and chat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Interface */}
          {chatActive && (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-lg font-medium">Report Comparison Chat</h3>
                <button
                  onClick={() => toggleCollapse("chat")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {isCollapsed.chat ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>

              {!isCollapsed.chat && (
                <>
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 p-4 overflow-y-auto"
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <p className="text-center mb-2">Ask a question about the comparison</p>
                        <p className="text-center text-sm">Example: "What are the key differences between these reports?"</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                      ))
                    )}
                    {isLoadingChat && (
                      <div className="flex justify-start mb-3">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%]">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "600ms" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t p-3">
                    <div className="flex items-center">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about differences between reports..."
                        className="flex-1 border border-gray-200 rounded-l-lg p-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        rows={1}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoadingChat}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-r-lg disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Report Tables */}
          {(reportDetails.report1.length > 0 || reportDetails.report2.length > 0) && (
            <div className="space-y-6">
              {/* Report 1 Table */}
              

              {/* Report 2 Table */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Base Report</h3>
                  <button
                    onClick={() => toggleCollapse("report2")}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {isCollapsed.report2 ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {!isCollapsed.report2 && reportDetails.report2.length > 0 && (
                  <div className="relative h-[300px]">
                    <div className="absolute inset-0 overflow-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white">
                          <tr>
                            {Object.keys(reportDetails.report2[0]).map((header) => (
                              <th
                                key={header}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportDetails.report2.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {Object.entries(row).map(([key, value]) => (
                                <td
                                  key={key}
                                  className="px-4 py-2 text-sm text-gray-900 border-t"
                                >
                                  {typeof value === "number"
                                    ? value.toLocaleString()
                                    : value}
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

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Other Report</h3>
                  <button
                    onClick={() => toggleCollapse("report1")}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {isCollapsed.report1 ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {!isCollapsed.report1 && reportDetails.report1.length > 0 && (
                  <div className="relative h-[300px]">
                    <div className="absolute inset-0 overflow-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white">
                          <tr>
                            {Object.keys(reportDetails.report1[0]).map((header) => (
                              <th
                                key={header}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportDetails.report1.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {Object.entries(row).map(([key, value]) => (
                                <td
                                  key={key}
                                  className="px-4 py-2 text-sm text-gray-900 border-t"
                                >
                                  {typeof value === "number"
                                    ? value.toLocaleString()
                                    : value}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonReport;