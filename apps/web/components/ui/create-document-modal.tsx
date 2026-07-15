"use client";

import { useRef, useState, type FormEvent } from "react";

type CreateDocumentModalProps = {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
};

type ToolbarItem = {
  label: string;
  command: string;
  value?: string;
  icon: string;
};

const TOOLBAR: ToolbarItem[] = [
  { label: "Heading 1", command: "formatBlock", value: "H1", icon: "H1" },
  { label: "Heading 2", command: "formatBlock", value: "H2", icon: "H2" },
  { label: "Paragraph", command: "formatBlock", value: "P", icon: "P" },
  { label: "Bold", command: "bold", icon: "B" },
  { label: "Italic", command: "italic", icon: "I" },
  { label: "Underline", command: "underline", icon: "U" },
  { label: "Bulleted list", command: "insertUnorderedList", icon: "•" },
  { label: "Numbered list", command: "insertOrderedList", icon: "1." },
];

export function CreateDocumentModal({ open, creating, onClose, onCreate }: CreateDocumentModalProps) {
  const [title, setTitle] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const resetAndClose = () => {
    if (creating) return;
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const description = editorRef.current?.innerHTML.trim() || "";
    onCreate(title.trim(), description);
  };

  const applyCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  return (
    <div className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={resetAndClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline">
          <h3 className="text-xl font-semibold text-ink">New document</h3>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-ink text-2xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-6">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled document"
              className="w-full border-b-2 border-outline focus:border-primary bg-transparent px-1 py-3 text-2xl font-semibold outline-none placeholder:text-gray-300 transition-colors"
            />
          </div>

          <div className="px-8 pt-5 pb-2 flex flex-wrap gap-1">
            {TOOLBAR.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.label}
                onClick={() => applyCommand(item.command, item.value)}
                className="w-9 h-9 rounded-xl text-sm font-semibold text-gray-500 hover:bg-surface-alt hover:text-primary transition-all"
              >
                {item.icon}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto px-8 pb-6">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start writing..."
              className="min-h-[320px] h-full border border-outline rounded-2xl px-6 py-5 text-[15px] leading-relaxed text-ink outline-none focus:border-primary prose prose-neutral max-w-none transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
            />
          </div>

          <div className="flex gap-3 px-8 py-6 border-t border-outline">
            <button
              type="button"
              onClick={resetAndClose}
              className="flex-1 py-4 border border-outline rounded-2xl font-medium hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold disabled:opacity-50 transition-all"
            >
              {creating ? "Creating..." : "Create document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}