import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2, MessageCircle, Send, Users, FileText } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useChatSystem } from '../hooks/useChatSystem'
import { supabase } from '../lib/supabase'
import { ChatEvolutionService, ChatSession } from '../services/chatEvolutionService'

interface ParticipantSummary {
  id: string
  name: string | null
  email: string | null
}

interface ChatParticipantProfile {
  user_id: string
  name: string | null
  email: string | null
}

const PatientDoctorChat: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const roomIdParam = new URLSearchParams(location.search).get('roomId')
  const searchParams = new URLSearchParams(location.search)
  const origin = searchParams.get('origin')
  const startParam = searchParams.get('start')
  const patientIdParam = searchParams.get('patientId')

  const isImpersonatingPatient = user?.type === 'admin' && origin === 'patient-dashboard'
  const isPatient = user?.type === 'paciente' && !isImpersonatingPatient

  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(roomIdParam ?? undefined)
  const [participants, setParticipants] = useState<ParticipantSummary[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [allPatients, setAllPatients] = useState<Array<{ id: string; name: string | null; email: string | null }>>([])
  const [allProfessionals, setAllProfessionals] = useState<Array<{ id: string; name: string | null; email: string | null; specialty?: string }>>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [professionalsLoading, setProfessionalsLoading] = useState(false)
  const [savingEvolution, setSavingEvolution] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const hasTriggeredStartRef = useRef(false)

  const {
    inbox,
    inboxLoading,
    messages,
    messagesLoading,
    isOnline,
    sendMessage,
    markRoomAsRead,
    reloadInbox
  } = useChatSystem(activeRoomId, { enabled: !isImpersonatingPatient })

  const patientRooms = useMemo(() => {
    // Para pacientes, mostrar apenas suas próprias salas
    // Para profissionais/admins, mostrar todas as salas de pacientes
    if (isPatient) {
      return inbox.filter(room => room.type === 'patient');
    }
    return inbox.filter(room => room.type === 'patient');
  }, [inbox, isPatient])

  // Mapear pacientes que já têm salas (baseado nos participantes)
  const [patientsWithRooms, setPatientsWithRooms] = useState<Set<string>>(new Set());
  // Mapear profissionais vinculados ao paciente atual (baseado em salas compartilhadas)
  const [linkedProfessionalIds, setLinkedProfessionalIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || patientRooms.length === 0) {
      setPatientsWithRooms(new Set());
      setLinkedProfessionalIds(new Set());
      return;
    }

    const loadPatientsWithRooms = async () => {
      try {
        const roomIds = patientRooms.map(room => room.id);
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('room_id, user_id, role')
          .in('room_id', roomIds);

        const patientIds = new Set<string>();
        const professionalIds = new Set<string>();

        participants?.forEach(p => {
          if (p.user_id) {
            if (p.role === 'patient') {
              patientIds.add(p.user_id);
            } else if (p.role === 'professional' || p.role === 'admin') {
              professionalIds.add(p.user_id);
            }
          }
        });

        setPatientsWithRooms(patientIds);
        setLinkedProfessionalIds(professionalIds);
        console.log('🔗 Profissionais vinculados ao paciente:', professionalIds.size);
      } catch (error) {
        console.warn('Erro ao carregar participantes das salas:', error);
        setPatientsWithRooms(new Set());
        setLinkedProfessionalIds(new Set());
      }
    };

    loadPatientsWithRooms();
  }, [patientRooms, user]);

  // Carregar todos os pacientes do profissional (apenas para profissionais/admins)
  useEffect(() => {
    if (!user || isImpersonatingPatient || isPatient) return;

    // Apenas profissionais e admins podem ver a lista completa de pacientes
    if (user.type !== 'profissional' && user.type !== 'admin') return;

    const loadAllPatients = async () => {
      setPatientsLoading(true);
      try {
        // Buscar pacientes da tabela users (onde os pacientes são criados)
        // Buscar tanto 'patient' (inglês) quanto 'paciente' (português) para compatibilidade
        const { data: patientsData, error: patientsError } = await supabase
          .from('users')
          .select('id, name, email, type, created_at')
          .in('type', ['patient', 'paciente'])
          .order('created_at', { ascending: false });

        if (patientsError) {
          console.warn('Erro ao carregar pacientes:', patientsError);
          // Tentar fallback: buscar pacientes que têm avaliações clínicas
          try {
            const { data: assessmentData } = await supabase
              .from('clinical_assessments')
              .select('patient_id, data')
              .not('patient_id', 'is', null);

            if (assessmentData && assessmentData.length > 0) {
              const patientIds = [...new Set(assessmentData.map(a => a.patient_id))];
              const { data: fallbackData } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', patientIds);
              console.log('📋 Pacientes carregados (fallback):', fallbackData?.length || 0);
              setAllPatients(fallbackData || []);
            } else {
              console.log('📋 Nenhum paciente encontrado no fallback');
              setAllPatients([]);
            }
          } catch (fallbackError) {
            console.error('Erro no fallback de pacientes:', fallbackError);
            setAllPatients([]);
          }
        } else {
          console.log('📋 Pacientes carregados:', patientsData?.length || 0);
          setAllPatients(patientsData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar lista de pacientes:', error);
        setAllPatients([]);
      } finally {
        setPatientsLoading(false);
      }
    };

    loadAllPatients();
  }, [user, isImpersonatingPatient]);

  // Carregar profissionais disponíveis (para mostrar na lista de contatos)
  useEffect(() => {
    if (!user) return;

    const loadAllProfessionals = async () => {
      setProfessionalsLoading(true);
      try {
        const { data: professionalsData, error: professionalsError } = await supabase
          .from('users')
          .select('id, name, email, type')
          .in('type', ['profissional', 'professional', 'admin'])
          .order('name', { ascending: true });

        if (professionalsError) {
          console.warn('Erro ao carregar profissionais:', professionalsError);
          setAllProfessionals([]);
        } else {
          console.log('👨‍⚕️ Profissionais carregados:', professionalsData?.length || 0);
          setAllProfessionals(professionalsData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar lista de profissionais:', error);
        setAllProfessionals([]);
      } finally {
        setProfessionalsLoading(false);
      }
    };

    loadAllProfessionals();
  }, [user, isPatient]);

  // Quando há roomId na URL, garantir que ele seja usado e recarregar inbox se necessário
  useEffect(() => {
    if (roomIdParam && roomIdParam !== activeRoomId) {
      setActiveRoomId(roomIdParam);
      // Recarregar inbox para garantir que a sala apareça na lista
      reloadInbox();
    }
  }, [roomIdParam, activeRoomId, reloadInbox]);

  // Quando há patientId na URL, criar ou selecionar sala automaticamente
  useEffect(() => {
    // Só processar se não há roomId (roomId tem prioridade) e se é profissional/admin
    if (roomIdParam || !patientIdParam || !user || isPatient || isImpersonatingPatient) {
      return;
    }

    // Só profissionais e admins podem criar salas
    if (user.type !== 'profissional' && user.type !== 'admin' && user.type !== 'professional') {
      return;
    }

    const handlePatientIdFromUrl = async () => {
      try {
        // Verificar se já existe uma sala para este paciente
        // Primeiro, verificar nas salas existentes se o paciente está como participante
        let existingRoomId: string | undefined = undefined;

        for (const room of patientRooms) {
          try {
            const { data: participants } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('room_id', room.id)
              .eq('user_id', patientIdParam)
              .eq('role', 'patient')
              .limit(1);

            if (participants && participants.length > 0) {
              existingRoomId = room.id;
              break;
            }
          } catch (err) {
            console.warn('Erro ao verificar participantes da sala:', err);
          }
        }

        if (existingRoomId) {
          // Sala já existe, apenas selecionar
          console.log('✅ Sala existente encontrada para paciente:', patientIdParam);
          setActiveRoomId(existingRoomId);
          return;
        }

        // Buscar nome do paciente
        let patientName: string | null = null;
        const patient = allPatients.find(p => p.id === patientIdParam);
        if (patient) {
          patientName = patient.name;
        } else {
          // Tentar buscar do banco se não estiver na lista
          try {
            const { data: patientData } = await supabase
              .from('users')
              .select('name')
              .eq('id', patientIdParam)
              .single();
            patientName = patientData?.name || null;
          } catch (err) {
            console.warn('Erro ao buscar nome do paciente:', err);
          }
        }

        // Criar nova sala para o paciente
        console.log('🔄 Criando sala para paciente da URL:', patientIdParam);
        await handleCreateRoomForPatient(patientIdParam, patientName);
      } catch (error) {
        console.error('❌ Erro ao processar patientId da URL:', error);
      }
    };

    // Aguardar um pouco para garantir que os dados foram carregados
    if (allPatients.length > 0 || inbox.length > 0) {
      void handlePatientIdFromUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientIdParam, roomIdParam, user, isPatient, isImpersonatingPatient, patientRooms, allPatients, inbox.length]);

  // Selecionar primeira sala se não há roomId na URL
  useEffect(() => {
    // Não fazer nada se há roomId na URL (ele tem prioridade)
    if (roomIdParam) {
      return;
    }

    if (!patientRooms.length) {
      setActiveRoomId(undefined);
      return;
    }

    // Se não há sala ativa ou a sala ativa não está na lista, selecionar a primeira
    if (!activeRoomId || !patientRooms.some(room => room.id === activeRoomId)) {
      setActiveRoomId(patientRooms[0].id);
    }
  }, [patientRooms, activeRoomId, roomIdParam]);

  useEffect(() => {
    if (isImpersonatingPatient || !activeRoomId) {
      setParticipants([]);
      return;
    }

    const fetchParticipants = async () => {
      setParticipantsLoading(true);
      try {
        // PRIMEIRO: Tentar usar função RPC (contorna RLS e recursão)
        let participantRows: any[] | null = null;
        let participantError: any = null;

        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'get_chat_participants_for_room',
            { p_room_id: activeRoomId }
          );

          if (!rpcError && rpcData) {
            participantRows = rpcData;
            console.log('✅ Participantes carregados via RPC:', participantRows.length);
          } else {
            participantError = rpcError;
            console.warn('⚠️ RPC não disponível, tentando query direta...', rpcError);
          }
        } catch (rpcErr) {
          console.warn('⚠️ Erro ao chamar RPC, tentando query direta...', rpcErr);
        }

        // FALLBACK: Se RPC não funcionar, tentar query direta
        if (!participantRows) {
          const { data: directData, error: directError } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('room_id', activeRoomId);

          if (!directError && directData) {
            participantRows = directData;
          } else {
            participantError = directError;
          }
        }

        if (participantError || !participantRows?.length) {
          if (participantError) {
            console.warn('Não foi possível listar participantes do chat:', participantError);
            if (participantError.code === '42P17' || participantError.message?.includes('infinite recursion')) {
              console.error('❌ ERRO DE RECURSÃO! Execute o script SQL: CORRIGIR_RECURSAO_DEFINITIVO.sql no Supabase');
            }
          }
          setParticipants([]);
          return;
        }

        const userIds = participantRows
          .map((row: any) => row.user_id)
          .filter((id): id is string => Boolean(id));

        if (userIds.length === 0) {
          setParticipants([]);
          return;
        }

        const { data: profileRows, error: profileError } = await supabase.rpc(
          'get_chat_user_profiles',
          { p_user_ids: userIds }
        );

        if (profileError || !profileRows) {
          if (profileError) {
            console.warn('Falha ao buscar perfis dos participantes:', profileError);
          }
          setParticipants([]);
          return;
        }

        const profiles = profileRows as ChatParticipantProfile[];

        setParticipants(
          profiles.map(profile => ({
            id: profile.user_id,
            name: profile.name ?? null,
            email: profile.email ?? null
          }))
        );
      } finally {
        setParticipantsLoading(false);
      }
    };

    fetchParticipants();
  }, [activeRoomId, isImpersonatingPatient]);

  useEffect(() => {
    if (!isImpersonatingPatient && activeRoomId) {
      void markRoomAsRead(activeRoomId);
    }
  }, [activeRoomId, markRoomAsRead, isImpersonatingPatient]);

  useEffect(() => {
    if (hasTriggeredStartRef.current) return;
    if (!user || !activeRoomId || isImpersonatingPatient) return;
    if (startParam !== 'avaliacao-inicial') return;

    const triggerAssessment = async () => {
      try {
        await sendMessage(activeRoomId, user.id, 'Iniciar avaliação clínica inicial IMRE');
        hasTriggeredStartRef.current = true;
        const params = new URLSearchParams(location.search);
        params.delete('start');
        const searchString = params.toString();
        navigate(
          {
            pathname: location.pathname,
            search: searchString ? `?${searchString}` : ''
          },
          { replace: true }
        );
      } catch (error) {
        console.error('Erro ao iniciar avaliação clínica via chat:', error);
      }
    };

    void triggerAssessment();
  }, [activeRoomId, isImpersonatingPatient, location.pathname, location.search, navigate, sendMessage, startParam, user]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-900 text-slate-200">
        <p>Faça login para acessar o chat clínico.</p>
      </div>
    )
  }

  if (isImpersonatingPatient) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-10">
          <MessageCircle className="w-10 h-10 mx-auto text-primary-400" />
          <h1 className="text-2xl font-semibold text-white">Chat disponível somente para o paciente</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Para visualizar o histórico real desta conversa, acesse com a conta do paciente ou adicione-se como participante autorizado na sala correspondente em
            <code className="block mt-2 text-xs text-primary-300">chat_participants</code>.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </div>
    )
  }

  const otherParticipants = participants.filter(participant => participant.id !== user.id)

  const handleSelectRoom = async (roomId: string) => {
    // Se havia uma sala ativa anteriormente, salvar conversa antes de trocar
    if (activeRoomId && activeRoomId !== roomId && messages.length > 0 && (user?.type === 'profissional' || user?.type === 'admin')) {
      // Salvar automaticamente a conversa anterior como evolução
      try {
        await handleSaveConversationAsEvolution();
      } catch (error) {
        console.warn('Não foi possível salvar conversa anterior automaticamente:', error);
      }
    }

    setActiveRoomId(roomId);
    setMessageInput('');
    await markRoomAsRead(roomId);
  }

  // Função para PACIENTE criar sala com um profissional específico
  const handleCreateRoomWithProfessional = async (professionalId: string, professionalName: string | null) => {
    if (!user?.id) {
      alert('Erro: usuário não identificado. Faça login novamente.');
      return;
    }

    try {
      console.log('🔄 Paciente criando sala com profissional:', { professionalId, professionalName, patientId: user.id });

      // Usar RPC com os parâmetros invertidos (paciente = user, profissional = parâmetro)
      const { data: roomIdFromRPC, error: rpcError } = await supabase.rpc(
        'create_chat_room_for_patient',
        {
          p_patient_id: user.id,
          p_patient_name: user.name,
          p_professional_id: professionalId
        }
      );

      if (!rpcError && roomIdFromRPC) {
        console.log('✅ Sala criada via RPC:', roomIdFromRPC);
        await new Promise(resolve => setTimeout(resolve, 500));
        await reloadInbox();
        setActiveRoomId(roomIdFromRPC);
        console.log('✅ Sala criada com profissional com sucesso!');
        return;
      }

      if (rpcError) {
        console.error('❌ Erro ao criar sala com profissional:', rpcError);
        alert(`Erro ao iniciar conversa: ${rpcError.message}`);
      }
    } catch (error: any) {
      console.error('Erro ao criar sala com profissional:', error);
      alert(`Erro ao iniciar conversa: ${error?.message || 'Tente novamente.'}`);
    }
  };

  const handleCreateRoomForPatient = async (patientId: string, patientName: string | null) => {
    if (!user?.id) {
      alert('Erro: usuário não identificado. Faça login novamente.');
      return;
    }

    try {
      console.log('🔄 Criando sala via RPC (contorna RLS)...', { patientId, patientName, professionalId: user.id });

      // SEMPRE usar função RPC primeiro (contorna RLS e recursão)
      const { data: roomIdFromRPC, error: rpcError } = await supabase.rpc(
        'create_chat_room_for_patient',
        {
          p_patient_id: patientId,
          p_patient_name: patientName,
          p_professional_id: user.id
        }
      );

      if (!rpcError && roomIdFromRPC) {
        // ✅ Sucesso usando RPC
        console.log('✅ Sala criada via RPC:', roomIdFromRPC);
        await new Promise(resolve => setTimeout(resolve, 500));
        await reloadInbox();
        setActiveRoomId(roomIdFromRPC);
        console.log('✅ Sala criada e selecionada com sucesso!');
        return;
      }

      // Se RPC falhar, mostrar erro claro
      if (rpcError) {
        console.error('❌ Erro na função RPC:', rpcError);
        throw new Error(`Erro ao criar sala: ${rpcError.message}. Execute o script SQL "SOLUCAO_DEFINITIVA_CHAT.sql" no Supabase.`);
      }

      // Se não retornou ID, tentar método direto como fallback
      console.log('⚠️ RPC não retornou ID, tentando método direto...');

      // Criar nova sala diretamente
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `Canal de cuidado • ${patientName || 'Paciente'}`,
          type: 'patient',
          created_by: user.id
        })
        .select('id')
        .single();

      if (roomError || !newRoom) {
        console.error('❌ Erro ao criar sala:', roomError);
        console.error('Detalhes do erro:', {
          code: roomError?.code,
          message: roomError?.message,
          details: roomError?.details,
          hint: roomError?.hint,
          userId: user.id,
          patientId: patientId
        });

        // Mensagem mais detalhada para o usuário
        const errorMessage = roomError?.message || 'Não foi possível criar a sala clínica do paciente';
        if (roomError?.code === '42501' || errorMessage.includes('row-level security')) {
          throw new Error('Erro de permissão RLS: Execute o script SQL "CRIAR_FUNCAO_RPC_APENAS.sql" no Supabase SQL Editor para criar a função que contorna o RLS.');
        }
        throw roomError ?? new Error(errorMessage);
      }

      // Adicionar participantes (paciente e profissional)
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .upsert(
          [
            { room_id: newRoom.id, user_id: patientId, role: 'patient' },
            { room_id: newRoom.id, user_id: user.id, role: 'professional' }
          ],
          { onConflict: 'room_id,user_id' }
        );

      if (participantsError) {
        console.error('Erro ao adicionar participantes:', participantsError);
        // Continuar mesmo com erro, pois pode já estar adicionado
      }

      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recarregar inbox e selecionar a nova sala
      await reloadInbox();
      setActiveRoomId(newRoom.id);

      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recarregar inbox e selecionar a nova sala
      await reloadInbox();
      setActiveRoomId(newRoom.id);

      console.log('✅ Sala criada com sucesso para paciente:', patientName);
    } catch (error: any) {
      console.error('Erro ao criar sala para paciente:', error);
      alert(`Erro ao criar sala de chat: ${error?.message || 'Tente novamente.'}`);
    }
  }

  const handleSubmitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeRoomId || !messageInput.trim() || !user?.id) return;

    const messageToSend = messageInput.trim();
    setMessageInput(''); // Limpar input imediatamente para melhor UX

    try {
      await sendMessage(activeRoomId, user.id, messageToSend);
      await markRoomAsRead(activeRoomId);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Restaurar mensagem no input em caso de erro
      setMessageInput(messageToSend);
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    }
  }

  /**
   * Salva a conversa atual como evolução clínica no prontuário do paciente
   * Esta é uma das funcionalidades principais: registrar automaticamente
   * todas as conversas do chat no histórico clínico
   */
  const handleSaveConversationAsEvolution = async () => {
    if (!activeRoomId || !user?.id || messages.length === 0) {
      alert('Não há mensagens para salvar como evolução.');
      return;
    }

    setSavingEvolution(true);

    try {
      // Identificar paciente e profissional da sala
      // Usar RPC function para evitar recursão RLS
      let participants: any[] | null = null;
      try {
        const { data: participantsData, error: participantsError } = await supabase.rpc(
          'get_chat_participants_for_room',
          { p_room_id: activeRoomId }
        );

        if (!participantsError && participantsData) {
          participants = participantsData;
        } else {
          // Fallback: tentar query direta (pode falhar se RLS tiver recursão)
          const { data: directData, error: directError } = await supabase
            .from('chat_participants')
            .select('user_id, role')
            .eq('room_id', activeRoomId);

          if (!directError && directData) {
            participants = directData;
          } else if (directError) {
            console.warn('⚠️ Erro ao buscar participantes (pode ser recursão RLS):', directError);
            // Continuar com array vazio para não quebrar a interface
            participants = [];
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar participantes:', error);
        participants = [];
      }

      if (!participants) {
        participants = [];
      }

      if (!participants || participants.length < 2) {
        throw new Error('Não foi possível identificar os participantes da conversa.');
      }

      const patient = participants.find(p => p.role === 'patient');
      const professional = participants.find(p => p.role === 'professional' || p.role === 'admin');

      if (!patient || !professional) {
        throw new Error('Sala de chat deve ter paciente e profissional.');
      }

      // Buscar nomes dos participantes
      const { data: profiles } = await supabase
        .from('users')
        .select('id, name')
        .in('id', [patient.user_id, professional.user_id]);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name || 'Usuário']) || []);

      // Preparar sessão de chat
      const chatMessages = messages.map(msg => ({
        id: msg.id,
        room_id: activeRoomId,
        sender_id: msg.senderId,
        message: msg.message,
        created_at: msg.createdAt,
        sender_name: profileMap.get(msg.senderId) || 'Usuário'
      }));

      const session: ChatSession = {
        room_id: activeRoomId,
        patient_id: patient.user_id,
        doctor_id: professional.user_id,
        messages: chatMessages,
        start_time: messages[0]?.createdAt || new Date().toISOString(),
        end_time: messages[messages.length - 1]?.createdAt || new Date().toISOString()
      };

      // Salvar como evolução clínica
      const evolutionId = await ChatEvolutionService.saveChatAsEvolution(session, {
        autoSave: true
      });

      if (evolutionId) {
        alert('✅ Conversa salva como evolução clínica no prontuário do paciente!');
        console.log('📋 Evolução criada:', evolutionId);
      } else {
        throw new Error('Não foi possível salvar a evolução.');
      }
    } catch (error: any) {
      console.error('Erro ao salvar conversa como evolução:', error);
      alert(`Erro ao salvar evolução: ${error.message || 'Tente novamente.'}`);
    } finally {
      setSavingEvolution(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </button>

          <header className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-300 mb-2">Programa de Cuidado Renal</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-white flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-primary-400" />
                Atendimento Integrado
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                Converse com a equipe clínica responsável pelo seu acompanhamento em cannabis medicinal e saúde renal.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                {isOnline ? 'Conectado ao Realtime' : 'Offline'}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                {patientRooms.length} canal(is)
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col">
              <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-400" />
                Equipe clínica
              </h2>

              {inboxLoading || patientsLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando pacientes...
                </div>
              ) : (
                <>
                  {/* Barra de Pesquisa */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Buscar por nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[400px] custom-scrollbar">
                    {/* Salas existentes */}
                    {patientRooms.map(room => {
                      const isActive = room.id === activeRoomId;
                      const unreadBadge = room.unreadCount > 0 && !isActive;

                      return (
                        <button
                          key={room.id}
                          onClick={() => handleSelectRoom(room.id)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${isActive
                            ? 'border-primary-500/60 bg-primary-500/10 text-white'
                            : 'border-slate-800 bg-slate-900/80 text-slate-200 hover:border-primary-500/40 hover:bg-primary-500/5'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{room.name || 'Canal Clínico'}</p>
                              <p className="text-xs text-slate-400">
                                {room.lastMessageAt
                                  ? new Date(room.lastMessageAt).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                  : 'Em aberto'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-2">
                              {unreadBadge && (
                                <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-semibold">
                                  {room.unreadCount}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Pacientes sem sala (apenas para profissionais/admins, não para pacientes) */}
                    {(user?.type === 'profissional' || user?.type === 'admin') && !isPatient && (() => {
                      const patientsWithoutRooms = allPatients.filter(patient => !patientsWithRooms.has(patient.id));
                      console.log('📋 Pacientes sem sala:', patientsWithoutRooms.length, 'de', allPatients.length);
                      return patientsWithoutRooms.map(patient => (
                        <button
                          key={`patient-${patient.id}`}
                          onClick={() => handleCreateRoomForPatient(patient.id, patient.name)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 hover:border-primary-500/40 hover:bg-primary-500/5 hover:text-white px-3 py-3 text-left transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{patient.name || 'Paciente'}</p>
                              <p className="text-xs text-slate-500">Clique para criar canal</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </div>
                        </button>
                      ));
                    })()}

                    {/* Profissionais disponíveis (para iniciar conversa) */}
                    {allProfessionals.length > 0 && !professionalsLoading && (() => {
                      // Para pacientes: mostrar apenas profissionais vinculados
                      // Para admin: mostrar todos
                      const isAdmin = user?.type === 'admin';
                      const availableProfessionals = isAdmin
                        ? allProfessionals.filter(prof => prof.id !== user?.id)
                        : allProfessionals.filter(prof =>
                          prof.id !== user?.id && linkedProfessionalIds.has(prof.id)
                        );

                      // Profissionais não vinculados (para adicionar)
                      const unlinkedProfessionals = allProfessionals.filter(prof =>
                        prof.id !== user?.id && !linkedProfessionalIds.has(prof.id)
                      );

                      console.log('👨‍⚕️ Profissionais vinculados:', availableProfessionals.length, '| Não vinculados:', unlinkedProfessionals.length);

                      return (
                        <>
                          {/* Minha Equipe - Profissionais Vinculados */}
                          {availableProfessionals.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-primary-400 font-semibold mb-2 px-1">💚 Minha Equipe</p>
                              {availableProfessionals.map(prof => (
                                <button
                                  key={`prof-${prof.id}`}
                                  onClick={() => handleCreateRoomWithProfessional(prof.id, prof.name)}
                                  className="w-full mb-1 rounded-xl border border-emerald-800/50 bg-emerald-900/20 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-900/40 hover:text-emerald-200 px-3 py-3 text-left transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold truncate">{prof.name || 'Profissional'}</p>
                                      <p className="text-xs text-emerald-500/70">Clique para conversar</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Add Profissional - Mostrar opções para adicionar */}
                          {(isAdmin || isPatient) && unlinkedProfessionals.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                              <p className="text-xs text-slate-400 font-semibold mb-2 px-1">➕ Adicionar Profissional</p>
                              {unlinkedProfessionals.slice(0, 5).map(prof => (
                                <button
                                  key={`add-prof-${prof.id}`}
                                  onClick={() => handleCreateRoomWithProfessional(prof.id, prof.name)}
                                  className="w-full mb-1 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300 px-3 py-2 text-left transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{prof.name || 'Profissional'}</p>
                                      <p className="text-xs text-slate-500">Clique para adicionar à equipe</p>
                                    </div>
                                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">Add</span>
                                  </div>
                                </button>
                              ))}
                              {unlinkedProfessionals.length > 5 && (
                                <p className="text-xs text-slate-500 text-center mt-2">
                                  +{unlinkedProfessionals.length - 5} profissionais disponíveis
                                </p>
                              )}
                            </div>
                          )}

                          {/* Mensagem se não há profissionais */}
                          {availableProfessionals.length === 0 && patientRooms.length === 0 && !isAdmin && (
                            <div className="text-center py-6 text-slate-400 text-sm">
                              <p>Nenhum profissional vinculado.</p>
                              <p className="text-xs mt-1">Adicione um profissional acima para começar.</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </aside>

            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col min-h-[480px]">
              <div className="border-b border-slate-800 px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {patientRooms.find(room => room.id === activeRoomId)?.name || 'Selecione um canal'}
                  </h2>
                  {!participantsLoading && otherParticipants.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {otherParticipants.map(participant => participant.name || participant.email || 'Profissional').join(' • ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {participantsLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeRoomId ? (
                  messagesLoading ? (
                    <div className="flex items-center justify-center text-sm text-slate-400 h-full">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando mensagens...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center mt-16">
                      Nenhuma conversa registrada ainda. Envie a primeira mensagem para iniciar o atendimento.
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isOwn = msg.senderId === user.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-lg rounded-2xl px-4 py-3 shadow transition-colors ${isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-slate-800 text-slate-100'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="text-xs font-semibold">
                                {isOwn ? 'Você' : msg.senderName || 'Profissional'}
                              </span>
                              <span className="text-[10px] opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      )
                    })
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    Selecione um canal de atendimento para visualizar as mensagens.
                  </div>
                )}
              </div>

              {/* Botão para salvar conversa como evolução (apenas para profissionais) */}
              {activeRoomId && messages.length > 0 && (user?.type === 'profissional' || user?.type === 'admin') && !isPatient && (
                <div className="border-t border-slate-800 px-4 py-2 bg-slate-900/30">
                  <button
                    onClick={handleSaveConversationAsEvolution}
                    disabled={savingEvolution}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingEvolution ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando no prontuário...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Salvar conversa no prontuário do paciente</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Esta conversa será registrada automaticamente como evolução clínica
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitMessage} className="border-t border-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={event => setMessageInput(event.target.value)}
                    placeholder={activeRoomId ? 'Escreva sua mensagem...' : 'Selecione um canal para enviar mensagens'}
                    disabled={!activeRoomId}
                    className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={!activeRoomId || !messageInput.trim()}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-600 hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDoctorChat
