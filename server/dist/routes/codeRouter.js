"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeRouter = void 0;
const express_1 = __importDefault(require("express"));
exports.codeRouter = express_1.default.Router();
const DEFAULT_COMPILER_URL = "https://api.onecompiler.com/v1/run";
const compilerLanguageMap = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
};
const compilerFileNameMap = {
    javascript: "main.js",
    typescript: "main.ts",
    python: "main.py",
    java: "Main.java",
};
exports.codeRouter.post("/execute", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const compilerFiles = Array.isArray(files)
            ? files
            : [
                {
                    name: compilerFileNameMap[language] || "main.txt",
                    content: code,
                },
            ];
        const response = yield fetch(process.env.ONE_COMPILER_API_URL || DEFAULT_COMPILER_URL, {
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
        const data = yield response.json();
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
                time: typeof data.executionTime === "number"
                    ? (data.executionTime / 1000).toString()
                    : undefined,
                memory: typeof data.memoryUsed === "number"
                    ? data.memoryUsed.toString()
                    : undefined,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ msg: "Code execution failed", type: "ERROR" });
    }
}));
