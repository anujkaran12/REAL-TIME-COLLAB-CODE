import express from "express";
import { Request, Response } from "../types";

export const codeRouter = express.Router();

const DEFAULT_COMPILER_URL = "https://api.onecompiler.com/v1/run";

const compilerLanguageMap: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
};

const compilerFileNameMap: Record<string, string> = {
  javascript: "main.js",
  typescript: "main.ts",
  python: "main.py",
  java: "Main.java",
};

type CompilerFile = {
  name: string;
  content: string;
};

codeRouter.post("/execute", async (req: Request, res: Response) => {
  try {
    const { language, version, code, files, stdin = "" } = req.body;

    if (!language || (!code && !files)) {
      return res
        .status(400)
        .json({ msg: "Language and code required", type: "ERROR" });
    }

    const compilerLanguage = compilerLanguageMap[language];
    if (!compilerLanguage) {
      return res
        .status(400)
        .json({ msg: `Unsupported language: ${language}`, type: "ERROR" });
    }

    const apiKey = process.env.ONE_COMPILER_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ msg: "OneCompiler API key is not configured", type: "ERROR" });
    }

    const compilerFiles: CompilerFile[] = Array.isArray(files)
      ? files
      : [
          {
            name: compilerFileNameMap[language] || "main.txt",
            content: code,
          },
        ];

    const response = await fetch(process.env.ONE_COMPILER_API_URL || DEFAULT_COMPILER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        language: compilerLanguage,
        stdin,
        files: compilerFiles,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const output = [data.stdout, data.stderr, data.exception, data.error]
      .filter(Boolean)
      .join("");
    const hasExecutionError = Boolean(data.stderr || data.exception || data.error);

    return res.status(200).json({
      language,
      version,
      run: {
        code: hasExecutionError || data.status === "failed" ? 1 : 0,
        output,
        stdout: data.stdout || "",
        stderr: data.stderr || data.exception || data.error || "",
        time:
          typeof data.executionTime === "number"
            ? (data.executionTime / 1000).toString()
            : undefined,
        memory:
          typeof data.memoryUsed === "number"
            ? data.memoryUsed.toString()
            : undefined,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "Code execution failed", type: "ERROR" });
  }
});
