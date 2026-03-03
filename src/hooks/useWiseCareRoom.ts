// =====================================================
// useWiseCareRoom.ts
// Hook React que encapsula o WiseCare SDK
// Substitui useWebRTCRoom na VideoCall.tsx
// =====================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
    VideoSession,
    CreateSessionOptions,
    RecordingInfo,
} from '../services/VideoProviderRegistry';
import { WiseCareProvider } from '../services/providers/WiseCareProvider';

interface UseWiseCareRoomOptions {
    containerId?: string;         // ID da div do iframe (default: 'wisecare-container')
    appointmentId?: string;       // ID do appointment MedCannLab
    autoJoin?: boolean;           // Auto-join ao criar sessão
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    enableRecording?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}

interface UseWiseCareRoomReturn {
    // Estado
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    session: VideoSession | null;
    recording: RecordingInfo | null;

    // Ações
    createAndJoin: (options?: Partial<CreateSessionOptions>) => Promise<void>;
    endCall: () => Promise<void>;
    getRecording: () => Promise<RecordingInfo | null>;
}

export function useWiseCareRoom(options: UseWiseCareRoomOptions = {}): UseWiseCareRoomReturn {
    const {
        containerId = 'wisecare-container',
        appointmentId,
        autoJoin = true,
        startWithAudioMuted = false,
        startWithVideoMuted = false,
        enableRecording = false,
        onConnect,
        onDisconnect,
        onError,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<VideoSession | null>(null);
    const [recording, setRecording] = useState<RecordingInfo | null>(null);

    const providerRef = useRef<WiseCareProvider | null>(null);

    // Inicializar provider
    useEffect(() => {
        providerRef.current = new WiseCareProvider();

        return () => {
            providerRef.current?.destroy();
            providerRef.current = null;
        };
    }, []);

    // Criar sessão e entrar na conferência
    const createAndJoin = useCallback(async (createOptions?: Partial<CreateSessionOptions>) => {
        if (!providerRef.current) {
            setError('Provider not initialized');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // 1. Criar sessão via Edge Function
            const newSession = await providerRef.current.createSession({
                appointmentId: createOptions?.appointmentId || appointmentId,
                callType: createOptions?.callType || 'video',
                enableRecording: createOptions?.enableRecording ?? enableRecording,
                ...createOptions,
            });

            setSession(newSession);

            // 2. Entrar na conferência (renderiza iframe)
            if (autoJoin) {
                await providerRef.current.joinSession(newSession, {
                    containerId,
                    startWithAudioMuted,
                    startWithVideoMuted,
                    width: '100%',
                    height: '100%',
                    buttons: [
                        'camera',
                        'microphone',
                        'desktop',
                        'chat',
                        'raisehand',
                        'hangup',
                        'settings',
                        'fullscreen',
                    ],
                    onConnect: () => {
                        setIsConnected(true);
                        setIsConnecting(false);
                        onConnect?.();
                    },
                    onDisconnect: () => {
                        setIsConnected(false);
                        onDisconnect?.();
                    },
                    onError: (err) => {
                        setError(err.message);
                        setIsConnecting(false);
                        onError?.(err);
                    },
                });
            }

            setIsConnecting(false);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create WiseCare session';
            setError(errorMessage);
            setIsConnecting(false);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
        }
    }, [appointmentId, autoJoin, containerId, enableRecording, startWithAudioMuted, startWithVideoMuted, onConnect, onDisconnect, onError]);

    // Encerrar chamada
    const endCall = useCallback(async () => {
        if (!providerRef.current || !session) return;

        try {
            await providerRef.current.endSession(session.sessionId);
            setIsConnected(false);
            setSession(null);
            onDisconnect?.();
        } catch (err) {
            console.error('[useWiseCareRoom] Error ending call:', err);
            setError(err instanceof Error ? err.message : 'Failed to end call');
        }
    }, [session, onDisconnect]);

    // Buscar gravação
    const getRecordingFn = useCallback(async (): Promise<RecordingInfo | null> => {
        if (!providerRef.current || !session) return null;

        try {
            const rec = await providerRef.current.getRecording(session.sessionId);
            setRecording(rec);
            return rec;
        } catch {
            return null;
        }
    }, [session]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (providerRef.current && session) {
                providerRef.current.endSession(session.sessionId).catch(console.error);
            }
        };
    }, [session]);

    return {
        isConnected,
        isConnecting,
        error,
        session,
        recording,
        createAndJoin,
        endCall,
        getRecording: getRecordingFn,
    };
}
