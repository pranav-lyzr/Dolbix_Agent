
export type ComparisonResponse = {
  comparison_id: number;
  old_report_id: number;
  new_report_id: number;
  query: string;
  response: string;
  session_id: string;
  created_at: string;
};

export type ComparisonHistory = {
  comparison_id: number;
  old_report_id: number;
  new_report_id: number;
  query: string;
  response: string;
  session_id: string;
  created_at: string;
};

const API_BASE_URL = "https://dolbix-dev.test.studio.lyzr.ai/api";
// const LYZR_API_KEY = "sk-default-8roIgovhvCvAZtXXi4ZdosCHmnTt0LiF";
// const LYZR_COMPARE_AGENT_ID = "67d052899293c7f95a37b92a";
// const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

// export const compareReports = async (
//   oldReportId: string,
//   newReportId: string,
//   query: string,
//   sessionId: string,
//   oldReportData: any[] = [],
//   newReportData: any[] = []
// ) => {
//   try {
//     // const response = await fetch("https://dolbix-dev.test.studio.lyzr.ai/api/compare_reports", {
//     const response = await fetch("http://localhost:5000/api/compare_reports", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "accept": "application/json",
//       },
//       body: JSON.stringify({
//         old_report: oldReportData,
//         new_report: newReportData,
//         query: query,
//         session_id: sessionId,
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || `API request failed: ${response.status}`);
//     }

//     const responseData = await response.json();

//     return {
//       response: responseData.result,
//       session_id: sessionId,
//       full_response: responseData.result,
//     };

//   } catch (error) {
//     console.error("Error comparing reports:", error);
//     throw error;
//   }
// };

export const compareReports = async (
  oldReportId: string,
  newReportId: string,
  query: string,
  sessionId: string,
  oldReportData: any[] = [],
  newReportData: any[] = []
) => {
  try {
    const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
    const LYZR_API_KEY = "sk-default-8roIgovhvCvAZtXXi4ZdosCHmnTt0LiF"; // Secure in env variables
    console.log("oldReportId, newReportId", oldReportId, newReportId);

    // First, send the older report uncompressed
    const oldReportMessage = `
      Please store the following older sales report data for later comparison:
      ${JSON.stringify(oldReportData)}
    `;
    
    const oldResponse = await fetch(LYZR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LYZR_API_KEY,
      },
      body: JSON.stringify({
        user_id: "pranav@lyzr.ai",
        agent_id: "67cc88bd4f4888a85278d101",
        session_id: sessionId,
        message: oldReportMessage,
      })
    });
    
    if (!oldResponse.ok) {
      const errorData = await oldResponse.json();
      throw new Error(errorData.error || `API request failed for the old report: ${oldResponse.status}`);
    }
    
    // Next, send the newer report and instruct a detailed comparison
    const newReportMessage = `
      I have stored an older sales report. Now, here is the newer sales report data:
      ${JSON.stringify(newReportData)}
      
      Please compare the two reports in detail. Focus on differences in projects, revenue, rankings, and trends.
      My query is: ${query}
    `;

    const response = await fetch(LYZR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LYZR_API_KEY,
      },
      body: JSON.stringify({
        user_id: "pranav@lyzr.ai",
        agent_id: "67cc88bd4f4888a85278d101",
        session_id: sessionId,
        message: newReportMessage,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed for the new report: ${response.status}`);
    }

    const responseData = await response.json();

    return {
      response: responseData.response || "No response received",
      session_id: sessionId,
      full_response: responseData.response || "No response received",
    };
  } catch (error) {
    console.error("Error comparing reports:", error);
    throw error;
  }
};




export const getComparisonHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/comparisons`, {
      headers: {
        "accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch comparison history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching comparison history:", error);
    throw error;
  }
};

export const sendFollowUpQuery = async (comparisonId: number, followUpQuery: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comparison/${comparisonId}/follow_up?follow_up_query=${encodeURIComponent(followUpQuery)}`, {
      method: "POST",
      headers: {
        "accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to send follow-up query");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending follow-up query:", error);
    throw error;
  }
};
