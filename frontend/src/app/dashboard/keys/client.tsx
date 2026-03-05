"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/icons";
import {
    getKeyStatus,
    saveKeys,
    deleteKey,
    testProvider,
    type KeyStatusResponse,
    type ProviderStatus,
} from "@/lib/api";
import {
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    X,
    Trash2,
    AlertCircle,
    Loader2,
    Zap,
    Brain,
    AudioLines,
    Mic,
    Phone,
    Shield,
    ExternalLink,
    Circle,
} from "lucide-react";

// Provider metadata for display
const PROVIDER_META: Record<string, {
    icon: React.ElementType;
    description: string;
    docsUrl: string;
    keyLabels: Record<string, string>;
    keyPlaceholders: Record<string, string>;
}> = {
    livekit: {
        icon: Zap,
        description: "Real-time voice infrastructure — required for all voice features",
        docsUrl: "https://cloud.livekit.io",
        keyLabels: {
            livekit_api_key: "API Key",
            livekit_api_secret: "API Secret",
            livekit_url: "Server URL",
        },
        keyPlaceholders: {
            livekit_api_key: "API...",
            livekit_api_secret: "your_api_secret",
            livekit_url: "wss://your-project.livekit.cloud",
        },
    },
    google: {
        icon: Brain,
        description: "Gemini LLM for conversational intelligence",
        docsUrl: "https://aistudio.google.com/app/apikey",
        keyLabels: { google_api_key: "API Key" },
        keyPlaceholders: { google_api_key: "AIza..." },
    },
    resemble: {
        icon: AudioLines,
        description: "Text-to-speech for agent voice synthesis",
        docsUrl: "https://app.resemble.ai/account/api",
        keyLabels: { resemble_api_key: "API Key" },
        keyPlaceholders: { resemble_api_key: "your_resemble_api_key" },
    },
    assemblyai: {
        icon: Mic,
        description: "Speech-to-text provider",
        docsUrl: "https://www.assemblyai.com/dashboard",
        keyLabels: { assemblyai_api_key: "API Key" },
        keyPlaceholders: { assemblyai_api_key: "your_assemblyai_api_key" },
    },
    deepgram: {
        icon: Mic,
        description: "Speech-to-text provider",
        docsUrl: "https://console.deepgram.com",
        keyLabels: { deepgram_api_key: "API Key" },
        keyPlaceholders: { deepgram_api_key: "your_deepgram_api_key" },
    },
    elevenlabs: {
        icon: Mic,
        description: "Speech-to-text provider",
        docsUrl: "https://elevenlabs.io/app/settings/api-keys",
        keyLabels: { elevenlabs_api_key: "API Key" },
        keyPlaceholders: { elevenlabs_api_key: "sk_..." },
    },
    twilio: {
        icon: Phone,
        description: "Phone number management and SIP telephony",
        docsUrl: "https://console.twilio.com",
        keyLabels: {
            twilio_account_sid: "Account SID",
            twilio_auth_token: "Auth Token",
        },
        keyPlaceholders: {
            twilio_account_sid: "AC...",
            twilio_auth_token: "your_auth_token",
        },
    },
};

// STT providers for the dropdown
const STT_PROVIDERS = [
    { id: "assemblyai", label: "AssemblyAI" },
    { id: "deepgram", label: "Deepgram" },
    { id: "elevenlabs", label: "ElevenLabs" },
];

// Sections — STT is handled separately
const SECTIONS = [
    { label: "Required", providers: ["livekit", "google", "resemble", "twilio"] },
];

function ProviderCard({
    providerId,
    provider,
    meta,
    onSaved,
}: {
    providerId: string;
    provider: ProviderStatus;
    meta: typeof PROVIDER_META[string];
    onSaved: () => void;
}) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const Icon = meta.icon;
    const hasChanges = Object.values(values).some(v => v.length > 0);

    // Collect non-empty form values
    const getKeysToSave = () => {
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(values)) {
            if (v) result[k] = v;
        }
        return result;
    };

    const handleSave = async () => {
        const keysToSave = getKeysToSave();
        if (Object.keys(keysToSave).length === 0) return;

        setSaving(true);
        setTestResult(null);
        try {
            // Test with the new keys before saving
            const result = await testProvider(providerId, keysToSave);
            if (!result.success) {
                setTestResult(result);
                toast.error(result.message);
                return;
            }
            // Test passed — save to DB
            await saveKeys(keysToSave);
            toast.success(`${provider.label} keys saved`);
            setValues({});
            setTestResult({ success: true, message: "Connected and saved" });
            onSaved();
        } catch {
            toast.error(`Failed to save ${provider.label} keys`);
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            // Test with form values if entered, otherwise test existing keys
            const keysToTest = getKeysToSave();
            const result = await testProvider(providerId, Object.keys(keysToTest).length > 0 ? keysToTest : undefined);
            setTestResult(result);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Connection test failed");
        } finally {
            setTesting(false);
        }
    };

    return (
        <Card className="relative">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{provider.label}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {provider.configured ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Not configured
                            </Badge>
                        )}
                        <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </a>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(provider.keys).map(([keyName, keyInfo]) => (
                    <div key={keyName} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                {meta.keyLabels[keyName] || keyName}
                            </Label>
                            {keyInfo.status === "set" && (
                                <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${
                                        keyInfo.source === "db"
                                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    }`}>
                                        {keyInfo.source === "db" ? "via dashboard" : "via .env"}
                                    </Badge>
                                    {keyInfo.source === "db" && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await deleteKey(keyName);
                                                    toast.success("Key removed from dashboard");
                                                    onSaved();
                                                } catch {
                                                    toast.error("Failed to delete key");
                                                }
                                            }}
                                            className="ml-1 rounded p-1 bg-destructive/10 hover:bg-destructive/25 text-destructive transition-colors"
                                            title="Remove from dashboard"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                type={showValues[keyName] ? "text" : "password"}
                                placeholder={
                                    keyInfo.status === "set"
                                        ? "••••••••  (saved — enter new value to update)"
                                        : meta.keyPlaceholders[keyName] || "Enter key..."
                                }
                                value={values[keyName] || ""}
                                onChange={(e) => setValues(prev => ({ ...prev, [keyName]: e.target.value }))}
                                className="pr-10 font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowValues(prev => ({ ...prev, [keyName]: !prev[keyName] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showValues[keyName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                ))}

                {/* Test result */}
                {testResult && (
                    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                        testResult.success
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-destructive/10 text-destructive"
                    }`}>
                        {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {testResult.message}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                    >
                        {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Save
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTest}
                        disabled={testing}
                    >
                        {testing && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Test Connection
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function STTCard({
    providers,
    onSaved,
}: {
    providers: Record<string, ProviderStatus>;
    onSaved: () => void;
}) {
    const [selectedProvider, setSelectedProvider] = useState(() => {
        // Default to first configured provider, or assemblyai
        const configured = STT_PROVIDERS.find(p => providers[p.id]?.configured);
        return configured?.id || "assemblyai";
    });

    const provider = providers[selectedProvider];
    const meta = PROVIDER_META[selectedProvider];

    if (!provider || !meta) return null;

    return (
        <Card className="relative">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <Mic className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Speech-to-Text</CardTitle>
                            <CardDescription className="text-xs mt-0.5">At least one STT provider required</CardDescription>
                        </div>
                    </div>
                    <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Provider selector */}
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STT_PROVIDERS.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                        <Circle
                                            className={`h-2 w-2 ${
                                                providers[p.id]?.configured
                                                    ? "fill-emerald-500 text-emerald-500"
                                                    : "fill-muted-foreground/30 text-muted-foreground/30"
                                            }`}
                                        />
                                        {p.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Render the selected provider's key inputs */}
                <SelectedSTTProvider
                    providerId={selectedProvider}
                    provider={provider}
                    meta={meta}
                    onSaved={onSaved}
                />
            </CardContent>
        </Card>
    );
}

function SelectedSTTProvider({
    providerId,
    provider,
    meta,
    onSaved,
}: {
    providerId: string;
    provider: ProviderStatus;
    meta: typeof PROVIDER_META[string];
    onSaved: () => void;
}) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Reset state when provider changes
    useEffect(() => {
        setValues({});
        setShowValues({});
        setTestResult(null);
    }, [providerId]);

    const hasChanges = Object.values(values).some(v => v.length > 0);

    const getKeysToSave = () => {
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(values)) {
            if (v) result[k] = v;
        }
        return result;
    };

    const handleSave = async () => {
        const keysToSave = getKeysToSave();
        if (Object.keys(keysToSave).length === 0) return;

        setSaving(true);
        setTestResult(null);
        try {
            const result = await testProvider(providerId, keysToSave);
            if (!result.success) {
                setTestResult(result);
                toast.error(result.message);
                return;
            }
            await saveKeys(keysToSave);
            toast.success(`${provider.label} key saved`);
            setValues({});
            setTestResult({ success: true, message: "Connected and saved" });
            onSaved();
        } catch {
            toast.error(`Failed to save ${provider.label} key`);
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const keysToTest = getKeysToSave();
            const result = await testProvider(providerId, Object.keys(keysToTest).length > 0 ? keysToTest : undefined);
            setTestResult(result);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Connection test failed");
        } finally {
            setTesting(false);
        }
    };

    return (
        <>
            {/* Status badge */}
            <div className="flex items-center gap-2">
                {provider.configured ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not configured
                    </Badge>
                )}
            </div>

            {/* ElevenLabs permission note */}
            {providerId === "elevenlabs" && (
                <p className="text-xs text-muted-foreground">
                    <span className="text-amber-500 font-medium">Note:</span> Enable &quot;Speech to Text&quot; and &quot;Voices Read&quot; permissions when creating your ElevenLabs API key.
                </p>
            )}

            {/* Key inputs */}
            {Object.entries(provider.keys).map(([keyName, keyInfo]) => (
                <div key={keyName} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            {meta.keyLabels[keyName] || keyName}
                        </Label>
                        {keyInfo.status === "set" && (
                            <div className="flex items-center gap-1">
                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${
                                    keyInfo.source === "db"
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }`}>
                                    {keyInfo.source === "db" ? "via dashboard" : "via .env"}
                                </Badge>
                                {keyInfo.source === "db" && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await deleteKey(keyName);
                                                toast.success("Key removed from dashboard");
                                                onSaved();
                                            } catch {
                                                toast.error("Failed to delete key");
                                            }
                                        }}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                        title="Remove from dashboard"
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            type={showValues[keyName] ? "text" : "password"}
                            placeholder={
                                keyInfo.status === "set"
                                    ? "••••••••  (saved — enter new value to update)"
                                    : meta.keyPlaceholders[keyName] || "Enter key..."
                            }
                            value={values[keyName] || ""}
                            onChange={(e) => setValues(prev => ({ ...prev, [keyName]: e.target.value }))}
                            className="pr-10 font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowValues(prev => ({ ...prev, [keyName]: !prev[keyName] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showValues[keyName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            ))}

            {/* Test result */}
            {testResult && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                    testResult.success
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-destructive/10 text-destructive"
                }`}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResult.message}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Save
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing}
                >
                    {testing && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Test Connection
                </Button>
            </div>
        </>
    );
}

export function APIKeysClient() {
    const [status, setStatus] = useState<KeyStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getKeyStatus();
            setStatus(data);
        } catch {
            toast.error("Failed to load key status");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">API Keys</h1>
                <p className="text-muted-foreground">
                    Configure your provider credentials. Keys are encrypted and stored securely.
                </p>
            </div>

            {/* Status banner */}
            {status && !status.all_required_set && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                    <Shield className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium text-amber-600">Missing required keys</p>
                        <p className="text-muted-foreground mt-0.5">
                            Configure all required provider keys below to enable voice features.
                            {!status.stt_configured && " You need at least one STT provider."}
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner className="h-6 w-6" />
                </div>
            ) : status ? (
                <div className="space-y-6">
                    {/* 2-column grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {SECTIONS[0].providers
                            .filter(id => status.providers[id])
                            .map(id => (
                                <ProviderCard
                                    key={id}
                                    providerId={id}
                                    provider={status.providers[id]}
                                    meta={PROVIDER_META[id]}
                                    onSaved={fetchStatus}
                                />
                            ))}

                        {/* STT card in the grid */}
                        <STTCard
                            providers={Object.fromEntries(
                                STT_PROVIDERS.map(p => [p.id, status.providers[p.id]])
                                    .filter(([, v]) => v)
                            )}
                            onSaved={fetchStatus}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
