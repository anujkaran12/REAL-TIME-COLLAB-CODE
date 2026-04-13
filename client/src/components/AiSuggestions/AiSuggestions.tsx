import React, { useState } from "react";
import "./AiSuggestions.css";
import axios from "axios";
import { usePopup } from "../../context/popupContext";
import ButtonLoader from "../Utility/ButtonLoader/ButtonLoader";

interface Iprop {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
}

interface IOuputs {
  prompt: string;
  result: string;
}

const AiSuggestions: React.FC<Iprop> = ({ code, setCode }) => {
  const [prompt, setPrompt] = useState("");
  const [outputs, setOutputs] = useState<IOuputs[]>([]);
  const [sampleOutput, setSampleOutput] = useState(""); // optional input
  const [previewCode, setPreviewCode] = useState<IOuputs | null>();
  const [loading, setLoading] = useState(false);
  const { showPopup } = usePopup();

  //method for fetching code from ai

  const fetchAiCode = async () => {
    if (!prompt.trim()) {
      showPopup("Prompt require for AI sugeestion", "WARNING");
      return;
    }
    setLoading(true);
    try {
let requestText = `
Task:
${prompt}

Current Code:
${code}
`;

// include optional sample output only if provided
if (sampleOutput.trim()) {
  requestText += `

Example Output:
${sampleOutput}
`;
}

requestText += `

Instructions:
- Give concise, step-by-step hints or ideas, with code.
- Rewrite the existing code.
- Focus on logic and next steps only.
- Keep the hints easy to follow and avoid markdown formatting like **bold** or \`\`\`.
`;

const requestParts = [{ text: requestText }];

      // // showPopup(requestParts[0].text,'WARNING')
      // // setLoading(false)
      // return;
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/ai/suggest`,
        {
          contents: [{ parts: requestParts }],
        },
        {
          headers: {
            Authorization: localStorage.getItem(process.env.REACT_APP_AUTH_TOKEN || "AUTH_TOKEN") || "",
            "Content-Type": "application/json",
          },
        }
      );
      console.log(res);

      const text =
        res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from AI";
      setOutputs((otp: any) => [...otp, { prompt: prompt, result: text }]);
      showPopup("AI gives response", "SUCCESS");
    } catch (error) {
      console.error("AI request failed:", error);
      showPopup("Unable to get response", "ERROR");
    }
    setLoading(false);
  };

  return (
    <div className="ai-suggestion-container">
      <h3 className="ai-suggestion-header">AI Suggestions</h3>

      <textarea
        id="aiPrompt"
        // type="text"
        className="ai-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Suggest better variable names"
      />
      <label htmlFor="aiPrompt" className="ai-input-label">
        *All suggestion based on current editor code:
      </label>
      <input
        type="text"
        className="ai-input"
        placeholder="Enter few output to get more accurate code"
        value={sampleOutput}
        onChange={(e) => setSampleOutput(e.target.value)}
      />
      <label className="ai-input-label">(Optional)</label>
      <button className="ai-btn" onClick={fetchAiCode} disabled={loading}>
        {loading ? <ButtonLoader /> : "Get Hint"}
      </button>

      {outputs && (
        <div className="ai-output">
          {outputs.length ? <strong>AI OUTPUTS</strong>:<strong>Enter prompt for getting ai suggesstion</strong>}
          {outputs.map((otp: IOuputs, index: number) => {
            return <p onClick={() => setPreviewCode(otp)}><i className="bi bi-robot"></i>{otp.prompt}</p>;
          })}
          {/* <code>{output}</code> */}
        </div>
      )}

      {previewCode && (
        <div className="preview-ai-code" onClick={()=>setPreviewCode(null)} >
          <div className="ai-code">
            <div className="ai-code-btn-group">
              <button
                onClick={() => {
                  setCode(previewCode.result);
                  setPreviewCode(null);
                }}
              >
                Paste in editor
              </button>
              <button onClick={() => setPreviewCode(null)}>Close</button>
            </div>
            <h1><i className="bi bi-robot"></i> {previewCode?.prompt}</h1>
            <p>{previewCode?.result}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSuggestions;
