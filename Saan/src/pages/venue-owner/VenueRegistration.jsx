import React, { useState, useEffect, useRef, useMemo } from "react";
import { venueRegistrationAPI } from "../../services/api";
import { Province, District, Municipality } from "states-nepal";

// ==================== DIALOG COMPONENT ====================
const Dialog = ({ isOpen, onClose, type = "info", title, message, confirmText = "OK", onConfirm }) => {
  if (!isOpen) return null;

  const icons = {
    success: (
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  const buttonColors = {
    success: "bg-emerald-500 hover:bg-emerald-600",
    error: "bg-red-500 hover:bg-red-600",
    warning: "bg-amber-500 hover:bg-amber-600",
    info: "bg-blue-500 hover:bg-blue-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {icons[type]}

          <h3 className="mt-4 text-xl font-semibold text-gray-900">
            {title}
          </h3>

          <p className="mt-2 text-gray-500 text-sm">
            {message}
          </p>

          {/* Actions */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className={`px-6 py-2.5 text-white rounded-xl font-medium transition-colors ${buttonColors[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== NEPAL LOCATION DATA (from states-nepal package) ====================
// Initialize the classes for fetching Nepal administrative data
const provinceInstance = new Province("en");
const districtInstance = new District("en");
const municipalityInstance = new Municipality("en");

// ==================== FILE UPLOAD COMPONENT ====================
const FileUpload = ({ label, description, accept, maxSize = 5, onFileSelect, preview, status, rejectionReason, multiple = false, maxFiles = 1 }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (files) => {
    setError("");
    const validFiles = [];

    for (let file of files) {
      // Check file type
      const validTypes = accept.split(",").map(t => t.trim());
      const isValidType = validTypes.some(type => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type);
        }
        return file.type.match(type.replace("*", ".*"));
      });

      if (!isValidType) {
        setError(`Invalid file type. Accepted: ${accept}`);
        return;
      }

      // Check file size (in MB)
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File too large. Maximum size: ${maxSize}MB`);
        return;
      }

      validFiles.push(file);
      if (!multiple && validFiles.length >= 1) break;
      if (multiple && validFiles.length >= maxFiles) break;
    }

    if (validFiles.length > 0) {
      onFileSelect(multiple ? validFiles : validFiles[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const getStatusBadge = () => {
    if (!status) return null;
    const styles = {
      PENDING: "bg-amber-50 text-amber-600 border-amber-200",
      APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
      REJECTED: "bg-red-50 text-red-600 border-red-200",
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {getStatusBadge()}
      </div>

      {description && <p className="text-xs text-gray-500">{description}</p>}

      {status === "REJECTED" && rejectionReason && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-red-600">{rejectionReason}</p>
        </div>
      )}

      {status !== "APPROVED" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? "border-[#5d0f0f] bg-[#5d0f0f]/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          {preview ? (
            <div className="space-y-3">
              {typeof preview === "string" ? (
                preview.endsWith(".pdf") ? (
                  <div className="w-16 h-16 mx-auto bg-red-50 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  <img src={preview} alt="Preview" className="w-24 h-24 mx-auto object-cover rounded-lg" />
                )
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {preview.map((p, i) => (
                    <img key={i} src={p} alt={`Preview ${i + 1}`} className="w-16 h-16 object-cover rounded-lg" />
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Click or drag to replace</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                <span className="text-[#5d0f0f] font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">{accept.toUpperCase()} • Max {maxSize}MB {multiple && `• Up to ${maxFiles} files`}</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// ==================== STATUS BADGE COMPONENT ====================
const SectionStatusBadge = ({ status }) => {
  if (!status) return null;

  const styles = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    NOT_SUBMITTED: "bg-gray-50 text-gray-500 border-gray-200",
  };

  const icons = {
    PENDING: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    APPROVED: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    REJECTED: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${styles[status] || styles.NOT_SUBMITTED}`}>
      {icons[status]}
      {status === "PENDING" ? "Under Review" : status?.replace("_", " ") || "Not Submitted"}
    </span>
  );
};

// ==================== LOCKED SECTION OVERLAY ====================
const LockedOverlay = ({ status }) => (
  <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
    <div className="text-center px-4">
      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
        status === "APPROVED" ? "bg-emerald-100" : "bg-amber-100"
      }`}>
        {status === "APPROVED" ? (
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>
      <p className={`text-xs font-medium ${status === "APPROVED" ? "text-emerald-700" : "text-amber-700"}`}>
        {status === "APPROVED" ? "Section Approved" : "Under Review"}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5">
        {status === "APPROVED" ? "This section has been verified" : "Cannot edit while under review"}
      </p>
    </div>
  </div>
);

// ==================== REJECTION ALERT ====================
const RejectionAlert = ({ reason }) => {
  if (!reason) return null;
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mb-3">
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-xs font-medium text-red-700">Rejected - Please correct this section</p>
        <p className="text-xs text-red-600 mt-0.5">{reason}</p>
      </div>
    </div>
  );
};

// ==================== SECTION COMPONENT ====================
const FormSection = ({ number, title, description, children, isComplete, status, isLocked, rejectionReason }) => (
  <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
    status === "REJECTED" ? "border-red-200" :
    status === "APPROVED" ? "border-emerald-200" :
    "border-gray-100"
  }`}>
    <div className={`px-6 py-4 border-b flex items-center justify-between ${
      status === "REJECTED" ? "border-red-100 bg-red-50/30" :
      status === "APPROVED" ? "border-emerald-100 bg-emerald-50/30" :
      "border-gray-100"
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          status === "APPROVED" ? "bg-emerald-500 text-white" :
          status === "REJECTED" ? "bg-red-500 text-white" :
          isComplete ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {status === "APPROVED" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : status === "REJECTED" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : isComplete ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : number}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      <SectionStatusBadge status={status} />
    </div>
    <div className="p-6 relative">
      {rejectionReason && <RejectionAlert reason={rejectionReason} />}
      {isLocked && <LockedOverlay status={status} />}
      <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
function VenueRegistration() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("NOT_SUBMITTED"); // NOT_SUBMITTED, PENDING, APPROVED, REJECTED
  const [registrationId, setRegistrationId] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: null,
  });

  const showDialog = (type, title, message, onConfirm = null) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText: "OK",
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Helper function to check if a section is locked (APPROVED or PENDING means locked)
  const isSectionLocked = (status) => {
    // If registration is in DRAFT or NOT_SUBMITTED, nothing is locked
    if (verificationStatus === "DRAFT" || verificationStatus === "NOT_SUBMITTED") {
      return false;
    }
    // APPROVED or PENDING status means the section is locked
    return status === "APPROVED" || status === "PENDING";
  };

  // Helper function to check if section can be edited (only REJECTED or not yet submitted)
  const isSectionEditable = (status) => {
    // If registration is in DRAFT or NOT_SUBMITTED, everything is editable
    if (verificationStatus === "DRAFT" || verificationStatus === "NOT_SUBMITTED") {
      return true;
    }
    // Only REJECTED sections can be edited after submission
    return status === "REJECTED" || status === "NOT_SUBMITTED" || status === null;
  };

  // Form state
  const [formData, setFormData] = useState({
    // Section 1: Basic Info (read-only)
    fullName: "",
    email: "",

    // Section 2: Contact
    phone: "",
    phoneStatus: null,

    // Section 3: Profile
    profileImage: null,
    profileImagePreview: null,
    profileImageStatus: null,

    // Section 4: Venue
    venueName: "",
    venueNameStatus: null,
    capacity: "",
    numberOfHalls: "",

    // Section 5: Venue Images
    venueImages: [],
    venueImagePreviews: [],
    venueImagesStatus: null,

    // Section 6: Documents
    citizenshipFront: null,
    citizenshipFrontPreview: null,
    citizenshipFrontStatus: null,
    citizenshipBack: null,
    citizenshipBackPreview: null,
    citizenshipBackStatus: null,
    businessRegistration: null,
    businessRegistrationPreview: null,
    businessRegistrationStatus: null,
    panCard: null,
    panCardPreview: null,
    panCardStatus: null,

    // Section 7: Location (Nepal-specific)
    province: "",
    district: "",
    municipality: "",
    wardNo: "",
    street: "",
    locationStatus: null,
  });

  const [errors, setErrors] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});

  // Location data from states-nepal package
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  // Helper function to check if any section has been rejected
  const hasAnyRejectedSection = () => {
    return (
      formData.venueNameStatus === "REJECTED" ||
      formData.phoneStatus === "REJECTED" ||
      formData.locationStatus === "REJECTED" ||
      formData.profileImageStatus === "REJECTED" ||
      formData.venueImagesStatus === "REJECTED" ||
      formData.citizenshipFrontStatus === "REJECTED" ||
      formData.citizenshipBackStatus === "REJECTED" ||
      formData.businessRegistrationStatus === "REJECTED" ||
      formData.panCardStatus === "REJECTED"
    );
  };

  // Load provinces on mount
  useEffect(() => {
    const allProvinces = provinceInstance.allProvinces();
    setProvinces(allProvinces);
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (formData.province) {
      const provinceId = parseInt(formData.province);
      const provinceDistricts = districtInstance.getDistrictsByProvince(provinceId);
      setDistricts(provinceDistricts || []);
    } else {
      setDistricts([]);
    }
  }, [formData.province]);

  // Load municipalities when district changes
  useEffect(() => {
    if (formData.district) {
      // Find district by name to get its ID
      const selectedDistrict = districts.find(d => d.name === formData.district);
      if (selectedDistrict) {
        const districtMunicipalities = municipalityInstance.getMunicipalitiesByDistrict(selectedDistrict.id);
        setMunicipalities(districtMunicipalities || []);
      } else {
        setMunicipalities([]);
      }
    } else {
      setMunicipalities([]);
    }
  }, [formData.district, districts]);

  // Load user data and existing registration
  useEffect(() => {
    const loadData = async () => {
      const userName = localStorage.getItem("userName") || "";
      const userEmail = localStorage.getItem("userEmail") || "";
      const token = localStorage.getItem("token");

      setFormData(prev => ({ ...prev, fullName: userName, email: userEmail }));

      if (token) {
        try {
          const response = await venueRegistrationAPI.getMyRegistration(token);

          if (response.success && response.exists && response.registration) {
            const reg = response.registration;

            // Set registration ID and status
            setRegistrationId(reg._id);
            setVerificationStatus(reg.registrationStatus || "NOT_SUBMITTED");
            setSubmittedAt(reg.submittedAt);

            // Populate form data from existing registration
            setFormData(prev => ({
              ...prev,
              phone: reg.phone || "",
              phoneStatus: reg.phoneStatus?.status || null,
              venueName: reg.venueName || "",
              venueNameStatus: reg.venueNameStatus?.status || null,
              capacity: reg.capacity || "",
              numberOfHalls: reg.numberOfHalls || "",

              // Profile image
              profileImagePreview: reg.profileImage?.url || null,
              profileImageStatus: reg.profileImageStatus?.status || null,

              // Venue images
              venueImagePreviews: reg.venueImages?.map(img => img.url) || [],
              venueImagesStatus: reg.venueImagesStatus?.status || null,

              // Documents
              citizenshipFrontPreview: reg.documents?.citizenshipFront?.url || null,
              citizenshipFrontStatus: reg.documents?.citizenshipFrontStatus?.status || null,
              citizenshipBackPreview: reg.documents?.citizenshipBack?.url || null,
              citizenshipBackStatus: reg.documents?.citizenshipBackStatus?.status || null,
              businessRegistrationPreview: reg.documents?.businessRegistration?.url || null,
              businessRegistrationStatus: reg.documents?.businessRegistrationStatus?.status || null,
              panCardPreview: reg.documents?.panCard?.url || null,
              panCardStatus: reg.documents?.panCardStatus?.status || null,

              // Location
              province: reg.location?.province || "",
              district: reg.location?.district || "",
              municipality: reg.location?.municipality || "",
              wardNo: reg.location?.wardNo || "",
              street: reg.location?.street || "",
              locationStatus: reg.locationStatus?.status || null,
            }));

            // Set rejection reasons if any
            setRejectionReasons({
              phone: reg.phoneStatus?.rejectionReason || null,
              venueName: reg.venueNameStatus?.rejectionReason || null,
              profileImage: reg.profileImageStatus?.rejectionReason || null,
              venueImages: reg.venueImagesStatus?.rejectionReason || null,
              citizenshipFront: reg.documents?.citizenshipFrontStatus?.rejectionReason || null,
              citizenshipBack: reg.documents?.citizenshipBackStatus?.rejectionReason || null,
              businessRegistration: reg.documents?.businessRegistrationStatus?.rejectionReason || null,
              panCard: reg.documents?.panCardStatus?.rejectionReason || null,
              location: reg.locationStatus?.rejectionReason || null,
            });
          }
        } catch (error) {
          console.error("Error loading registration:", error);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle file upload
  const handleFileUpload = (field, file, previewField) => {
    if (Array.isArray(file)) {
      // Multiple files (venue images)
      const previews = file.map(f => URL.createObjectURL(f));
      setFormData(prev => ({
        ...prev,
        [field]: file,
        [previewField]: previews,
      }));
    } else {
      // Single file
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [field]: file,
        [previewField]: preview,
      }));
    }
  };

  // Validate Nepal phone number
  const validatePhone = (phone) => {
    const nepalPhoneRegex = /^(98|97|96|01)[0-9]{8}$/;
    return nepalPhoneRegex.test(phone.replace(/[\s-]/g, ""));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Enter a valid Nepal phone number";
    }

    if (!formData.profileImage && formData.profileImageStatus !== "APPROVED") {
      newErrors.profileImage = "Profile picture is required";
    }

    if (!formData.venueName) {
      newErrors.venueName = "Venue name is required";
    }

    if (!formData.capacity) {
      newErrors.capacity = "Total capacity is required";
    } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = "Capacity must be a positive number";
    }

    if (!formData.numberOfHalls) {
      newErrors.numberOfHalls = "Number of halls is required";
    } else if (isNaN(formData.numberOfHalls) || parseInt(formData.numberOfHalls) <= 0) {
      newErrors.numberOfHalls = "Number of halls must be a positive number";
    }

    if (formData.venueImages.length < 3 && formData.venueImagesStatus !== "APPROVED") {
      newErrors.venueImages = "Please upload at least 3 venue images";
    }

    if (!formData.citizenshipFront && formData.citizenshipFrontStatus !== "APPROVED") {
      newErrors.citizenshipFront = "Citizenship front is required";
    }
    if (!formData.citizenshipBack && formData.citizenshipBackStatus !== "APPROVED") {
      newErrors.citizenshipBack = "Citizenship back is required";
    }
    if (!formData.businessRegistration && formData.businessRegistrationStatus !== "APPROVED") {
      newErrors.businessRegistration = "Business registration is required";
    }
    if (!formData.panCard && formData.panCardStatus !== "APPROVED") {
      newErrors.panCard = "PAN card is required";
    }

    if (!formData.province || !formData.district || !formData.municipality || !formData.wardNo || !formData.street) {
      newErrors.location = "Please complete all location fields";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showDialog(
          "error",
          "Authentication Required",
          "Your session has expired. Please log in again."
        );
        setIsSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();

      // Add text fields
      submitData.append("phone", formData.phone);
      submitData.append("venueName", formData.venueName);
      submitData.append("capacity", formData.capacity);
      submitData.append("numberOfHalls", formData.numberOfHalls);
      submitData.append("province", formData.province);
      submitData.append("district", formData.district);
      submitData.append("municipality", formData.municipality);
      submitData.append("wardNo", formData.wardNo);
      submitData.append("street", formData.street);
      submitData.append("submitForReview", "true");

      // Add files only if they are new File objects (not URLs from server)
      if (formData.profileImage instanceof File) {
        submitData.append("profileImage", formData.profileImage);
      }

      if (formData.venueImages.length > 0 && formData.venueImages[0] instanceof File) {
        formData.venueImages.forEach(file => {
          submitData.append("venueImages", file);
        });
      }

      if (formData.citizenshipFront instanceof File) {
        submitData.append("citizenshipFront", formData.citizenshipFront);
      }
      if (formData.citizenshipBack instanceof File) {
        submitData.append("citizenshipBack", formData.citizenshipBack);
      }
      if (formData.businessRegistration instanceof File) {
        submitData.append("businessRegistration", formData.businessRegistration);
      }
      if (formData.panCard instanceof File) {
        submitData.append("panCard", formData.panCard);
      }

      const response = await venueRegistrationAPI.submitRegistration(token, submitData);

      if (response.success) {
        showDialog(
          "success",
          "Registration Submitted!",
          "Your venue registration has been submitted successfully. Our team will review it within 1-2 business days.",
          () => {
            setVerificationStatus("PENDING");
            setSubmittedAt(new Date().toISOString());
            setRegistrationId(response.registration?._id);
          }
        );
      } else if (response.message && response.message.includes("session has expired")) {
        // Session expired - redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        showDialog(
          "error",
          "Session Expired",
          "Your login session has expired. Please log in again.",
          () => {
            window.location.href = "/login";
          }
        );
      } else {
        showDialog(
          "error",
          "Submission Failed",
          response.message || "Something went wrong. Please check your information and try again."
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      showDialog(
        "error",
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check section completion
  const isSectionComplete = (section) => {
    switch (section) {
      case 1: return formData.fullName && formData.email;
      case 2: return formData.phone && validatePhone(formData.phone);
      case 3: return formData.profileImage || formData.profileImageStatus === "APPROVED";
      case 4: return formData.venueName && formData.capacity && formData.numberOfHalls;
      case 5: return formData.venueImages.length >= 3 || formData.venueImagesStatus === "APPROVED";
      case 6: return (
        (formData.citizenshipFront || formData.citizenshipFrontStatus === "APPROVED") &&
        (formData.citizenshipBack || formData.citizenshipBackStatus === "APPROVED") &&
        (formData.businessRegistration || formData.businessRegistrationStatus === "APPROVED") &&
        (formData.panCard || formData.panCardStatus === "APPROVED")
      );
      case 7: return formData.province && formData.district && formData.municipality && formData.wardNo && formData.street;
      default: return false;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5d0f0f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading registration data...</p>
        </div>
      </div>
    );
  }

  // If already approved AND no sections are rejected (check for revoked sections)
  if (verificationStatus === "APPROVED" && !hasAnyRejectedSection()) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Approved!</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Congratulations! Your venue registration has been verified and approved.
            You can now start receiving bookings for your venue.
          </p>
          <div className="bg-emerald-50 rounded-xl p-4 inline-block">
            <p className="text-sm text-emerald-700">
              <span className="font-medium">Venue:</span> {formData.venueName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If already submitted and pending
  if (verificationStatus === "PENDING" || verificationStatus === "UNDER_REVIEW") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Under Review</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Your venue registration has been submitted and is currently being reviewed by our team.
            This usually takes 1-2 business days. We'll notify you once the verification is complete.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Submitted:</span> {submittedAt ? new Date(submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Venue Registration</h1>
          <p className="text-sm text-gray-500 mt-1">Complete all sections to submit for verification</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Progress:</span>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5,6,7].map(num => (
              <div
                key={num}
                className={`w-6 h-1.5 rounded-full ${isSectionComplete(num) ? "bg-emerald-500" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Verification Alert - Show when there are rejected sections */}
      {(verificationStatus === "REJECTED" || hasAnyRejectedSection()) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-red-800">Action Required: Update Rejected Sections</p>
            <p className="text-sm text-red-600 mt-1">Some sections need to be corrected. Please update the rejected items marked in red below and resubmit for verification.</p>
          </div>
        </div>
      )}

      {/* Section 1: Basic Info */}
      <FormSection number={1} title="Basic Information" description="Your account details" isComplete={isSectionComplete(1)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 2: Contact Details */}
      <FormSection
        number={2}
        title="Contact Details"
        description="Your contact information"
        isComplete={isSectionComplete(2)}
        status={formData.phoneStatus}
        isLocked={isSectionLocked(formData.phoneStatus)}
        rejectionReason={rejectionReasons.phone}
      >
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+977</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="98XXXXXXXX"
              maxLength={10}
              className={`w-full pl-14 pr-12 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] ${
                formData.phone.length > 0
                  ? validatePhone(formData.phone)
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-red-300 bg-red-50/30"
                  : "border-gray-200"
              }`}
            />
            {/* Validation icon */}
            {formData.phone.length > 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {validatePhone(formData.phone) ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Real-time validation feedback */}
          {formData.phone.length > 0 && !validatePhone(formData.phone) && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600 font-medium mb-1">Invalid phone number format</p>
              <ul className="text-xs text-red-500 space-y-0.5">
                {!formData.phone.match(/^(98|97|96|01)/) && formData.phone.length >= 2 && (
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    Must start with 98, 97, 96 (mobile) or 01 (landline)
                  </li>
                )}
                {formData.phone.length < 10 && (
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    Must be 10 digits ({10 - formData.phone.length} more needed)
                  </li>
                )}
                {formData.phone.length > 10 && (
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    Too many digits (maximum 10)
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Success feedback */}
          {formData.phone.length > 0 && validatePhone(formData.phone) && (
            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Valid Nepal {formData.phone.startsWith("01") ? "landline" : "mobile"} number
              </p>
            </div>
          )}

          {/* Helper text when empty */}
          {formData.phone.length === 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              Nepal mobile (98, 97, 96) or Kathmandu landline (01) • 10 digits
            </p>
          )}
        </div>
      </FormSection>

      {/* Section 3: Profile Picture */}
      <FormSection
        number={3}
        title="Profile Verification"
        description="Upload a clear photo for identity verification"
        isComplete={isSectionComplete(3)}
        status={formData.profileImageStatus}
        isLocked={isSectionLocked(formData.profileImageStatus)}
        rejectionReason={rejectionReasons.profileImage}
      >
        <div className="max-w-md">
          <FileUpload
            label="Profile Picture"
            description="Clear front-facing photo. Full face visible. No sunglasses or hats."
            accept=".jpg,.jpeg,.png"
            maxSize={5}
            onFileSelect={(file) => handleFileUpload("profileImage", file, "profileImagePreview")}
            preview={formData.profileImagePreview}
            status={formData.profileImageStatus}
            rejectionReason={rejectionReasons.profileImage}
            disabled={isSectionLocked(formData.profileImageStatus)}
          />
          {errors.profileImage && <p className="text-xs text-red-500 mt-1">{errors.profileImage}</p>}
        </div>
      </FormSection>

      {/* Section 4: Venue Details */}
      <FormSection
        number={4}
        title="Venue Details"
        description="Information about your venue"
        isComplete={isSectionComplete(4)}
        status={formData.venueNameStatus}
        isLocked={isSectionLocked(formData.venueNameStatus)}
        rejectionReason={rejectionReasons.venueName}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue Name</label>
            <input
              type="text"
              value={formData.venueName}
              onChange={(e) => handleChange("venueName", e.target.value)}
              placeholder="Enter your venue name"
              disabled={isSectionLocked(formData.venueNameStatus)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] ${
                isSectionLocked(formData.venueNameStatus) ? "bg-gray-50 cursor-not-allowed" :
                errors.venueName ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.venueName && <p className="text-xs text-red-500 mt-1">{errors.venueName}</p>}
            <p className="text-xs text-gray-400 mt-1.5">Must match your Government / PAN / Business Registration</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
                placeholder="e.g., 500"
                disabled={isSectionLocked(formData.venueNameStatus)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] ${
                  isSectionLocked(formData.venueNameStatus) ? "bg-gray-50 cursor-not-allowed" :
                  errors.capacity ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
              <p className="text-xs text-gray-400 mt-1">Maximum number of guests</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Halls</label>
              <input
                type="number"
                value={formData.numberOfHalls}
                onChange={(e) => handleChange("numberOfHalls", e.target.value)}
                placeholder="e.g., 3"
                disabled={isSectionLocked(formData.venueNameStatus)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] ${
                  isSectionLocked(formData.venueNameStatus) ? "bg-gray-50 cursor-not-allowed" :
                  errors.numberOfHalls ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.numberOfHalls && <p className="text-xs text-red-500 mt-1">{errors.numberOfHalls}</p>}
              <p className="text-xs text-gray-400 mt-1">Total number of event halls</p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Section 5: Venue Images */}
      <FormSection
        number={5}
        title="Venue Images"
        description="Upload 3-6 high quality photos of your venue"
        isComplete={isSectionComplete(5)}
        status={formData.venueImagesStatus}
        isLocked={isSectionLocked(formData.venueImagesStatus)}
        rejectionReason={rejectionReasons.venueImages}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Venue Photos</label>
              {formData.venueImagesStatus && !isSectionLocked(formData.venueImagesStatus) && (
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${
                  formData.venueImagesStatus === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-200" :
                  formData.venueImagesStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  "bg-red-50 text-red-600 border-red-200"
                }`}>
                  {formData.venueImagesStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">Include: Front exterior, Interior/hall, Stage area, Parking/entrance. No stock images.</p>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Existing Images */}
            {formData.venueImagePreviews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={preview}
                  alt={`Venue ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl border border-gray-200"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    const newImages = [...formData.venueImages];
                    const newPreviews = [...formData.venueImagePreviews];
                    // Revoke old preview URL to prevent memory leak
                    URL.revokeObjectURL(newPreviews[index]);
                    newImages.splice(index, 1);
                    newPreviews.splice(index, 1);
                    setFormData(prev => ({
                      ...prev,
                      venueImages: newImages,
                      venueImagePreviews: newPreviews,
                    }));
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Image number */}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add More Button */}
            {formData.venueImages.length < 6 && formData.venueImagesStatus !== "APPROVED" && (
              <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#5d0f0f] hover:bg-[#5d0f0f]/5 transition-all">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validate file
                      if (file.size > 5 * 1024 * 1024) {
                        alert("File too large. Maximum size: 5MB");
                        return;
                      }
                      const validTypes = [".jpg", ".jpeg", ".png"];
                      const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
                      if (!isValidType) {
                        alert("Invalid file type. Accepted: JPG, JPEG, PNG");
                        return;
                      }
                      // Add to existing images
                      const preview = URL.createObjectURL(file);
                      setFormData(prev => ({
                        ...prev,
                        venueImages: [...prev.venueImages, file],
                        venueImagePreviews: [...prev.venueImagePreviews, preview],
                      }));
                    }
                    // Reset input so same file can be selected again
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-gray-500">Add Photo</span>
              </label>
            )}
          </div>

          {errors.venueImages && <p className="text-xs text-red-500">{errors.venueImages}</p>}

          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-400">
              {formData.venueImages.length}/6 images uploaded • Minimum 3 required
            </p>
            {formData.venueImages.length > 0 && formData.venueImages.length < 3 && (
              <p className="text-amber-600 font-medium">
                Add {3 - formData.venueImages.length} more image{3 - formData.venueImages.length > 1 ? 's' : ''}
              </p>
            )}
            {formData.venueImages.length >= 3 && (
              <p className="text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Minimum met
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Section 6: Government Documents */}
      <FormSection
        number={6}
        title="Government Documents"
        description="Upload required verification documents"
        isComplete={isSectionComplete(6)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Citizenship Front */}
          <div className={`relative rounded-lg ${isSectionLocked(formData.citizenshipFrontStatus) ? "ring-2 ring-emerald-200 bg-emerald-50/30" : ""}`}>
            {isSectionLocked(formData.citizenshipFrontStatus) && (
              <div className="absolute -top-2 -right-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-500 text-white shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {formData.citizenshipFrontStatus}
                </span>
              </div>
            )}
            <FileUpload
              label="Citizenship (Front)"
              accept=".jpg,.jpeg,.png,.pdf"
              maxSize={5}
              onFileSelect={(file) => handleFileUpload("citizenshipFront", file, "citizenshipFrontPreview")}
              preview={formData.citizenshipFrontPreview}
              status={formData.citizenshipFrontStatus}
              rejectionReason={rejectionReasons.citizenshipFront}
              disabled={isSectionLocked(formData.citizenshipFrontStatus)}
            />
            {errors.citizenshipFront && <p className="text-xs text-red-500 mt-1">{errors.citizenshipFront}</p>}
          </div>

          {/* Citizenship Back */}
          <div className={`relative rounded-lg ${isSectionLocked(formData.citizenshipBackStatus) ? "ring-2 ring-emerald-200 bg-emerald-50/30" : ""}`}>
            {isSectionLocked(formData.citizenshipBackStatus) && (
              <div className="absolute -top-2 -right-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-500 text-white shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {formData.citizenshipBackStatus}
                </span>
              </div>
            )}
            <FileUpload
              label="Citizenship (Back)"
              accept=".jpg,.jpeg,.png,.pdf"
              maxSize={5}
              onFileSelect={(file) => handleFileUpload("citizenshipBack", file, "citizenshipBackPreview")}
              preview={formData.citizenshipBackPreview}
              status={formData.citizenshipBackStatus}
              rejectionReason={rejectionReasons.citizenshipBack}
              disabled={isSectionLocked(formData.citizenshipBackStatus)}
            />
            {errors.citizenshipBack && <p className="text-xs text-red-500 mt-1">{errors.citizenshipBack}</p>}
          </div>

          {/* Business Registration */}
          <div className={`relative rounded-lg ${isSectionLocked(formData.businessRegistrationStatus) ? "ring-2 ring-emerald-200 bg-emerald-50/30" : ""}`}>
            {isSectionLocked(formData.businessRegistrationStatus) && (
              <div className="absolute -top-2 -right-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-500 text-white shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {formData.businessRegistrationStatus}
                </span>
              </div>
            )}
            <FileUpload
              label="Business Registration Certificate"
              accept=".jpg,.jpeg,.png,.pdf"
              maxSize={5}
              onFileSelect={(file) => handleFileUpload("businessRegistration", file, "businessRegistrationPreview")}
              preview={formData.businessRegistrationPreview}
              status={formData.businessRegistrationStatus}
              rejectionReason={rejectionReasons.businessRegistration}
              disabled={isSectionLocked(formData.businessRegistrationStatus)}
            />
            {errors.businessRegistration && <p className="text-xs text-red-500 mt-1">{errors.businessRegistration}</p>}
          </div>

          {/* PAN Card */}
          <div className={`relative rounded-lg ${isSectionLocked(formData.panCardStatus) ? "ring-2 ring-emerald-200 bg-emerald-50/30" : ""}`}>
            {isSectionLocked(formData.panCardStatus) && (
              <div className="absolute -top-2 -right-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-500 text-white shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {formData.panCardStatus}
                </span>
              </div>
            )}
            <FileUpload
              label="PAN Card"
              accept=".jpg,.jpeg,.png,.pdf"
              maxSize={5}
              onFileSelect={(file) => handleFileUpload("panCard", file, "panCardPreview")}
              preview={formData.panCardPreview}
              status={formData.panCardStatus}
              rejectionReason={rejectionReasons.panCard}
              disabled={isSectionLocked(formData.panCardStatus)}
            />
            {errors.panCard && <p className="text-xs text-red-500 mt-1">{errors.panCard}</p>}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">All documents must be clear and readable. Accepted formats: JPG, PNG, PDF</p>
      </FormSection>

      {/* Section 7: Location */}
      <FormSection
        number={7}
        title="Venue Location"
        description="Enter your venue's address in Nepal"
        isComplete={isSectionComplete(7)}
        status={formData.locationStatus}
        isLocked={isSectionLocked(formData.locationStatus)}
        rejectionReason={rejectionReasons.location}
      >
        <div className="space-y-5">
          {/* Province and District Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.province}
                onChange={(e) => {
                  handleChange("province", e.target.value);
                  handleChange("district", "");
                  handleChange("municipality", "");
                }}
                disabled={isSectionLocked(formData.locationStatus)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] bg-white ${
                  isSectionLocked(formData.locationStatus) ? "bg-gray-50 cursor-not-allowed" :
                  errors.location && !formData.province ? "border-red-300" : "border-gray-200"
                }`}
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => {
                  handleChange("district", e.target.value);
                  handleChange("municipality", "");
                }}
                disabled={!formData.province || isSectionLocked(formData.locationStatus)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] bg-white ${
                  !formData.province || isSectionLocked(formData.locationStatus) ? "bg-gray-50 cursor-not-allowed" : ""
                } ${errors.location && !formData.district ? "border-red-300" : "border-gray-200"}`}
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Municipality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Municipality / Rural Municipality <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.municipality}
              onChange={(e) => handleChange("municipality", e.target.value)}
              disabled={!formData.district || isSectionLocked(formData.locationStatus)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] bg-white ${
                !formData.district || isSectionLocked(formData.locationStatus) ? "bg-gray-50 cursor-not-allowed" : ""
              } ${errors.location && !formData.municipality ? "border-red-300" : "border-gray-200"}`}
            >
              <option value="">Select Municipality</option>
              {municipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.name}>
                  {municipality.name}
                </option>
              ))}
            </select>
            {/* Show manual input option if no municipalities found */}
            {formData.district && municipalities.length === 0 && !isSectionLocked(formData.locationStatus) && (
              <input
                type="text"
                value={formData.municipality}
                onChange={(e) => handleChange("municipality", e.target.value)}
                placeholder="Enter municipality name"
                className="w-full mt-2 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f]"
              />
            )}
          </div>

          {/* Ward and Street Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ward No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ward No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.wardNo}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 35)) {
                    handleChange("wardNo", value);
                  }
                }}
                placeholder="e.g., 5"
                maxLength={2}
                disabled={isSectionLocked(formData.locationStatus)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] ${
                  isSectionLocked(formData.locationStatus) ? "bg-gray-50 cursor-not-allowed" :
                  errors.location && !formData.wardNo ? "border-red-300" : "border-gray-200"
                }`}
              />
            </div>

            {/* Street / Tole */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Street / Tole <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                placeholder="e.g., Milan Chowk, Kapan"
                disabled={isSectionLocked(formData.locationStatus)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d0f0f]/20 focus:border-[#5d0f0f] ${
                  isSectionLocked(formData.locationStatus) ? "bg-gray-50 cursor-not-allowed" :
                  errors.location && !formData.street ? "border-red-300" : "border-gray-200"
                }`}
              />
            </div>
          </div>

          {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}

          {/* Address Preview */}
          {formData.province && formData.district && formData.municipality && formData.wardNo && formData.street && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Complete Address</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formData.street}, Ward {formData.wardNo}, {formData.municipality}, {formData.district}, {provinces.find(p => p.id === parseInt(formData.province))?.name || ""}, Nepal
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This address will be shown to customers looking for your venue
          </p>
        </div>
      </FormSection>

      {/* Submit Button */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              By submitting, you confirm that all information provided is accurate and authentic.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl font-medium text-white transition-all ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#5d0f0f] hover:bg-[#4a0c0c]"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit for Verification"
            )}
          </button>
        </div>
      </div>

      {/* Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}

export default VenueRegistration;
