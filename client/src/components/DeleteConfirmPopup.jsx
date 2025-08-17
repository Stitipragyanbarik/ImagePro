import React from "react";

const DeleteConfirmPopup = ({ count, onConfirm, onCancel }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6 text-center max-w-sm w-full mx-4 pointer-events-auto">
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">🗑️</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Delete {count === 1 ? 'Image' : 'Images'}?
        </h2>
      </div>
      <p className="text-gray-600 mb-6 text-sm">
        Are you sure you want to delete {count} {count === 1 ? 'image' : 'images'}?
      </p>
      <div className="flex justify-center gap-3">
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          onClick={onConfirm}
        >
          Delete
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium px-5 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmPopup;