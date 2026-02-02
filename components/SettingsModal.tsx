import React from 'react';
import { X, Moon, Sun, Monitor, Cpu, Check, Eye, EyeOff, Key } from 'lucide-react';
import { MODELS, GeminiModelId } from '../services/geminiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModel: GeminiModelId;
    onSelectModel: (id: GeminiModelId) => void;
    userApiKey: string;
    onSetApiKey: (key: string) => void;
    theme: 'light' | 'dark' | 'system';
    onSelectTheme: (theme: 'light' | 'dark' | 'system') => void;
    isDarkMode: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    selectedModel,
    onSelectModel,
    userApiKey,
    onSetApiKey,
    theme,
    onSelectTheme,
    isDarkMode
}) => {
    const [showKey, setShowKey] = React.useState(false);
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md glass rounded-3xl shadow-2xl overflow-hidden border ${isDarkMode ? 'border-dark-800' : 'border-canopy-100'
                    } animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-canopy-100 dark:border-dark-800">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-canopy-500/10 text-canopy-400' : 'bg-canopy-50 text-canopy-600'}`}>
                            <Cpu className="w-4 h-4" />
                        </div>
                        <h2 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-dark-900'}`}>Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-dark-800 text-dark-400' : 'hover:bg-canopy-50 text-dark-500'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* API Key Selection */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
                                Gemini API Key
                            </h3>
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${isDarkMode ? 'text-canopy-400 hover:text-canopy-300' : 'text-canopy-600 hover:text-canopy-700'
                                    }`}
                            >
                                {showKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
                                <Key className="w-4 h-4" />
                            </div>
                            <input
                                type={showKey ? "text" : "password"}
                                value={userApiKey}
                                onChange={(e) => onSetApiKey(e.target.value)}
                                placeholder="Paste your API key here..."
                                className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm transition-all border outline-none ${isDarkMode
                                    ? 'bg-dark-900/50 border-dark-800 text-dark-100 focus:border-canopy-500/50 focus:bg-dark-900'
                                    : 'bg-white border-canopy-50 text-dark-900 focus:border-canopy-200 shadow-sm focus:shadow-md'
                                    }`}
                            />
                        </div>
                        <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-dark-600' : 'text-dark-400'}`}>
                            Your key is stored locally in your browser. If left empty, the application will attempt to use the developer's key.
                        </p>
                    </section>

                    {/* Model Selection */}
                    <section className="space-y-4">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
                            AI Model
                        </h3>
                        <div className="grid gap-2">
                            {MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => onSelectModel(model.id)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all border ${selectedModel === model.id
                                        ? (isDarkMode ? 'bg-canopy-500/10 border-canopy-500/50 text-canopy-400' : 'bg-canopy-50 border-canopy-200 text-canopy-700')
                                        : (isDarkMode ? 'bg-dark-900/50 border-dark-800 text-dark-400 hover:border-dark-700' : 'bg-white border-canopy-50 text-dark-600 hover:border-canopy-100 shadow-sm')
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Cpu className={`w-4 h-4 ${selectedModel === model.id ? 'text-canopy-500' : 'opacity-50'}`} />
                                        <span className="font-semibold text-sm">{model.name}</span>
                                    </div>
                                    {selectedModel === model.id && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Theme Selection */}
                    <section className="space-y-4">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-dark-500' : 'text-dark-400'}`}>
                            Appearance
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'light', name: 'Light', icon: Sun },
                                { id: 'dark', name: 'Dark', icon: Moon },
                                { id: 'system', name: 'System', icon: Monitor },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => onSelectTheme(t.id as 'light' | 'dark' | 'system')}
                                    className={`flex flex-col items-center gap-2 px-3 py-4 rounded-2xl transition-all border ${theme === t.id
                                        ? (isDarkMode ? 'bg-canopy-500/10 border-canopy-500/50 text-canopy-400' : 'bg-canopy-50 border-canopy-200 text-canopy-700')
                                        : (isDarkMode ? 'bg-dark-900/50 border-dark-800 text-dark-400 hover:border-dark-700' : 'bg-white border-canopy-50 text-dark-600 hover:border-canopy-100 shadow-sm')
                                        }`}
                                >
                                    <t.icon className={`w-5 h-5 ${theme === t.id ? 'text-canopy-500' : 'opacity-50'}`} />
                                    <span className="font-semibold text-xs">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 bg-dark-950/5 dark:bg-black/20 flex justify-end`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${isDarkMode ? 'bg-canopy-500 text-white hover:bg-canopy-400' : 'bg-canopy-600 text-white hover:bg-canopy-500 shadow-lg shadow-canopy-500/20'
                            }`}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
