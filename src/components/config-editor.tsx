"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef, useCallback } from "react";
// import type { editor } from "monaco-editor";

interface ConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function ConfigEditor({
  value,
  onChange,
  height = "120px",
  readOnly = false,
}: ConfigEditorProps) {
  // const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // const handleEditorDidMount: OnMount = useCallback((editor) => {
  //   editorRef.current = editor;
  // }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue ?? "");
    },
    [onChange]
  );

  return (
    <div className="border rounded-md overflow-hidden px-2">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={handleChange}
        // onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineNumbers: "off",
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          glyphMargin: false,
          renderLineHighlight: "none",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          automaticLayout: true,
          readOnly,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          padding: { top: 8, bottom: 8 },
        }}
        theme="light"
      />
    </div>
  );
}
