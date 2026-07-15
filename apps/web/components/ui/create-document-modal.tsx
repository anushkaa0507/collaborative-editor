"use client";

import { useState, type FormEvent } from "react";

type CreateDocumentModalProps = {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
};

export function CreateDocumentModal({ open, creating, onClose, onCreate }: CreateDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    if (creating) return;
    setTitle("");
    setDescription("");
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim());
  };

  return (
    <div className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline">
          <h3 className="text-xl font-semibold text-ink">New document</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-ink text-2xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-8 py-6 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled document"
              className="w-full border border-outline focus:border-primary rounded-2xl px-5 py-4 text-lg outline-none"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this document about?"
              className="flex-1 w-full min-h-[160px] border border-outline focus:border-primary rounded-2xl px-5 py-4 text-sm outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
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