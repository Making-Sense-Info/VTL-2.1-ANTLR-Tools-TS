export { VtlLexer as Lexer } from "./generated/VtlLexer";
export * from "./generated/VtlParser";
export { VtlParser as Parser } from "./generated/VtlParser";
export { VtlVisitor as Visitor } from "./generated/VtlVisitor";
export { VtlListener as Listener } from "./generated/VtlListener";
export { default as grammar } from "./generated/Vtl.g4";

const initialRule = "start";
export { initialRule };

const id = "vtl-2-1";
export { id };
