import { useState } from 'react';
import { useUIStore, useProjectStore } from '../../store';
import { Modal, Button, Input } from '../common';
import { projectTemplates } from '../../lib/templates';
import { cn } from '../../utils/cn';

export function CreateProjectModal() {
  const { createProjectModalOpen, setCreateProjectModalOpen } = useUIStore();
  const { createProject } = useProjectStore();

  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank');

  const handleCreate = () => {
    if (!name.trim()) return;

    const template = projectTemplates.find((t) => t.id === selectedTemplateId);
    createProject(name.trim(), template?.systemPrompt || '');

    setName('');
    setSelectedTemplateId('blank');
    setCreateProjectModalOpen(false);
  };

  const handleClose = () => {
    setName('');
    setSelectedTemplateId('blank');
    setCreateProjectModalOpen(false);
  };

  return (
    <Modal
      isOpen={createProjectModalOpen}
      onClose={handleClose}
      title="Create New Project"
      className="max-w-lg"
    >
      <div className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template
          </label>
          <div className="grid grid-cols-2 gap-2">
            {projectTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-colors',
                  selectedTemplateId === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{template.icon}</span>
                  <span className="font-medium text-sm">{template.name}</span>
                </div>
                <p className="text-xs text-gray-500">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}
