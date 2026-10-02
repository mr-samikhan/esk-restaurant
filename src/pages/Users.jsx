import { useState, useEffect } from "react";
import { API } from "../constants/apiEndPoints";
import {
  UserPlus,
  Trash2,
  Edit2,
  ShieldCheck,
  User,
  Search,
  KeyRound,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "cashier",
    is_active: 1,
  });

  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await API.auth.getUsers();
      if (res?.success) {
        setUsers(res.users || []);
      } else {
        setUsers(res || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    setError("");
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "", // Leave blank unless changing
        full_name: user.full_name || "",
        role: user.role || "cashier",
        is_active: user.is_active ?? 1,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        full_name: "",
        role: "cashier",
        is_active: 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editingUser && !formData.password) {
      setError("Password is required for new users.");
      return;
    }

    try {
      let res;
      if (editingUser) {
        res = await API.auth.updateUser(editingUser.id, formData);
      } else {
        res = await API.auth.createUser(formData);
      }

      if (res?.success) {
        handleCloseModal();
        loadUsers();
      } else {
        setError(res?.error || "Failed to save user.");
      }
    } catch (err) {
      console.error("User save error:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleDelete = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        const res = await API.auth.deleteUser(id);
        if (res?.success) {
          loadUsers();
        } else {
          alert(res?.error || "Could not delete user.");
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name &&
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-7 h-7 text-blue-600" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system operators, admins, and cashiers
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* SEARCH AND CONTROLS */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username or full name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* USER TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b">
              <th className="p-4">User Details</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center text-gray-400 italic"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">
                      {u.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      {u.full_name || "—"}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {u.role === "admin" && (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                        <XCircle className="w-4 h-4" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {u.created_date
                      ? new Date(u.created_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(u)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {editingUser
                  ? `Edit User: ${editingUser.username}`
                  : "Create New Operator"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              {/* USERNAME */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser} // Prevent editing username once created
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  placeholder="e.g. cashier_john"
                />
              </div>

              {/* FULL NAME */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                  Password {editingUser && "(Leave blank to keep unchanged)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder={editingUser ? "••••••••" : "Enter password"}
                />
              </div>

              {/* ROLE */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  User Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cashier">Cashier (Operate POS only)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="manager">
                    Manager (POS + Inventory/Reports)
                  </option>
                </select>
              </div>

              {/* STATUS TOGGLE */}
              {editingUser && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active === 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active Account
                  </label>
                </div>
              )}

              {/* MODAL ACTIONS */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
