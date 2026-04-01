import React, { useRef, useEffect, useState, useCallback } from 'react'
import { X, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Settings, Maximize2, Minimize2, Circle, Square, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useWebRTCRoom } from '../hooks/useWebRTCRoom'
import { useWiseCareRoom } from '../hooks/useWiseCareRoom'

interface VideoCallProps {
  isOpen: boolean
  onClose: () => void
  patientId?: string
  isAudioOnly?: boolean
  /** Id da sala para sinalização WebRTC (ex.: request_id). Quando definido, conecta áudio/vídeo com o outro participante. */
  signalingRoomId?: string
  /** Quem iniciou a chamada (envia o offer). O outro participante é o callee (envia o answer). */
  isInitiator?: boolean
  /** ID do appointment para vincular à sessão WiseCare */
  appointmentId?: string
}

// Política de consentimento para videochamada
const VIDEO_CALL_CONSENT_POLICY = {
  scope: "video_call",
  description: "Esta videochamada será registrada para fins de auditoria e registro clínico. Nenhum conteúdo de áudio ou vídeo será armazenado permanentemente, apenas metadados (quem, quando, duração).",
  automaticAnalysis: false,
  secondaryUse: false,
  requestedBy: "professional"
}

// Política de consentimento para gravação clínica pontual
const RECORDING_CONSENT_POLICY = {
  scope: "clinical_record",
  maxDurationMinutes: 5,
  automaticAnalysis: false,
  secondaryUse: false,
  requestedBy: "professional",
  description: "O médico solicitou a gravação de um trecho curto (até 5 minutos) desta consulta, exclusivamente para registro clínico. A gravação não será analisada automaticamente nem usada para outros fins."
}

type RecordingConsentSnapshot = {
  scope: string
  maxDurationMinutes?: number
  automaticAnalysis: boolean
  secondaryUse: boolean
  requestedBy: string
  acceptedBy: string
  timestamp: string
  description?: string
}

// Tipo de provider ativo
type ActiveProvider = 'wisecare' | 'webrtc' | 'none'

const VideoCall: React.FC<VideoCallProps> = ({ isOpen, onClose, patientId, isAudioOnly = false, signalingRoomId, isInitiator = false, appointmentId }) => {
  const { user } = useAuth()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [localStreamForWebRTC, setLocalStreamForWebRTC] = useState<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isRemoteMuted, setIsRemoteMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [cameraOnDuringAudioCall, setCameraOnDuringAudioCall] = useState(false)
  const [cameraStreamDuringAudio, setCameraStreamDuringAudio] = useState<MediaStream | null>(null)

  // Estados de consentimento e sessão
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentSnapshot, setConsentSnapshot] = useState<RecordingConsentSnapshot | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Estados de gravação clínica
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)

  // Estado para solicitação de gravação (profissional solicita, paciente aceita)
  const [recordingRequested, setRecordingRequested] = useState(false)
  const [showPatientConsentNotification, setShowPatientConsentNotification] = useState(false)

  // Verificar se usuário é profissional/admin
  const isProfessional = user?.type === 'profissional' || user?.type === 'admin'

  // ─── Provider state: WiseCare como primário, WebRTC como fallback ───
  const [activeProvider, setActiveProvider] = useState<ActiveProvider>('none')
  const [wisecareAttempted, setWisecareAttempted] = useState(false)
  const [providerError, setProviderError] = useState<string | null>(null)

  // Gerar session_id único
  const generateSessionId = () => {
    return `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Modal de consentimento antes de iniciar
  useEffect(() => {
    if (isOpen && !consentGiven) {
      setShowConsentModal(true)
    }
  }, [isOpen, consentGiven])

  // Iniciar chamada após consentimento
  useEffect(() => {
    if (isOpen && consentGiven && !sessionStartTime) {
      const newSessionId = generateSessionId()
      setSessionId(newSessionId)
      setSessionStartTime(new Date())
      setCameraOnDuringAudioCall(false)
    }
  }, [isOpen, consentGiven, sessionStartTime, onClose])

  // Captura de mídia APENAS para WebRTC fallback
  useEffect(() => {
    if (activeProvider !== 'webrtc' || !isOpen || !consentGiven || localStreamRef.current) return
    
    navigator.mediaDevices
      .getUserMedia({ video: !isAudioOnly, audio: true })
      .then((stream) => {
        localStreamRef.current = stream
        setLocalStreamForWebRTC(stream)
        if (localVideoRef.current && !isAudioOnly) {
          localVideoRef.current.srcObject = stream
        }
      })
      .catch((error) => {
        console.error('[VideoCall] Error accessing media for WebRTC:', error)
        alert('Não foi possível acessar a câmera e o microfone. Verifique as permissões.')
        onClose()
      })
  }, [activeProvider, isOpen, consentGiven, isAudioOnly, onClose])

  // Timer de duração da chamada
  useEffect(() => {
    if (isOpen && consentGiven && sessionStartTime) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [isOpen, consentGiven, sessionStartTime])

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingStartTime(null)
    }
  }

  // Timer de gravação (limite 5 minutos)
  useEffect(() => {
    if (isRecording && recordingStartTime) {
      const interval = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1
          // Auto-stop em 5 minutos (300 segundos)
          if (newDuration >= 300) {
            stopRecording()
            return 300
          }
          return newDuration
        })
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [isRecording, recordingStartTime])

  // Quando câmera é ligada durante áudio, manter ref em sync para toggleVideo
  useEffect(() => {
    if (cameraStreamDuringAudio && localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStreamDuringAudio
    }
  }, [cameraStreamDuringAudio])

  // Atribuir stream local ao elemento de vídeo via ref (srcObject não é prop JSX válida)
  useEffect(() => {
    if (!localVideoRef.current) return
    if (!isAudioOnly && localStreamForWebRTC) {
      localVideoRef.current.srcObject = localStreamForWebRTC
    } else if (cameraOnDuringAudioCall && cameraStreamDuringAudio) {
      localVideoRef.current.srcObject = cameraStreamDuringAudio
    } else {
      localVideoRef.current.srcObject = null
    }
  }, [isAudioOnly, localStreamForWebRTC, cameraOnDuringAudioCall, cameraStreamDuringAudio])

  // ─── WiseCare: provider primário (telemedicina profissional) ───
  const {
    isConnected: wisecareConnected,
    isConnecting: wisecareConnecting,
    error: wisecareError,
    session: wisecareSession,
    createAndJoin: wisecareCreateAndJoin,
    joinExistingSession,
    getSession: wisecareGetSession,
    endCall: wisecareEndCall,
  } = useWiseCareRoom({
    containerId: 'wisecare-container',
    appointmentId,
    startWithAudioMuted: false,
    startWithVideoMuted: isAudioOnly,
    onConnect: () => {
      console.log('[VideoCall] WiseCare connected')
      setActiveProvider('wisecare')
      setProviderError(null)
    },
    onDisconnect: () => {
      console.log('[VideoCall] WiseCare disconnected')
      if (activeProvider === 'wisecare') {
        setActiveProvider('none')
      }
    },
    onError: (err) => {
      console.warn('[VideoCall] WiseCare error, falling back to WebRTC:', err.message)
      setProviderError(`WiseCare: ${err.message}`)
      setActiveProvider('webrtc') // Auto-fallback
    },
  })

  // ─── WebRTC: fallback P2P (ativa se WiseCare falha ou não está disponível) ───
  const useWebRTCFallback = activeProvider === 'webrtc' && !!signalingRoomId
  const { remoteStream, connectionState: webrtcState, error: webrtcError } = useWebRTCRoom({
    roomId: signalingRoomId,
    isInitiator,
    localStream: localStreamForWebRTC,
    enabled: isOpen && consentGiven && useWebRTCFallback && !!user?.id,
    userId: user?.id ?? ''
  })

  // ─── Auto-iniciar WiseCare após consentimento ───
  useEffect(() => {
    if (isOpen && consentGiven && !wisecareAttempted && !wisecareConnected && user?.id) {
      const initWiseCare = async () => {
        setWisecareAttempted(true)
        setActiveProvider('wisecare') // Otimista

        // 0. Determinar ID de sincronização (appointmentId real ou signalingRoomId como fallback)
        const syncId = appointmentId || signalingRoomId;

        // 1. Tentar recuperar sessão ativa via syncId (mais confiável)
        if (syncId) {
          try {
            console.log('[VideoCall] Checking for active session via syncId:', syncId)
            const existingSession = await wisecareGetSession(syncId)
            if (existingSession) {
              console.log('[VideoCall] Found active session from Edge Function log')
              if (existingSession.sessionId) {
                setSessionId(String(existingSession.sessionId));
              }
              await joinExistingSession(existingSession)
              return
            }
          } catch (err: any) {
            // Se for 404 (função não deployada), não travar. Apenas logar e tentar outras formas.
            const is404 = err?.message?.includes('404') || (err as any)?.status === 404;
            console.warn(`[VideoCall] WiseCare sync check skipped (${is404 ? 'Function not deployed' : 'Network error'}):`, err.message)
          }
        }

        // 2. Fallback: procurar no metadata do video_call_requests
        if (signalingRoomId) {
          try {
            const { data: request } = await supabase
              .from('video_call_requests')
              .select('metadata')
              .eq('request_id', signalingRoomId)
              .maybeSingle()

            if ((request?.metadata as any)?.wisecareSession) {
              console.log('[VideoCall] Joining WiseCare session found in request metadata')
              const session = (request.metadata as any).wisecareSession;
              if (session.sessionId) {
                setSessionId(String(session.sessionId));
              }
              await joinExistingSession(session as any)
              return
            }
          } catch (err) {
            console.warn('[VideoCall] Failed to check for existing session in metadata:', err)
          }
        }

        // 3. Se não encontrou e for iniciador, criar nova.
        if (isInitiator || !signalingRoomId) {
          console.log('[VideoCall] Initiator creating NEW WiseCare session', { syncId, userId: user.id })
          try {
            const result = await wisecareCreateAndJoin({ appointmentId: syncId })
            if (result) {
              console.log('[VideoCall] SESSION ESTABLISHED (INITIATOR)', {
                 joinUrl: result.joinUrl,
                 appointment: syncId,
                 source: (result as any)?.source || 'new'
              })
              // [TITAN 3.5] SINCRONIA DE IDENTIDADE REAL (CRÍTICO)
              // Substituir o ID local pelo ID real da WiseCare para persistência e logs
              if (result.sessionId) {
                setSessionId(String(result.sessionId));
              }
            }
          } catch (err: any) {
            const is404 = err?.message?.includes('404');
            console.error('[VideoCall] WiseCare creation failure:', err.message)
            
            // EMERGENCY FALLBACK (Initiator Only)
            if (is404 && syncId) {
                console.warn('[VideoCall] EMERGENCY: Attempting direct join via predicted URL.')
                const predictedRoomId = `medcannlab-${syncId}`;
                const domain = 'conf.homolog.v4h.cloud';
                const joinUrl = `https://${domain}/${predictedRoomId}`;
                console.log('[VideoCall] SESSION ESTABLISHED (EMERGENCY)', { joinUrl, appointment: syncId, source: 'predictive' })
                
                const fallbackSession = {
                    sessionId: syncId,
                    roomId: predictedRoomId,
                    joinUrl: joinUrl
                };
                
                setSessionId(syncId); // Adotar o syncId como ID da sessão
                await joinExistingSession(fallbackSession);
                return;
            }

            setActiveProvider('webrtc')
            setProviderError(`Telemedicina indisponível: ${err.message}`)
          }
        } else {
          // --- CALLEE DETERMINISTIC PROTOCOL ---
          console.log('[VideoCall] Callee start DETERMINISTIC sync protocol...')
          let found = false;

          // --- LEVEL 1: REALTIME (ACELERADOR) ---
          const channel = supabase
            .channel(`video-sync:${signalingRoomId}`)
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'video_call_requests', 
              filter: `request_id=eq.${signalingRoomId}` 
            }, (payload) => {
              const session = (payload.new as any)?.metadata?.wisecareSession;
              if (session && !found) {
                found = true;
                if (interval) clearInterval(interval);
                supabase.removeChannel(channel);
                console.log('[VideoCall] SESSION ESTABLISHED (CALLEE)', {
                   joinUrl: session.joinUrl,
                   appointment: syncId,
                   source: 'realtime'
                })
                if (session.sessionId) {
                  setSessionId(String(session.sessionId));
                }
                joinExistingSession(session);
              }
            })
            .subscribe();

          // --- LEVEL 2 & 3: DETERMINISTIC GET + FALLBACK ---
          let attempts = 0
          const maxAttempts = 30 
          const interval = setInterval(async () => {
            if (found) {
                clearInterval(interval);
                return;
            }
            attempts++
            try {
              let foundSession = null
              
              // Tentar Get (Fonte de Verdade)
              if (syncId) {
                foundSession = await wisecareGetSession(syncId)
              }
              
              // Tentar Metadata (Backup)
              if (!foundSession && signalingRoomId) {
                const { data: request } = await supabase
                  .from('video_call_requests').select('metadata').eq('request_id', signalingRoomId).maybeSingle()
                if ((request?.metadata as any)?.wisecareSession) {
                  foundSession = (request.metadata as any).wisecareSession
                }
              }

              if (foundSession && !found) {
                found = true;
                clearInterval(interval);
                supabase.removeChannel(channel);
                console.log('[VideoCall] SESSION ESTABLISHED (CALLEE)', {
                   joinUrl: (foundSession as any).joinUrl,
                   appointment: syncId,
                   source: 'deterministic-get'
                })
                if ((foundSession as any).sessionId) {
                  setSessionId(String((foundSession as any).sessionId));
                }
                await joinExistingSession(foundSession as any)
              } else {
                console.log(`[VideoCall] Waiting for initiator (attempt ${attempts}/${maxAttempts})`)
                
                if (attempts >= maxAttempts && !found) {
                  console.warn('[VideoCall] Timeout. Reverting to WebRTC.')
                  clearInterval(interval)
                  supabase.removeChannel(channel);
                  setActiveProvider('webrtc')
                }
              }
            } catch (err) {
              if (attempts >= maxAttempts) {
                clearInterval(interval)
                supabase.removeChannel(channel);
                setActiveProvider('webrtc')
              }
            }
          }, 1000)

          return () => {
             clearInterval(interval);
             supabase.removeChannel(channel);
          }
        }
      }

      initWiseCare()
    }
  }, [isOpen, consentGiven, wisecareAttempted, wisecareConnected, user?.id, appointmentId, wisecareCreateAndJoin, wisecareGetSession, signalingRoomId, isInitiator, joinExistingSession])

  // ─── Sincronizar sessionId criado pelo Initiator no video_call_requests ───
  useEffect(() => {
    if (isInitiator && signalingRoomId && wisecareSession) {
      const updateMetadata = async () => {
        try {
          // Buscar metadata atual
          const { data: current } = await supabase
            .from('video_call_requests')
            .select('metadata')
            .eq('request_id', signalingRoomId)
            .maybeSingle()

          const newMetadata = {
            ...((current?.metadata as any) || {}),
            wisecareSession: wisecareSession
          }

          await supabase
            .from('video_call_requests')
            .update({ metadata: newMetadata })
            .eq('request_id', signalingRoomId)

          console.log('[VideoCall] Metadata updated with WiseCare session for callee')
        } catch (err) {
          console.error('[VideoCall] Failed to sync session metadata:', err)
        }
      }
      updateMetadata()
    }
  }, [isInitiator, signalingRoomId, wisecareSession])

  // Atribuir stream remoto aos elementos de mídia (ouvir/ver o outro participante)
  useEffect(() => {
    if (remoteStream) {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream
        remoteAudioRef.current.play().catch(() => { })
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play().catch(() => { })
      }
    } else {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    }
  }, [remoteStream])

  // Viva-voz: rotear áudio remoto para o alto-falante (setSinkId quando disponível)
  useEffect(() => {
    const el = remoteAudioRef.current || remoteVideoRef.current
    if (!el || !('setSinkId' in el)) return
    if (isSpeakerOn) {
      (el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> })
        .setSinkId?.('')
        .catch(() => { })
    }
  }, [isSpeakerOn])

  // Cleanup ao fechar
  useEffect(() => {
    if (!isOpen) {
      setConsentGiven(false)
      setConsentSnapshot(null)
      setSessionStartTime(null)
      setSessionId(null)
      setCallDuration(0)
      setIsRecording(false)
      setRecordingDuration(0)
      setRecordingStartTime(null)
      setCameraOnDuringAudioCall(false)
      setCameraStreamDuringAudio(null)
      setLocalStreamForWebRTC(null)
      setActiveProvider('none')
      setWisecareAttempted(false)
      setProviderError(null)
      const stream = localStreamRef.current
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      if (localVideoRef.current?.srcObject) {
        const s = localVideoRef.current.srcObject as MediaStream
        s.getTracks().forEach((t) => t.stop())
        localVideoRef.current.srcObject = null
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isOpen, isRecording])

  const toggleMute = () => {
    if (activeProvider === 'wisecare') {
        console.log('[VideoCall] Use WiseCare interface controls for audio.')
        return
    }
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (activeProvider === 'wisecare') {
        console.log('[VideoCall] Use WiseCare interface controls for video.')
        return
    }
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn((v) => !v)
  }

  const enableCameraDuringCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop())
        }
        localStreamRef.current = stream
        setLocalStreamForWebRTC(stream)
        setCameraStreamDuringAudio(stream)
        setCameraOnDuringAudioCall(true)
      })
      .catch((err) => {
        console.error('Erro ao ligar câmera:', err)
        alert('Não foi possível acessar a câmera. Verifique as permissões.')
      })
  }

  // Salvar sessão no banco de dados
  const saveSession = async () => {
    if (!sessionId || !sessionStartTime || !user?.id) {
      console.warn('⚠️ Não foi possível salvar sessão: dados incompletos (sessionId, sessionStartTime ou user.id faltando)')
      return
    }

    // Se não há patientId, ainda salvar a sessão (pode ser chamada sem paciente específico)
    // Mas avisar no log
    if (!patientId) {
      console.warn('⚠️ Salvando sessão sem patientId (pode ser chamada geral)')
    }

    try {
      const endedAt = new Date()
      const durationSeconds = Math.floor((endedAt.getTime() - sessionStartTime.getTime()) / 1000)

      const { data, error } = await supabase
        .from('video_call_sessions')
        .upsert({
          session_id: sessionId,
          professional_id: user.id,
          patient_id: patientId || null, // Permitir null se não houver patientId
          started_at: sessionStartTime.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          call_type: isAudioOnly ? 'audio' : 'video',
          consent_snapshot: consentSnapshot || {
            timestamp: sessionStartTime.toISOString(),
            acceptedBy: 'patient',
            ...VIDEO_CALL_CONSENT_POLICY
          }
        }, { onConflict: 'session_id' })

      if (error) {
        console.error('❌ Erro ao salvar sessão:', error)
      } else {
        console.log('✅ Sessão salva com sucesso:', data)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error)
    }
  }

  // Salvar trecho clínico gravado
  const saveSnippet = async (blob: Blob) => {
    if (!sessionId || !recordingStartTime || !user?.id || !consentSnapshot) {
      console.warn('⚠️ Não foi possível salvar trecho: dados incompletos (sessionId, recordingStartTime, user.id ou consentSnapshot faltando)')
      return
    }

    // Se não há patientId, ainda salvar o trecho (pode ser gravação geral)
    if (!patientId) {
      console.warn('⚠️ Salvando trecho sem patientId (pode ser gravação geral)')
    }

    try {
      const endedAt = new Date()
      const durationSeconds = Math.floor((endedAt.getTime() - recordingStartTime.getTime()) / 1000)

      // Em produção, o blob seria enviado para storage e o path seria salvo
      // Por enquanto, salvamos apenas os metadados
      const { data, error } = await supabase
        .from('video_clinical_snippets')
        .insert({
          professional_id: user.id,
          patient_id: patientId,
          started_at: recordingStartTime.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          purpose: 'clinical_record',
          consent_snapshot: consentSnapshot,
          retention_policy: 'medical_record'
        } as any)

      if (error) {
        console.error('❌ Erro ao salvar trecho clínico:', error)
      } else {
        console.log('✅ Trecho clínico salvo com sucesso:', data)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar trecho clínico:', error)
    }
  }

  // Iniciar gravação
  const startRecording = () => {
    if (!localVideoRef.current?.srcObject) {
      alert('Não há stream de mídia disponível para gravar.')
      return
    }

    const stream = localVideoRef.current.srcObject as MediaStream

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' })
        await saveSnippet(blob)
        recordingChunksRef.current = []
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Coletar dados a cada 1 segundo
      setIsRecording(true)
      setRecordingStartTime(new Date())
      setRecordingDuration(0)
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error)
      alert('Não foi possível iniciar a gravação. Verifique se o navegador suporta MediaRecorder.')
    }
  }

  // Aceitar consentimento de videochamada
  const handleAcceptConsent = () => {
    const snapshot: RecordingConsentSnapshot = {
      ...VIDEO_CALL_CONSENT_POLICY,
      acceptedBy: 'patient',
      timestamp: new Date().toISOString()
    }
    setConsentSnapshot(snapshot)
    setConsentGiven(true)
    setShowConsentModal(false)
  }

  // Recusar consentimento de videochamada
  const handleRejectConsent = () => {
    setShowConsentModal(false)
    onClose()
  }

  // Solicitar gravação (profissional)
  const handleRequestRecording = () => {
    if (isProfessional) {
      setRecordingRequested(true)
      // Notificação aparece na tela do paciente (via Supabase Realtime ou estado compartilhado)
      // Por enquanto, mostra notificação se paciente estiver na mesma sessão
      setShowPatientConsentNotification(true)
    }
  }

  // Aceitar consentimento de gravação (paciente)
  const handleAcceptRecordingConsent = () => {
    const snapshot: RecordingConsentSnapshot = {
      ...RECORDING_CONSENT_POLICY,
      acceptedBy: 'patient',
      timestamp: new Date().toISOString()
    }
    setConsentSnapshot(snapshot)
    setShowPatientConsentNotification(false)
    setRecordingRequested(false)
    // Iniciar gravação automaticamente após aceitar
    setTimeout(() => {
      startRecording()
    }, 500) // Pequeno delay para UX
  }

  // Recusar consentimento de gravação (paciente)
  const handleRejectRecordingConsent = () => {
    setShowPatientConsentNotification(false)
    setRecordingRequested(false)
  }

  const handleEndCall = async () => {
    // Parar gravação se estiver gravando
    if (isRecording) {
      stopRecording()
    }

    // Encerrar WiseCare se ativo
    if (activeProvider === 'wisecare') {
      await wisecareEndCall().catch(console.error)
    }

    // Salvar sessão no banco
    await saveSession()

    // Stop all tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }

    onClose()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal de Consentimento para Videochamada */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                Consentimento para Videochamada
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm">
                {VIDEO_CALL_CONSENT_POLICY.description}
              </p>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-xs space-y-2">
                <p className="text-slate-400">• Metadados registrados: quem, quando, duração</p>
                <p className="text-slate-400">• Nenhum conteúdo de áudio/vídeo será armazenado</p>
                <p className="text-slate-400">• Registro apenas para auditoria e registro clínico</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRejectConsent}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Recusar
                </button>
                <button
                  onClick={handleAcceptConsent}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Aceitar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Notificação de Consentimento para Paciente (grande, centralizada) */}
      {/* Esta notificação aparece quando profissional solicita gravação */}
      {showPatientConsentNotification && !isProfessional && recordingRequested && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-primary-500/50 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-500/50">
                  <Circle className="w-10 h-10 text-red-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Solicitação de Gravação Clínica
                </h3>
                <p className="text-slate-300 text-sm">
                  O médico solicitou a gravação de um trecho desta consulta
                </p>
              </div>

              {/* Conteúdo */}
              <div className="bg-slate-800/50 rounded-2xl p-6 space-y-4 border border-slate-700/50">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-400 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Duração máxima: 5 minutos</p>
                      <p className="text-slate-400 text-xs mt-1">A gravação será curta e pontual</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-400 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Finalidade: registro clínico</p>
                      <p className="text-slate-400 text-xs mt-1">Exclusivamente para seu prontuário médico</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-400 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Uso restrito</p>
                      <p className="text-slate-400 text-xs mt-1">Não será analisada automaticamente nem usada para outros fins</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleRejectRecordingConsent}
                  className="flex-1 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  Recusar
                </button>
                <button
                  onClick={handleAcceptRecordingConsent}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                >
                  Aceitar e Iniciar
                </button>
              </div>

              {/* Footer */}
              <p className="text-xs text-slate-500 text-center">
                Você pode recusar a gravação a qualquer momento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Componente de Videochamada */}
      <div className="fixed inset-0 z-50 bg-black">
        {/* Áudio remoto (viva-voz): elemento para quando WebRTC enviar o stream; setSinkId usa isso */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Provider Status Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${activeProvider === 'wisecare' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              activeProvider === 'webrtc' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}>
            {activeProvider === 'wisecare' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {activeProvider === 'wisecare' ? 'WiseCare' : activeProvider === 'webrtc' ? 'P2P Direto' : 'Conectando...'}
          </div>
          {providerError && (
            <div className="px-3 py-1.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-md max-w-xs truncate">
              {providerError}
            </div>
          )}
        </div>

        {/* Remote Video — imagem do outro participante (tela principal) */}
        <div className="relative w-full h-full bg-slate-900">

          {/* ─── WiseCare: iframe renderizado pelo SDK ─── */}
          {activeProvider === 'wisecare' && (
            <div
              id="wisecare-container"
              className="w-full h-full"
              style={{ minHeight: '100vh' }}
            />
          )}

          {/* ─── WiseCare: loading ─── */}
          {activeProvider === 'wisecare' && wisecareConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-300">Conectando via WiseCare...</p>
                <p className="text-slate-500 text-xs mt-2">Telemedicina segura</p>
              </div>
            </div>
          )}

          {/* ─── WebRTC Fallback: vídeo P2P direto ─── */}
          {activeProvider === 'webrtc' && !isAudioOnly && (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {webrtcState === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <p className="text-slate-400">Conectando vídeo (P2P)...</p>
                </div>
              )}
            </>
          )}

          {isAudioOnly && !cameraOnDuringAudioCall && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-white">P</span>
                </div>
                <p className="text-white text-xl">Chamada de Áudio</p>
                <p className="text-slate-400 mt-2">
                  {patientId ? `Paciente ID: ${patientId}` : 'Conectando...'}
                </p>
                <p className="text-slate-500 text-sm mt-4">Use &quot;Viva-voz&quot; para ouvir pelo alto-falante</p>
                {activeProvider === 'webrtc' && signalingRoomId && (
                  <p className="text-slate-400 text-xs mt-2">
                    {webrtcState === 'connecting' && 'Conectando áudio (P2P)...'}
                    {webrtcState === 'connected' && 'Conectado (P2P)'}
                    {webrtcError && <span className="text-amber-400">{webrtcError}</span>}
                  </p>
                )}
                {activeProvider === 'wisecare' && (
                  <p className="text-emerald-400 text-xs mt-2">
                    {wisecareConnecting ? 'Conectando via WiseCare...' : 'Conectado via WiseCare'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) — stream atribuído via useEffect acima */}
          {(!isAudioOnly || cameraOnDuringAudioCall) && (
            <div className="absolute bottom-20 right-4 w-48 h-36 bg-slate-800 rounded-lg overflow-hidden border border-white/20 shadow-xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="max-w-md mx-auto">
              {/* Call Duration */}
              <div className="text-center mb-4">
                <span className="text-white font-mono text-lg">
                  {formatDuration(callDuration)}
                </span>
              </div>

              {/* Control Buttons - Estilo Zoom */}
              <div className="flex items-center justify-center space-x-3 flex-wrap gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-3.5 rounded-full transition-all ${isMuted
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                    }`}
                  title={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Viva-voz: áudio pelo alto-falante (importante no mobile) */}
                <button
                  onClick={toggleSpeaker}
                  className={`p-3.5 rounded-full transition-all ${isSpeakerOn
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                    }`}
                  title={isSpeakerOn ? 'Viva-voz ligado' : 'Ligar viva-voz (alto-falante)'}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* Ligar câmera durante chamada de áudio */}
                {isAudioOnly && !cameraOnDuringAudioCall && (
                  <button
                    onClick={enableCameraDuringCall}
                    className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                    title="Ligar câmera"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                )}

                {(!isAudioOnly || cameraOnDuringAudioCall) && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full transition-all ${isVideoOff
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                      }`}
                    title={isVideoOff ? 'Ligar câmera' : 'Desligar câmera'}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* Botão Solicitar Gravação (apenas para profissional, modo vídeo) */}
                {!isAudioOnly && consentGiven && isProfessional && !isRecording && (
                  <button
                    onClick={() => {
                      if (!recordingRequested) {
                        handleRequestRecording()
                      }
                    }}
                    disabled={recordingRequested}
                    className={`p-3.5 rounded-full transition-all ${recordingRequested
                        ? 'bg-yellow-500/50 text-white cursor-wait animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                      }`}
                    title={recordingRequested ? 'Aguardando consentimento do paciente...' : 'Solicitar gravação clínica ao paciente'}
                  >
                    <Circle className="w-5 h-5" />
                  </button>
                )}

                {/* Botão Parar Gravação (quando está gravando) */}
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 text-white animate-pulse transition-all"
                    title="Parar gravação"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={handleEndCall}
                  className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
                  title="Encerrar chamada"
                >
                  <X className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                  title={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Call Info */}
              <div className="mt-4 text-center text-sm text-slate-400 space-y-1">
                {!isSpeakerOn && (
                  <p className="text-amber-400 flex items-center justify-center space-x-2">
                    <VolumeX className="w-4 h-4" />
                    <span>Viva-voz desligado — toque no ícone para ouvir pelo alto-falante</span>
                  </p>
                )}
                {isMuted && (
                  <p className="text-yellow-400 flex items-center justify-center space-x-2">
                    <MicOff className="w-4 h-4" />
                    <span>Você está sem som</span>
                  </p>
                )}
                {isVideoOff && (!isAudioOnly || cameraOnDuringAudioCall) && (
                  <p className="text-yellow-400 flex items-center justify-center space-x-2">
                    <VideoOff className="w-4 h-4" />
                    <span>Sua câmera está desligada</span>
                  </p>
                )}
                {isRecording && (
                  <p className="text-red-400 flex items-center justify-center space-x-2">
                    <Circle className="w-4 h-4 animate-pulse" />
                    <span>Gravando: {formatDuration(recordingDuration)} / 5:00</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleEndCall}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  )
}

export default VideoCall
