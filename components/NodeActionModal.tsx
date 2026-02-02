
import React from 'react';
import { X, Archive, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';

export type ActionType = 'archive' | 'delete' | 'unarchive';

export interface NodeActionModalProps {
  isOpen: boolean;
  actionType: ActionType;
  isRootNode: boolean;
  hasChildren: boolean;
  nodeSummary: string;
  isDarkMode: boolean;
  onConfirm: (includeChildren: boolean, deleteAll?: boolean) => void;
  onCancel: () => void;
}

const NodeActionModal: React.FC<NodeActionModalProps> = ({
  isOpen,
  actionType,
  isRootNode,
  hasChildren,
  nodeSummary,
  isDarkMode,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isArchive = actionType === 'archive';
  const isUnarchive = actionType === 'unarchive';
  const isDelete = actionType === 'delete';

  const actionVerb = isArchive ? 'Archive' : isUnarchive ? 'Unarchive' : 'Delete';
  const Icon = isArchive ? RotateCcw : isUnarchive ? RotateCcw : Trash2; // Wait, Unarchive and Archive both RotateCcw? No, Archive should be Archive.

  const isActualArchive = actionType === 'archive';
  const RealIcon = isActualArchive ? Archive : isUnarchive ? RotateCcw : Trash2;

  const iconBgColor = isDelete ? 'bg-red-500/10' : isArchive ? 'bg-amber-500/10' : 'bg-canopy-500/10';
  const iconColor = isDelete ? 'text-red-500' : isArchive ? 'text-amber-500' : 'text-canopy-500';
  const primaryBtnColor = isDelete
    ? 'bg-red-600 hover:bg-red-700'
    : isArchive
      ? 'bg-amber-600 hover:bg-amber-700'
      : 'bg-canopy-600 hover:bg-canopy-700';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-950/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-premium animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-dark-900 border-dark-800' : 'bg-white border-canopy-100'
        }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isDarkMode ? 'border-dark-800' : 'border-canopy-50'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-2xl ${iconBgColor}`}>
              <RealIcon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <h3 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-dark-100' : 'text-dark-900'}`}>
              {actionVerb} Node
            </h3>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-dark-800 text-dark-400' : 'hover:bg-canopy-50 text-dark-300'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className={`text-sm leading-relaxed ${isDarkMode ? 'text-dark-300' : 'text-dark-600'}`}>
            {isRootNode ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p>This is the <span className="font-bold text-amber-600">root node</span> of your project. Actions here will affect the entire conversation tree.</p>
              </div>
            ) : (
              <p className="mb-2">Are you sure you want to {actionVerb.toLowerCase()} <span className={`font-bold ${isDarkMode ? 'text-dark-100' : 'text-dark-900'}`}>"{nodeSummary}"</span>?</p>
            )}

            {hasChildren && !isRootNode && !isUnarchive && (
              <p className={`text-xs mt-3 p-3 rounded-xl ${isDarkMode ? 'bg-dark-800 text-dark-400' : 'bg-canopy-50/50 text-dark-500'}`}>
                This node has active sub-branches. Choose an option below to decide their fate.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`px-6 py-6 border-t flex flex-col gap-3 ${isDarkMode ? 'border-dark-800 bg-dark-950/50' : 'border-canopy-50 bg-canopy-50/10'}`}>
          {isUnarchive ? (
            <button
              onClick={() => onConfirm(true)}
              className={`w-full py-3.5 px-6 rounded-2xl text-white text-sm font-bold shadow-sm transition-all ${primaryBtnColor}`}
            >
              Confirm Unarchive
            </button>
          ) : isRootNode ? (
            <>
              <button
                onClick={() => onConfirm(true, true)}
                className={`w-full py-3.5 px-6 rounded-2xl text-white text-sm font-bold shadow-sm transition-all ${primaryBtnColor}`}
              >
                {actionVerb} entire project
              </button>
              {hasChildren && (
                <button
                  onClick={() => onConfirm(true, false)}
                  className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all border shadow-sm ${isDarkMode
                    ? 'bg-dark-800 border-dark-700 text-dark-200 hover:bg-dark-700'
                    : 'bg-white border-canopy-200 text-dark-700 hover:bg-canopy-50'
                    }`}
                >
                  {actionVerb} children only (keep root)
                </button>
              )}
            </>
          ) : (
            <>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => onConfirm(true)}
                    className={`w-full py-3.5 px-6 rounded-2xl text-white text-sm font-bold shadow-sm transition-all ${primaryBtnColor}`}
                  >
                    {actionVerb} node and all children
                  </button>
                  <button
                    onClick={() => onConfirm(false)}
                    className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all border shadow-sm ${isDarkMode
                      ? 'bg-dark-800 border-dark-700 text-dark-200 hover:bg-dark-700'
                      : 'bg-white border-canopy-200 text-dark-700 hover:bg-canopy-50'
                      }`}
                  >
                    {actionVerb} only this node (promote children)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onConfirm(false)}
                  className={`w-full py-3.5 px-6 rounded-2xl text-white text-sm font-bold shadow-sm transition-all ${primaryBtnColor}`}
                >
                  Confirm {actionVerb}
                </button>
              )}
            </>
          )}

          <button
            onClick={onCancel}
            className={`w-full py-3 px-6 rounded-2xl text-sm font-bold transition-colors ${isDarkMode ? 'text-dark-500 hover:text-dark-300' : 'text-dark-400 hover:text-dark-600'
              }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeActionModal;
