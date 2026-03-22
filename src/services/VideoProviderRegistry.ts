// =====================================================
// VideoProviderRegistry.ts
// Camada de abstração para providers de video call
// Extensível: WiseCare, WebRTC, Daily, Twilio, etc.
// =====================================================

export enum VideoProviderType {
    WISECARE = 'wisecare',
    WEBRTC = 'webrtc',
}

// Resultado da criação de sessão
export interface VideoSession {
    sessionId: string | number;
    roomId?: string;
    token?: string;
    joinUrl?: string;
    expiresAt?: string;
    metadata?: Record<string, unknown>;
}

// Opções para iniciar conferência
export interface JoinSessionOptions {
    containerId: string;        // ID da div onde o iframe será renderizado
    width?: string;             // e.g. '100%'
    height?: string;            // e.g. '600px'
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    buttons?: string[];         // Botões visíveis na toolbar
    logo?: string;              // URL do logo da organização
    shareLink?: string;         // Link personalizado de compartilhamento
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onParticipantJoined?: (participantId: string) => void;
    onParticipantLeft?: (participantId: string) => void;
}

// Opções para criar sessão
export interface CreateSessionOptions {
    appointmentId?: string;     // ID do appointment no MedCannLab
    patientId?: string;         // Apenas para log interno (NÃO enviado ao provider)
    professionalId?: string;    // Apenas para log interno
    callType?: 'video' | 'audio';
    enableRecording?: boolean;
}

// Status de gravação
export interface RecordingInfo {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
    downloadUrl?: string;
    duration?: number;
    createdAt?: string;
}

// Interface principal — qualquer provider implementa isto
export interface VideoProvider {
    readonly type: VideoProviderType;

    // Criar sessão no backend (via Edge Function)
    createSession(options: CreateSessionOptions): Promise<VideoSession>;

    // Renderizar conferência na div
    joinSession(session: VideoSession, options: JoinSessionOptions): Promise<void>;

    // Encerrar conferência
    endSession(sessionId: string | number): Promise<void>;

    // Obter gravação (se disponível)
    getRecording(sessionId: string | number): Promise<RecordingInfo | null>;

    // Limpar recursos
    destroy(): void;
}

// Registry — resolve o provider correto baseado em config
const PROVIDER_CONFIG_KEY = 'VITE_VIDEO_PROVIDER';

let currentProvider: VideoProvider | null = null;

export async function resolveVideoProvider(): Promise<VideoProvider> {
    if (currentProvider) return currentProvider;

    const providerType = (
        import.meta.env[PROVIDER_CONFIG_KEY] || 'wisecare'
    ) as VideoProviderType;

    switch (providerType) {
        case VideoProviderType.WISECARE: {
            const { WiseCareProvider } = await import('./providers/WiseCareProvider');
            currentProvider = new WiseCareProvider();
            break;
        }

        case VideoProviderType.WEBRTC:
            // Fallback P2P (usa useWebRTCRoom existente)
            throw new Error('WebRTC provider not yet implemented via registry. Use useWebRTCRoom directly.');

        default:
            throw new Error(`Unknown video provider: ${providerType}`);
    }

    return currentProvider;
}

// Reset provider (para testes ou hot-reload)
export function resetVideoProvider(): void {
    if (currentProvider) {
        currentProvider.destroy();
        currentProvider = null;
    }
}
