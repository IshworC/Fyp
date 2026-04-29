import React, { useState, useEffect } from "react";
import { adminAPI, getImageUrl } from "../../services/api";
import { FaUserCircle, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEye } from "react-icons/fa";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers(token);
      if (response.success) {
        setUsers(response.users || []);
      } else {
        setError(response.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <FaCheckCircle className="text-emerald-500" />;
      case 'REJECTED': return <FaTimesCircle className="text-red-500" />;
      case 'PENDING': return <FaClock className="text-amber-500" />;
      default: return <FaClock className="text-gray-300" />;
    }
  };

  const UserDocsModal = ({ user, onClose }) => {
    if (!user || !user.registration) return null;
    const { registration } = user;
    const docs = registration.documents || {};

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-night-blue text-white">
            <div>
              <h2 className="text-2xl font-black">{user.name}'s Documents</h2>
              <p className="text-white/70 text-sm">{registration.venueName || 'Venue Registration'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <FaTimesCircle className="text-2xl" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50">
            {/* Citizenship Front */}
            <div className="space-y-3">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Citizenship Front</p>
              <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group relative">
                {docs.citizenshipFront?.url ? (
                  <img src={getImageUrl(docs.citizenshipFront.url)} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 italic">Not Uploaded</div>
                )}
              </div>
            </div>

            {/* Citizenship Back */}
            <div className="space-y-3">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Citizenship Back</p>
              <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
                {docs.citizenshipBack?.url ? (
                  <img src={getImageUrl(docs.citizenshipBack.url)} alt="Back" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 italic">Not Uploaded</div>
                )}
              </div>
            </div>

            {/* Business Registration */}
            <div className="space-y-3">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Business Registration</p>
              <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
                {docs.businessRegistration?.url ? (
                  <img src={getImageUrl(docs.businessRegistration.url)} alt="Business" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 italic">Not Uploaded</div>
                )}
              </div>
            </div>

            {/* PAN Card */}
            <div className="space-y-3">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">PAN Card</p>
              <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
                {docs.panCard?.url ? (
                  <img src={getImageUrl(docs.panCard.url)} alt="PAN" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 italic">Not Uploaded</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
            <button onClick={onClose} className="px-8 py-3 bg-night-blue text-white rounded-xl font-black uppercase tracking-widest hover:bg-night-blue-shadow transition">
              Close Preview
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-night-blue/20 border-t-night-blue rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-night-blue-shadow">User Management</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor all platform users and verify venue owner credentials.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Users</p>
          <p className="text-3xl font-black text-night-blue">{users.length}</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-xl">{error}</div>}

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                        {user.registration?.profileImage?.url ? (
                          <img src={getImageUrl(user.registration.profileImage.url)} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <FaUserCircle className="text-2xl" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-night-blue-shadow">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 
                      user.role === 'venue-owner' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {user.role === 'venue-owner' ? (
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.registration?.registrationStatus)}
                        <span className="text-xs font-bold text-gray-600">
                          {user.registration?.registrationStatus || 'NOT STARTED'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic font-medium">N/A</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {user.role === 'venue-owner' && user.registration && (
                      <button 
                        onClick={() => { setSelectedUser(user); setShowDocModal(true); }}
                        className="px-4 py-2 bg-night-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-night-blue-shadow transition flex items-center gap-2 ml-auto"
                      >
                        <FaEye /> View Documents
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDocModal && <UserDocsModal user={selectedUser} onClose={() => setShowDocModal(false)} />}
    </div>
  );
}

export default AdminUsers;
