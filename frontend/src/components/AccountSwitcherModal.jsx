import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import { useMultiAccount } from "@contexts/MultiAccountContext";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const AccountSwitcherModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedAccounts, switchAccount, removeAccount, switching } = useMultiAccount();

  if (!isOpen) return null;

  const handleSelectAccount = async (acc) => {
    if (acc.id === user?.id) {
      onClose();
      return;
    }

    const res = await switchAccount(acc);
    if (res?.success) {
      onClose();
      navigate("/dashboard");
    } else if (res?.requireLogin || !res?.success) {
      onClose();
      navigate("/login", { state: { prefillEmail: acc.email || acc.username } });
    }
  };

  const handleAddAccount = () => {
    onClose();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Switch Workspace
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Select an account or add another workspace profile.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Account List */}
            <div className="p-3 max-h-72 overflow-y-auto space-y-1">
              {savedAccounts.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  No saved accounts found.
                </div>
              ) : (
                savedAccounts.map((acc) => {
                  const isActive = acc.id === user?.id;
                  const initial = acc.fullName ? acc.fullName.charAt(0).toUpperCase() : acc.username?.charAt(0).toUpperCase() || "?";

                  return (
                    <div
                      key={acc.id}
                      onClick={() => !switching && handleSelectAccount(acc)}
                      className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/80"
                          : "bg-transparent border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:border-neutral-200/60 dark:hover:border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                            isActive
                              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700 transition-colors"
                          }`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {acc.fullName || acc.username}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {acc.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {switching && isActive ? (
                          <LoadingSpinner size="small" text="" />
                        ) : !isActive ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAccount(acc.id);
                            }}
                            title="Remove account"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddAccount}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add another workspace account</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AccountSwitcherModal;
