import React from "react";

export default function ReceiptPreviewModal({ isOpen, onClose, htmlContent }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-full flex flex-col overflow-hidden border">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <span>⚠️ No Printer Detected</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Modal Subtitle / Help */}
        <p className="text-xs text-gray-500 px-4 pt-3 text-center">
          Showing thermal receipt preview instead.
        </p>

        {/* Receipt iframe Container */}
        <div className="p-4 flex justify-center bg-gray-100 max-h-[70vh] overflow-y-auto">
          <div className="bg-white shadow border rounded p-1 w-[280px]">
            <iframe
              title="Receipt Preview"
              srcDoc={htmlContent}
              className="w-full h-[450px] border-0"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2 p-3 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
