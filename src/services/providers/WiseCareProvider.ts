// =====================================================
// WiseCareProvider.ts
// Implementação do VideoProvider usando WiseCare
//
// SEGURANÇA: Credenciais ficam na Edge Function.
// Frontend recebe apenas sessionId + joinUrl.
// O iframe carrega diretamente da WiseCare.
// =====================================================

import { supabase } from '../../lib/supabase';
import type {
    VideoProvider,
    VideoSession,
    JoinSessionOptions,
    CreateSessionOptions,
    RecordingInfo,
} from '../VideoProviderRegistry';
import { VideoProviderType } from '../VideoProviderRegistry';

export class WiseCareProvider implements VideoProvider {
    readonly type = VideoProviderType.WISECARE;
    private iframeElement: HTMLIFrameElement | null = null;
    private isConferenceActive = false;

    // ─────────────────────────────────────────────
    // 1. Criar sessão via Edge Function (server-side)
    //    Credenciais NUNCA chegam aqui
    // ─────────────────────────────────────────────
    async createSession(options: CreateSessionOptions): Promise<VideoSession> {
        const { data, error } = await supabase.functions.invoke('wisecare-session', {
            body: {
                action: 'create',
                appointmentId: options.appointmentId,
                callType: options.callType || 'video',
                enableRecording: options.enableRecording ?? false,
            },
        });

        if (error || !data || !data.sessionId) {
            console.error('[WiseCare] Error creating session:', error || 'No Session ID');
            const msg = error?.message || (data && !data.sessionId ? 'WiseCare failed to return Session ID' : 'Unknown error');
            const status = (error as any)?.status || 'no-status';
            throw new Error(`Failed to create WiseCare session (Status: ${status}): ${msg}`);
        }

        return {
            sessionId: String(data.sessionId),
            roomId: String(data.roomId),
            joinUrl: data.joinUrl,
        };
    }

    // ─────────────────────────────────────────────
    // 2. Iniciar conferência (renderiza iframe seguro)
    //    Usa APENAS joinUrl — zero credenciais no browser
    // ─────────────────────────────────────────────
    async joinSession(session: VideoSession, options: JoinSessionOptions): Promise<void> {
        const container = document.getElementById(options.containerId);
        if (!container) {
            throw new Error(`Container element #${options.containerId} not found`);
        }

        if (!session.joinUrl) {
            throw new Error('No joinUrl provided. Session may not have been created correctly.');
        }

        try {
            // Limpar container
            container.innerHTML = '';

            // Criar iframe seguro apontando para WiseCare
            this.iframeElement = document.createElement('iframe');
            this.iframeElement.src = session.joinUrl;
            this.iframeElement.style.width = options.width || '100%';
            this.iframeElement.style.height = options.height || '100%';
            this.iframeElement.style.border = 'none';
            this.iframeElement.style.borderRadius = '12px';
            this.iframeElement.setAttribute('allow', 'camera; microphone; display-capture; autoplay');
            this.iframeElement.setAttribute('allowfullscreen', 'true');

            // Fallback/Timeout Inteligente: Se WiseCare não emitir conference:joined real em 12s, abortar e fazer fallback
            const connectionTimeout = setTimeout(() => {
                if (this.isConferenceActive) {
                    console.error('[WiseCare] Timeout waiting for conference to connect genuinely (XMPP auth failed?)');
                    options.onError?.(new Error('WiseCare Timeout: Conference failed to genuinely connect'));
                    this.endSession(session.sessionId).catch(() => {});
                }
            }, 12000);

            // Escutar eventos via postMessage
            const messageHandler = (event: MessageEvent) => {
                // VALIDAR ORIGIN
                if (!event.origin.includes('v4h.cloud') && !event.origin.includes('wisecare.com')) {
                    if (event.origin !== window.location.origin) return; // Permitir fallback se injetado localmente
                }

                const { type, data } = event.data || {};
                switch (type) {
                    case 'conference:joined':
                        clearTimeout(connectionTimeout); // Sucesso real
                        options.onConnect?.();
                        break;
                    case 'conference:left':
                    case 'conference:ended':
                        options.onDisconnect?.();
                        break;
                    case 'conference:error':
                        clearTimeout(connectionTimeout);
                        options.onError?.(new Error(data?.message || 'Conference error'));
                        break;
                    case 'participant:joined':
                        options.onParticipantJoined?.(data?.participantId);
                        break;
                    case 'participant:left':
                        options.onParticipantLeft?.(data?.participantId);
                        break;
                }
            };

            window.addEventListener('message', messageHandler);

            // Guardar handlers para cleanup
            (this.iframeElement as any)._messageHandler = messageHandler;
            (this.iframeElement as any)._timeoutInfo = connectionTimeout;

            // Inserir iframe no container
            container.appendChild(this.iframeElement);

            this.isConferenceActive = true;

            console.log('[WiseCare] Conference iframe loaded, waiting for genuine connection...', session.sessionId);

        } catch (err) {
            console.error('[WiseCare] Failed to start conference:', err);
            options.onError?.(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    }

    /**
     * Buscar uma sessão ativa para um appointment
     */
    async getSession(appointmentId: string): Promise<VideoSession | null> {
        try {
            const { data, error } = await supabase.functions.invoke('wisecare-session', {
                body: {
                    action: 'get',
                    appointmentId,
                },
            });

            if (error || !data || data.success === false) return null;

            return {
                sessionId: String(data.sessionId),
                roomId: String(data.roomId),
                joinUrl: data.joinUrl,
            };
        } catch (err) {
            console.error('[WiseCareProvider] Critical error fetching active session:', err);
            return null;
        }
    }

    // ─────────────────────────────────────────────
    // 3. Encerrar conferência
    // ─────────────────────────────────────────────
    async endSession(sessionId: string | number): Promise<void> {
        // Remover iframe e timeouts
        if (this.iframeElement) {
            const handler = (this.iframeElement as any)._messageHandler;
            const timeoutInfo = (this.iframeElement as any)._timeoutInfo;
            if (handler) {
                window.removeEventListener('message', handler);
            }
            if (timeoutInfo) {
                clearTimeout(timeoutInfo);
            }
            this.iframeElement.remove();
            this.iframeElement = null;
        }

        this.isConferenceActive = false;

        // Notificar Edge Function sobre encerramento
        await supabase.functions.invoke('wisecare-session', {
            body: {
                action: 'end',
                sessionId,
            },
        });

        console.log('[WiseCare] Conference ended, sessionId:', sessionId);
    }

    // ─────────────────────────────────────────────
    // 4. Obter gravação
    // ─────────────────────────────────────────────
    async getRecording(sessionId: string | number): Promise<RecordingInfo | null> {
        const { data, error } = await supabase.functions.invoke('wisecare-session', {
            body: {
                action: 'get-recording',
                sessionId,
            },
        });

        if (error || !data) return null;

        return {
            id: data.id,
            status: data.status,
            downloadUrl: data.downloadUrl,
            duration: data.duration,
            createdAt: data.createdAt,
        };
    }

    // ─────────────────────────────────────────────
    // 5. Limpar recursos
    // ─────────────────────────────────────────────
    destroy(): void {
        if (this.iframeElement) {
            const handler = (this.iframeElement as any)._messageHandler;
            const timeoutInfo = (this.iframeElement as any)._timeoutInfo;
            if (handler) {
                window.removeEventListener('message', handler);
            }
            if (timeoutInfo) {
                clearTimeout(timeoutInfo);
            }
            this.iframeElement.remove();
            this.iframeElement = null;
        }
        this.isConferenceActive = false;
    }
}
