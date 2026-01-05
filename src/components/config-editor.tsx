"use client";

import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useMemo } from "react";
// import type { editor } from "monaco-editor";

interface ConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

// Helper to format JSON string with proper indentation
function formatJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If it's not valid JSON, return as-is
    return jsonString;
  }
}

export function ConfigEditor({
  value,
  onChange,
  height = "120px",
  readOnly = false,
}: ConfigEditorProps) {
  const hasFormatted = useRef(false);

  // Format JSON on initial mount
  useEffect(() => {
    if (!hasFormatted.current && value) {
      const formatted = formatJson(value);
      if (formatted !== value) {
        onChange(formatted);
      }
      hasFormatted.current = true;
    }
  }, [value, onChange]);

  // Reset the format flag when value is completely cleared (new modal)
  useEffect(() => {
    if (!value) {
      hasFormatted.current = false;
    }
  }, [value]);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue ?? "");
    },
    [onChange],
  );

  return (
    <div className="border rounded-md overflow-hidden px-2">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={handleChange}
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
