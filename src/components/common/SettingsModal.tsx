import { useState } from 'react';
import { useUIStore } from '../../store';
import { Modal, Button, Input } from './index';
import { AVAILABLE_MODELS } from '../../lib/api';
import { cn } from '../../utils/cn';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, apiKey, setApiKey, selectedModel, setSelectedModel, showArchived, toggleShowArchived } = useUIStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(tempApiKey);
    setSettingsModalOpen(false);
  };

  const handleClose = () => {
    setTempApiKey(apiKey);
    setSettingsModalOpen(false);
  };

  return (
    <Modal
      isOpen={settingsModalOpen}
      onClose={handleClose}
      title="Settings"
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* API Key */}
        <div>
          <Input
            label="Gemini API Key"
            type="password"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <div className="space-y-2">
            {AVAILABLE_MODELS.map((model) => (
              <label
                key={model.id}
                className={cn(
                  'flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors',
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="model"
                  value={model.id}
                  checked={selectedModel === model.id}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="sr-only"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{model.name}</p>
                  <p className="text-xs text-gray-500">{model.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Options
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={toggleShowArchived}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show archived nodes</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
