export interface ILanguagesVersion {
  javascript: string;
  typescript: string;
  python: string;
  java: string;
}

/**
 * Versions are mainly informational for UI.
 * Most online compilers ignore JS/TS versions.
 */
export const LANGUAGE_VERSIONS: ILanguagesVersion = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
};

/**
 * IMPORTANT:
 * TypeScript is NOT supported by most online compilers directly.
 * It should be treated as JavaScript at runtime.
 */
export const COMPILER_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "javascript", // fallback
  python: "python3",
  java: "java",
};

export const CODE_SNIPPETS: Record<string, string> = {
  javascript: `function greet(name) {
\tconsole.log("Hello, " + name + "!");
}

greet("World");`,

  typescript: `type Params = {
\tname: string;
};

function greet(data: Params) {
\tconsole.log("Hello, " + data.name + "!");
}

greet({ name: "World" });`,

  python: `def greet(name):
\tprint("Hello, " + name + "!")

greet("World")`,

  java: `public class Main {
\tpublic static void main(String[] args) {
\t\tSystem.out.println("Hello World");
\t}
}`,
};
