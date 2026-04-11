import React, { useEffect } from "react";

function SuccessModal({ title, message, onClose, autoClose = 3000 }) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden transform animate-bounce-in">
        {/* Success Icon */}
        <div className="bg-gradient-to-r from-green-400 to-green-500 pt-8 pb-6 px-6">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {title || "Success!"}
          </h2>
          <p className="text-gray-600 mb-6">
            {message || "Operation completed successfully."}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Continue
          </button>
        </div>

        {/* Auto-close indicator */}
        {autoClose && (
          <div className="px-6 pb-4">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full animate-shrink"
                style={{
                  animation: `shrink ${autoClose}ms linear forwards`,
                }}
              />
            </div>
          </div>
        )}

        <style>{`
          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
          .animate-bounce-in {
            animation: bounce-in 0.5s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}

export default SuccessModal;
