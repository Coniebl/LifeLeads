import React, { useState } from "react";

interface CompletedFilesModalProps {
  completedFiles: string[];
  onClose: () => void;
  onDeleteFiles: (filesToDelete: string[]) => void;
}

export function CompletedFilesModal({
  completedFiles,
  onClose,
  onDeleteFiles,
}: CompletedFilesModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleFile = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleDelete = () => {
    if (selectedFiles.length > 0) {
      onDeleteFiles(selectedFiles);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#181512] rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#133020] dark:text-white">
            Completed Excel Files
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {completedFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-gray-400">No completed files yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {completedFiles.map((file) => (
                <label
                  key={file}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file)}
                    onChange={() => toggleFile(file)}
                    className="w-5 h-5 rounded border-gray-300 text-[#046241] focus:ring-[#046241] cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#133020] dark:text-white">{file}</span>
                    <span className="text-xs text-gray-400">Marked as complete</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#1A1612] border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedFiles.length === 0}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              selectedFiles.length > 0
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                : "bg-gray-200 text-gray-400 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed"
            }`}
          >
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}
