import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminVenueRegistrationAPI } from "../../services/api";

// Status filter tabs configuration
const STATUS_TABS = [
  { id: "all", label: "All Requests", path: "/admin/registrations/all", status: "all" },
  { id: "pending", label: "Pending", path: "/admin/registrations/pending", status: "PENDING" },
  { id: "under-review", label: "Under Review", path: "/admin/registrations/under-review", status: "UNDER_REVIEW" },
  { id: "approved", label: "Approved", path: "/admin/registrations/approved", status: "APPROVED" },
  { id: "rejected", label: "Rejected", path: "/admin/registrations/rejected", status: "REJECTED" },
];

// Reviewable sections configuration
const REVIEWABLE_SECTIONS = [
  { key: "venueName", label: "Venue Name", statusKey: "venueNameStatus", type: "text" },
  { key: "phone", label: "Phone Number", statusKey: "phoneStatus", type: "text" },
  { key: "location", label: "Location", statusKey: "locationStatus", type: "location" },
  { key: "profileImage", label: "Profile Image", statusKey: "profileImageStatus", type: "image" },
  { key: "venueImages", label: "Venue Images", statusKey: "venueImagesStatus", type: "images" },
  { key: "citizenshipFront", label: "Citizenship Front", statusKey: "citizenshipFrontStatus", type: "document", parent: "documents" },
  { key: "citizenshipBack", label: "Citizenship Back", statusKey: "citizenshipBackStatus", type: "document", parent: "documents" },
  { key: "businessRegistration", label: "Business Registration", statusKey: "businessRegistrationStatus", type: "document", parent: "documents" },
  { key: "panCard", label: "PAN Card", statusKey: "panCardStatus", type: "document", parent: "documents" },
];

// Rejection Dialog for per-section rejection
const RejectSectionDialog = ({ isOpen, onClose, onConfirm, sectionLabel, isLoading, isRevoke = false }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className={`w-12 h-12 ${isRevoke ? "bg-amber-100" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto`}>
          {isRevoke ? (
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mt-4">
          {isRevoke ? `Revoke Approval: ${sectionLabel}` : `Reject ${sectionLabel}`}
        </h3>
        <p className="text-sm text-gray-500 text-center mt-2">
          {isRevoke
            ? "This will revoke the approval and require the venue owner to update this section."
            : "The venue owner will only be able to edit this specific section."
          }
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {isRevoke ? "Reason for revoking" : "Reason for rejection"} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isRevoke
              ? "Explain why you're revoking this approval..."
              : "Explain what's wrong and what needs to be corrected..."
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] text-sm"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading || !reason.trim()}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isRevoke ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isLoading ? "Processing..." : isRevoke ? "Revoke Approval" : "Reject Section"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Fullscreen Image Viewer Component
const FullscreenImageViewer = ({ isOpen, onClose, images, initialIndex = 0, title }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Disable body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || !images?.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h3 className="text-white font-medium">{title}</h3>
          {images.length > 1 && (
            <p className="text-white/60 text-sm">{currentIndex + 1} of {images.length}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="absolute inset-0 flex items-center justify-center p-16">
        <img
          src={typeof currentImage === 'string' ? currentImage : currentImage?.url}
          alt={`${title} - ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex(i => Math.min(images.length - 1, i + 1))}
            disabled={currentIndex === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentIndex ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={typeof img === 'string' ? img : img?.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

// Section Review Card Component
const SectionReviewCard = ({ section, registration, onApprove, onReject, isProcessing, onImageClick }) => {
  const getStatus = () => {
    if (section.parent === "documents") {
      return registration.documents?.[section.statusKey]?.status || "PENDING";
    }
    return registration[section.statusKey]?.status || "PENDING";
  };

  const getRejectionReason = () => {
    if (section.parent === "documents") {
      return registration.documents?.[section.statusKey]?.rejectionReason;
    }
    return registration[section.statusKey]?.rejectionReason;
  };

  const status = getStatus();
  const rejectionReason = getRejectionReason();

  const getValue = () => {
    if (section.type === "text") {
      return registration[section.key];
    }
    if (section.type === "location") {
      const loc = registration.location;
      return loc ? `${loc.street}, Ward ${loc.wardNo}, ${loc.municipality}, ${loc.district}` : "N/A";
    }
    if (section.type === "image") {
      return registration.profileImage?.url;
    }
    if (section.type === "images") {
      return registration.venueImages;
    }
    if (section.type === "document") {
      return registration.documents?.[section.key]?.url;
    }
    return null;
  };

  const value = getValue();

  const statusStyles = {
    PENDING: "bg-amber-50 border-amber-200",
    APPROVED: "bg-emerald-50 border-emerald-200",
    REJECTED: "bg-red-50 border-red-200",
    NOT_SUBMITTED: "bg-gray-50 border-gray-200",
  };

  const statusBadgeStyles = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    NOT_SUBMITTED: "bg-gray-100 text-gray-500",
  };

  // Allow review for pending/under_review, and allow revoke for approved registrations
  const canReview = registration.registrationStatus === "PENDING" || registration.registrationStatus === "UNDER_REVIEW";
  const canRevoke = registration.registrationStatus === "APPROVED";

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${statusStyles[status] || statusStyles.PENDING}`}>
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div>
          <h6 className="font-medium text-gray-900">{section.label}</h6>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusBadgeStyles[status]}`}>
            {status === "NOT_SUBMITTED" ? "Not Submitted" : status}
          </span>
        </div>
        {/* Review buttons for pending/under_review registrations */}
        {canReview && (
          <div className="flex items-center gap-1 relative z-20">
            {status !== "APPROVED" && (
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(section); }}
                disabled={isProcessing}
                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 bg-white/80 shadow-sm"
                title="Approve"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            {status === "APPROVED" && (
              <span className="text-emerald-600 mr-1" title="Approved">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onReject(section); }}
              disabled={isProcessing}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 bg-white/80 shadow-sm ${
                status === "APPROVED"
                  ? "text-amber-600 hover:bg-amber-100"
                  : "text-red-600 hover:bg-red-100"
              }`}
              title={status === "APPROVED" ? "Revoke Approval" : "Reject"}
            >
              {status === "APPROVED" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        )}
        {/* Revoke button for already approved registrations */}
        {canRevoke && status === "APPROVED" && (
          <div className="flex items-center gap-1 relative z-20">
            <span className="text-emerald-600 mr-1" title="Approved">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onReject(section); }}
              disabled={isProcessing}
              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 bg-white/80 shadow-sm"
              title="Revoke Approval"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
          </div>
        )}
        {/* Just show checkmark for non-reviewable, non-revokable approved items */}
        {!canReview && !canRevoke && status === "APPROVED" && (
          <div className="flex items-center gap-1 text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content Preview */}
      <div className="mt-2 relative z-0">
        {(section.type === "text" || section.type === "location") && (
          <p className="text-sm text-gray-700 bg-white/50 rounded-lg px-3 py-2">{value || "N/A"}</p>
        )}
        {section.type === "image" && (
          <div
            onClick={() => value && onImageClick?.([value], 0, section.label)}
            className={`w-20 h-20 rounded-lg overflow-hidden bg-white relative ${value ? "cursor-pointer hover:ring-2 hover:ring-[#5d0f0f] transition-all" : ""}`}
          >
            {value ? (
              <>
                <img src={value} alt={section.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                  <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}
        {section.type === "images" && (
          <div className="flex gap-2 flex-wrap">
            {value?.length > 0 ? (
              value.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  onClick={() => onImageClick?.(value, i, section.label)}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-white cursor-pointer hover:ring-2 hover:ring-[#5d0f0f] transition-all relative group"
                >
                  <img src={img.url} alt={`Venue ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No images uploaded</p>
            )}
            {value?.length > 4 && (
              <div
                onClick={() => onImageClick?.(value, 4, section.label)}
                className="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
              >
                +{value.length - 4}
              </div>
            )}
          </div>
        )}
        {section.type === "document" && (
          <div
            onClick={() => value && onImageClick?.([value], 0, section.label)}
            className={`w-full aspect-video max-w-[200px] rounded-lg overflow-hidden bg-white relative group ${value ? "cursor-pointer hover:ring-2 hover:ring-[#5d0f0f] transition-all" : ""}`}
          >
            {value ? (
              <>
                <img src={value} alt={section.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="bg-white/90 rounded-full p-2">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Click to view full size</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Reason */}
      {status === "REJECTED" && rejectionReason && (
        <div className="mt-3 p-2 bg-red-100 rounded-lg">
          <p className="text-xs font-medium text-red-700">Rejection Reason:</p>
          <p className="text-xs text-red-600 mt-0.5">{rejectionReason}</p>
        </div>
      )}
    </div>
  );
};

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[70] ${styles[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      {type === "success" && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {type === "error" && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
};

// Confirmation Dialog for full approval/rejection
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = "warning", confirmText = "Confirm", isLoading = false }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className={`w-12 h-12 ${type === "danger" ? "bg-red-100" : "bg-emerald-100"} rounded-full flex items-center justify-center mx-auto`}>
          {type === "danger" ? (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mt-4">{title}</h3>
        <p className="text-sm text-gray-500 text-center mt-2">{message}</p>

        {type === "danger" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] text-sm"
            />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading || (type === "danger" && !reason.trim())}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${type === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

function RegistrationList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Status counts
  const [counts, setCounts] = useState({ all: 0, PENDING: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0 });

  // Dialogs state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: "warning", title: "", message: "", confirmText: "", onConfirm: () => {} });
  const [rejectSectionDialog, setRejectSectionDialog] = useState({ isOpen: false, section: null, label: "", isRevoke: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  // Fullscreen image viewer state
  const [fullscreenViewer, setFullscreenViewer] = useState({ isOpen: false, images: [], initialIndex: 0, title: "" });

  // Handler for opening fullscreen viewer
  const handleImageClick = (images, index = 0, title = "Image") => {
    setFullscreenViewer({ isOpen: true, images, initialIndex: index, title });
  };

  const getCurrentStatus = () => {
    const path = location.pathname;
    const tab = STATUS_TABS.find((t) => path.includes(t.id));
    return tab?.status || "all";
  };

  const currentStatus = getCurrentStatus();
  const currentTab = STATUS_TABS.find((tab) => location.pathname.includes(tab.id)) || STATUS_TABS[0];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load registrations
  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = { page: pagination.page, limit: pagination.limit };
      if (currentStatus !== "all") params.status = currentStatus;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await adminVenueRegistrationAPI.getAllRegistrations(token, params);
      if (response.success) {
        setRegistrations(response.registrations || []);
        setPagination((prev) => ({ ...prev, total: response.pagination?.total || 0, pages: response.pagination?.pages || 0 }));
        setCounts(response.counts || { all: 0, PENDING: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0 });
      } else {
        setToast({ message: response.message || "Failed to load", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Error connecting to server", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [currentStatus, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [currentStatus]);

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-amber-100 text-amber-700",
      UNDER_REVIEW: "bg-blue-100 text-blue-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>{status?.replace("_", " ") || "UNKNOWN"}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Per-section approval
  const handleSectionApprove = async (section) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await adminVenueRegistrationAPI.reviewField(token, selectedRegistration._id, section.statusKey, "APPROVED");
      if (response.success) {
        setToast({ message: `${section.label} approved`, type: "success" });
        setSelectedRegistration(response.registration);
        loadRegistrations();
      } else {
        setToast({ message: response.message || "Failed to approve", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Error approving section", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Per-section rejection
  const handleSectionReject = (section) => {
    // Check if this section is currently approved (revoke case)
    let currentStatus;
    if (section.parent === "documents") {
      currentStatus = selectedRegistration?.documents?.[section.statusKey]?.status;
    } else {
      currentStatus = selectedRegistration?.[section.statusKey]?.status;
    }
    const isRevoke = currentStatus === "APPROVED";
    setRejectSectionDialog({ isOpen: true, section, label: section.label, isRevoke });
  };

  const confirmSectionReject = async (reason) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const section = rejectSectionDialog.section;
      const isRevoke = rejectSectionDialog.isRevoke;
      const response = await adminVenueRegistrationAPI.reviewField(token, selectedRegistration._id, section.statusKey, "REJECTED", reason);
      if (response.success) {
        setToast({ message: isRevoke ? `${section.label} approval revoked` : `${section.label} rejected`, type: "success" });
        setSelectedRegistration(response.registration);
        setRejectSectionDialog({ isOpen: false, section: null, label: "", isRevoke: false });
        loadRegistrations();
      } else {
        setToast({ message: response.message || "Failed to process", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Error processing section", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Full approval
  const handleApprove = (registration) => {
    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "Approve All Sections",
      message: `This will approve ALL sections of "${registration.venueName}" at once. Are you sure?`,
      confirmText: "Approve All",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const token = localStorage.getItem("token");
          const response = await adminVenueRegistrationAPI.approveRegistration(token, registration._id);
          if (response.success) {
            setToast({ message: "Registration approved!", type: "success" });
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            setShowDetailModal(false);
            loadRegistrations();
          } else {
            setToast({ message: response.message || "Failed", type: "error" });
          }
        } catch (error) {
          setToast({ message: "Error approving", type: "error" });
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Full rejection
  const handleReject = (registration) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Reject Entire Registration",
      message: `This will reject the entire registration for "${registration.venueName}".`,
      confirmText: "Reject All",
      onConfirm: async (reason) => {
        setIsProcessing(true);
        try {
          const token = localStorage.getItem("token");
          const response = await adminVenueRegistrationAPI.rejectRegistration(token, registration._id, reason);
          if (response.success) {
            setToast({ message: "Registration rejected", type: "success" });
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            setShowDetailModal(false);
            loadRegistrations();
          } else {
            setToast({ message: response.message || "Failed", type: "error" });
          }
        } catch (error) {
          setToast({ message: "Error rejecting", type: "error" });
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const { page, pages: totalPages } = pagination;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) pages.push(1, 2, 3, 4, "...", totalPages);
      else if (page >= totalPages - 2) pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-1.5">
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab.status === "all" ? counts.all : counts[tab.status] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${currentTab.id === tab.id ? "bg-[#5d0f0f] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${currentTab.id === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by venue name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Showing {registrations.length} of {pagination.total}</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#5d0f0f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500">No registrations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Venue</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{reg.venueName}</p>
                      <p className="text-sm text-gray-500">{reg.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{reg.owner?.name}</p>
                      <p className="text-sm text-gray-500">{reg.owner?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{reg.location?.district}</p>
                      <p className="text-sm text-gray-500">{reg.location?.municipality}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(reg.submittedAt || reg.createdAt)}</td>
                    <td className="px-6 py-4">{getStatusBadge(reg.registrationStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedRegistration(reg); setShowDetailModal(true); }}
                          className="px-3 py-1.5 text-sm font-medium text-[#5d0f0f] bg-[#5d0f0f]/10 hover:bg-[#5d0f0f]/20 rounded-lg"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {getPageNumbers().map((p, i) => p === "..." ? <span key={i} className="px-3 py-2 text-gray-400">...</span> : (
                <button key={p} onClick={() => handlePageChange(p)} className={`px-3 py-2 rounded-lg text-sm font-medium ${p === pagination.page ? "bg-[#5d0f0f] text-white" : "text-gray-600 hover:bg-gray-100"}`}>{p}</button>
              ))}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal with Per-Section Review */}
      {showDetailModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review Registration</h3>
                <p className="text-sm text-gray-500">Review and approve/reject each section individually</p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedRegistration.registrationStatus)}
                <button onClick={() => setShowDetailModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Owner Info (non-reviewable) */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Owner Information (from account)</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-sm text-gray-500">Name:</span> <span className="text-sm font-medium text-gray-900 ml-2">{selectedRegistration.owner?.name}</span></div>
                  <div><span className="text-sm text-gray-500">Email:</span> <span className="text-sm font-medium text-gray-900 ml-2">{selectedRegistration.owner?.email}</span></div>
                </div>
              </div>

              {/* Reviewable Sections */}
              <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Reviewable Sections</h5>
              <p className="text-xs text-gray-500 mb-4">Click the checkmark to approve or X to reject each section. Rejected sections can be edited by the venue owner.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REVIEWABLE_SECTIONS.map((section) => (
                  <SectionReviewCard
                    key={section.key}
                    section={section}
                    registration={selectedRegistration}
                    onApprove={handleSectionApprove}
                    onReject={handleSectionReject}
                    isProcessing={isProcessing}
                    onImageClick={handleImageClick}
                  />
                ))}
              </div>

              {/* Timeline */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h5>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-gray-500">Created:</span> <span className="font-medium ml-1">{formatDate(selectedRegistration.createdAt)}</span></div>
                  {selectedRegistration.submittedAt && <div><span className="text-gray-500">Submitted:</span> <span className="font-medium ml-1">{formatDate(selectedRegistration.submittedAt)}</span></div>}
                  {selectedRegistration.approvedAt && <div className="text-emerald-600"><span>Approved:</span> <span className="font-medium ml-1">{formatDate(selectedRegistration.approvedAt)}</span></div>}
                  {selectedRegistration.rejectedAt && <div className="text-red-600"><span>Rejected:</span> <span className="font-medium ml-1">{formatDate(selectedRegistration.rejectedAt)}</span></div>}
                </div>
              </div>
            </div>

            {/* Footer */}
            {(selectedRegistration.registrationStatus === "PENDING" || selectedRegistration.registrationStatus === "UNDER_REVIEW") && (
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Or take action on the entire registration:</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleReject(selectedRegistration)} className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                    Reject All
                  </button>
                  <button onClick={() => handleApprove(selectedRegistration)} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
                    Approve All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} confirmText={confirmDialog.confirmText} isLoading={isProcessing} />
      <RejectSectionDialog isOpen={rejectSectionDialog.isOpen} onClose={() => setRejectSectionDialog({ isOpen: false, section: null, label: "", isRevoke: false })} onConfirm={confirmSectionReject} sectionLabel={rejectSectionDialog.label} isLoading={isProcessing} isRevoke={rejectSectionDialog.isRevoke} />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        isOpen={fullscreenViewer.isOpen}
        onClose={() => setFullscreenViewer({ isOpen: false, images: [], initialIndex: 0, title: "" })}
        images={fullscreenViewer.images}
        initialIndex={fullscreenViewer.initialIndex}
        title={fullscreenViewer.title}
      />
    </div>
  );
}

export default RegistrationList;
