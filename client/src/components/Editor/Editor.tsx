import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import "./Editor.css";
import { usePopup } from "../../context/popupContext";
import { CODE_SNIPPETS, LANGUAGE_VERSIONS } from "../../constants";
import { useSocket } from "../../context/socketContext";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

import { useSearchParams } from "react-router-dom";

interface CodeEditorProps {
  executeCode: (language: string, sourceCode: string) => Promise<void>;
  outputLoading: boolean;
  hostSocketId: string;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
}
const CodeEditor: React.FC<CodeEditorProps> = ({
  executeCode,
  outputLoading,
  hostSocketId,
  code,
  setCode,
}) => {
  const [searchParams] = useSearchParams();
  const roomID = searchParams.get("ID");

  const editorRef = useRef<any>(null);

  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("javascript");

  const [theme, setTheme] = useState("vs-dark");

  const [fontSize, setFontSize] = useState(14);

  const languages = Object.entries(LANGUAGE_VERSIONS);

  const { showPopup } = usePopup();

  const socket = useSocket();

  const { userData } = useSelector((state: RootState) => state.User);
  useEffect(() => {
    socket?.on("code-update", ({ updatedCode }) => {
      setCode(updatedCode);
    });
    return () => {
      socket?.off("code-update");
    };
  }, [socket, setCode]);

  const onChangeEditor = (value: string) => {
    setCode(value || " ");
    socket?.emit("code-update", {
      updatedCode: value,
      roomID: roomID,
      editorName: userData?.name,
      language: selectedLanguage,
    });
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelect = (language: string) => {
    setSelectedLanguage(language);
    setCode(CODE_SNIPPETS[language]);
    console.log(setCode(CODE_SNIPPETS[language]));
  };

  const copyToClipboard = () => {
    // Try using Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          showPopup("Code copied to clipboard!", "INFO");
        })
        .catch(() => {
          // fallback if Clipboard API fails (common on mobile)
          fallbackCopy(code);
        });
    } else {
      fallbackCopy(code);
    }
  };

  // Fallback using textarea
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showPopup("Code copied to clipboard!", "SUCCESS");
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textarea);
  };

  const onRunHandler = useCallback(async () => {
    if (!code) {
      return showPopup("Type something to execute !", "WARNING");
    }
    await executeCode(selectedLanguage, code);
  }, [code, executeCode, selectedLanguage, showPopup]);
  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <select
            className="editor-select"
            value={selectedLanguage}
            onChange={(e) => onSelect(e.target.value)}
            disabled={hostSocketId !== socket?.id}
            title={
              hostSocketId !== socket?.id
                ? "Language selected by host"
                : "Select language"
            }
          >
            {languages.map(([lng, version]) => {
              return (
                <option value={lng} key={lng}>
                  {lng} &nbsp; {version}
                </option>
              );
            })}
          </select>

          <select
            className="editor-select"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
          </select>

          <select
            className="editor-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="vs-dark">Dark</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button className="copy-btn" onClick={copyToClipboard}>
            <i className="bi bi-copy"></i> Copy
          </button>
          <button
            className="run-btn"
            onClick={onRunHandler}
            disabled={outputLoading}
          >
            <i className="bi bi-code"></i> Run
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="editor-box">
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          //   defaultValue={CODE_SNIPPETS[selectedLanguage]}
          value={code}
          language={selectedLanguage}
          theme={theme}
          options={{
            fontSize: fontSize,
            minimap: { enabled: false },
            wordWrap: "on",
            suggestOnTriggerCharacters: false, // disables suggestions while typing
            quickSuggestions: false, // disables inline suggestions
            // wordBasedSuggestions: false, // disables word-based suggestions
            parameterHints: { enabled: false }, // disables parameter hints
            acceptSuggestionOnEnter: "off", // disables auto-accept on Enter
            tabCompletion: "off", // disables tab completion
          }}
          onMount={handleEditorMount}
          onChange={(value) => onChangeEditor(value || "")}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
