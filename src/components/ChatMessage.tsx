import ReactMarkdown from "react-markdown";
import React from "react";

export type MessageType = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

const ChatMessage: React.FC<{ message: MessageType }> = ({ message }) => {
  return (
    <div
      className={`flex ${
        message.sender === "user" ? "justify-end" : "justify-start"
      } mb-3`}
    >
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
          message.sender === "user"
            ? "bg-purple-600 text-white rounded-tr-none"
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        }`}
      >
        {message.sender === "ai" ? (
          <div className="markdown-content text-sm">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-md font-bold my-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-1" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-sm font-semibold my-1" {...props} />,
                p: ({ node, ...props }) => <p className="my-1" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-1" {...props} />,
                li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-2 border-gray-300" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border-collapse border border-gray-300" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-200" {...props} />,
                tbody: ({ node, ...props }) => <tbody {...props} />,
                tr: ({ node, ...props }) => <tr className="border-b border-gray-300" {...props} />,
                th: ({ node, ...props }) => <th className="border px-2 py-1 text-left" {...props} />,
                td: ({ node, ...props }) => <td className="border px-2 py-1" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-2 italic my-2" {...props} />
                ),
                code: ({ node, ...props }) => <code className="bg-gray-200 px-1 rounded" {...props} />,
                pre: ({ node, ...props }) => <pre className="bg-gray-200 p-2 rounded my-2 overflow-x-auto" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
        <p className="text-xs text-gray-500">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;