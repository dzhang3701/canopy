/**
 * Node Action Modal Component
 *
 * Modal for confirming archive/delete actions on nodes.
 * Provides options for handling children nodes.
 */

import React from 'react';
import { X, Archive, Trash2, AlertTriangle } from 'lucide-react';

export type ActionType = 'archive' | 'delete';

export interface NodeActionModalProps {
  isOpen: boolean;
  actionType: ActionType;
  isRootNode: boolean;
  hasChildren: boolean;
  nodeSummary: string;
  onConfirm: (includeChildren: boolean, deleteAll?: boolean) => void;
  onCancel: () => void;
}

const NodeActionModal: React.FC<NodeActionModalProps> = ({
  isOpen,
  actionType,
  isRootNode,
  hasChildren,
  nodeSummary,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isArchive = actionType === 'archive';
  const actionVerb = isArchive ? 'Archive' : 'Delete';
  const actionVerbLower = isArchive ? 'archive' : 'delete';
  const Icon = isArchive ? Archive : Trash2;
  const iconColor = isArchive ? 'text-amber-500' : 'text-red-500';
  const buttonColor = isArchive
    ? 'bg-amber-500 hover:bg-amber-600'
    : 'bg-red-500 hover:bg-red-600';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-green-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isArchive ? 'bg-amber-50' : 'bg-red-50'}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <h3 className="font-semibold text-green-800">{actionVerb} Node</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-sm text-green-700 mb-2">
            {isRootNode ? (
              <>
                <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
                This is the <strong>root node</strong> of the project.
              </>
            ) : (
              <>
                {actionVerb} "<span className="font-medium">{nodeSummary}</span>"?
              </>
            )}
          </p>

          {hasChildren && !isRootNode && (
            <p className="text-xs text-green-500 mb-4">
              This node has children. Choose how to handle them.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-green-50/50 border-t border-green-100 space-y-2">
          {isRootNode ? (
            <>
              {/* Root node options */}
              <button
                onClick={() => onConfirm(true, true)}
                className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-medium ${buttonColor} transition-colors`}
              >
                {actionVerb} entire project
              </button>
              {hasChildren && (
                <button
                  onClick={() => onConfirm(true, false)}
                  className="w-full py-2.5 px-4 rounded-lg text-green-700 text-sm font-medium bg-white border border-green-300 hover:bg-green-50 transition-colors"
                >
                  {actionVerb} children only (keep root)
                </button>
              )}
            </>
          ) : (
            <>
              {/* Regular node options */}
              {hasChildren ? (
                <>
                  <button
                    onClick={() => onConfirm(true)}
                    className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-medium ${buttonColor} transition-colors`}
                  >
                    {actionVerb} node and all children
                  </button>
                  <button
                    onClick={() => onConfirm(false)}
                    className="w-full py-2.5 px-4 rounded-lg text-green-700 text-sm font-medium bg-white border border-green-300 hover:bg-green-50 transition-colors"
                  >
                    {actionVerb} only this node (promote children)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onConfirm(false)}
                  className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-medium ${buttonColor} transition-colors`}
                >
                  {actionVerb} this node
                </button>
              )}
            </>
          )}

          <button
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-lg text-green-500 text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeActionModal;
