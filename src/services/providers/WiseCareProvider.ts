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

        if (error || !data) {
            console.error('[WiseCare] Error creating session:', error);
            throw new Error(`Failed to create WiseCare session: ${error?.message || 'Unknown error'}`);
        }

        return {
            sessionId: data.sessionId,
            roomId: data.roomId,
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

            // Escutar eventos via postMessage (se WiseCare emitir)
            const messageHandler = (event: MessageEvent) => {
                // VALIDAR ORIGIN — segurança anti-injection
                if (!event.origin.includes('v4h.cloud') && !event.origin.includes('wisecare.com')) {
                    return;
                }

                const { type, data } = event.data || {};
                switch (type) {
                    case 'conference:joined':
                        options.onConnect?.();
                        break;
                    case 'conference:left':
                    case 'conference:ended':
                        options.onDisconnect?.();
                        break;
                    case 'conference:error':
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

            // Guardar handler para cleanup
            (this.iframeElement as any)._messageHandler = messageHandler;

            // Inserir iframe no container
            container.appendChild(this.iframeElement);

            this.isConferenceActive = true;

            // Fallback: se WiseCare não emitir postMessage, notificar via timeout
            setTimeout(() => {
                if (this.isConferenceActive) {
                    options.onConnect?.();
                }
            }, 3000);

            console.log('[WiseCare] Conference iframe loaded, sessionId:', session.sessionId);

        } catch (err) {
            console.error('[WiseCare] Failed to start conference:', err);
            options.onError?.(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    }

    // ─────────────────────────────────────────────
    // 3. Encerrar conferência
    // ─────────────────────────────────────────────
    async endSession(sessionId: string | number): Promise<void> {
        // Remover iframe
        if (this.iframeElement) {
            // Remover event listener
            const handler = (this.iframeElement as any)._messageHandler;
            if (handler) {
                window.removeEventListener('message', handler);
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
            if (handler) {
                window.removeEventListener('message', handler);
            }
            this.iframeElement.remove();
            this.iframeElement = null;
        }
        this.isConferenceActive = false;
    }
}
