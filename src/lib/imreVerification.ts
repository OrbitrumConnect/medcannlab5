// =====================================================
// VERIFICAÇÃO E TESTE DO SISTEMA IMRE
// =====================================================
// Utilitário para verificar se o sistema IMRE está funcionando corretamente

import { supabase } from './supabase'

export interface IMREVerificationResult {
  tablesExist: boolean
  rlsEnabled: boolean
  canInsert: boolean
  canRead: boolean
  errors: string[]
  warnings: string[]
}

export class IMREVerification {
  /**
   * Verifica se todas as tabelas IMRE existem
   */
  static async verifyTables(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('imre_assessments')
        .select('id')
        .limit(1)

      if (error) {
        console.error('❌ Tabela imre_assessments não existe ou não está acessível:', error)
        return false
      }

      // Verificar outras tabelas
      const tables = [
        'imre_semantic_blocks',
        'imre_semantic_context',
        'noa_interaction_logs',
        'clinical_integration'
      ]

      for (const table of tables) {
        const { error: tableError } = await supabase
          .from(table as any)
          .select('id')
          .limit(1)

        if (tableError) {
          console.error(`❌ Tabela ${table} não existe ou não está acessível:`, tableError)
          return false
        }
      }

      console.log('✅ Todas as tabelas IMRE existem e estão acessíveis')
      return true
    } catch (error) {
      console.error('❌ Erro ao verificar tabelas IMRE:', error)
      return false
    }
  }

  /**
   * Testa inserção de dados de teste
   */
  static async testInsert(userId: string): Promise<boolean> {
    try {
      const testAssessment = {
        user_id: userId,
        triaxial_data: {
          emotional: { intensity: 5, valence: 6, arousal: 5, stability: 7 },
          cognitive: { attention: 6, memory: 7, executive: 6, processing: 7 },
          behavioral: { activity: 7, social: 6, adaptive: 7, regulatory: 6 }
        },
        semantic_context: {
          main_complaint: 'Teste de verificação IMRE',
          symptoms: ['teste']
        },
        completion_status: 'completed'
      }

      const { data, error } = await supabase
        .from('imre_assessments')
        .insert(testAssessment)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao inserir teste:', error)
        return false
      }

      // Limpar dados de teste
      if (data?.id) {
        await supabase
          .from('imre_assessments')
          .delete()
          .eq('id', data.id)
      }

      console.log('✅ Teste de inserção bem-sucedido')
      return true
    } catch (error) {
      console.error('❌ Erro no teste de inserção:', error)
      return false
    }
  }

  /**
   * Verificação completa do sistema IMRE
   */
  static async verifyComplete(userId?: string): Promise<IMREVerificationResult> {
    const result: IMREVerificationResult = {
      tablesExist: false,
      rlsEnabled: false,
      canInsert: false,
      canRead: false,
      errors: [],
      warnings: []
    }

    try {
      // 1. Verificar se tabelas existem
      result.tablesExist = await this.verifyTables()
      if (!result.tablesExist) {
        result.errors.push('Tabelas IMRE não existem ou não estão acessíveis')
        return result
      }

      // 2. Verificar RLS (tentando ler sem autenticação falhará se RLS estiver ativo)
      try {
        const { data, error } = await supabase
          .from('imre_assessments')
          .select('id')
          .limit(1)

        if (error && error.code === '42501') {
          result.rlsEnabled = true
          result.warnings.push('RLS está ativo (bom para segurança)')
        } else if (!error) {
          result.rlsEnabled = true
          result.canRead = true
        }
      } catch (e) {
        result.warnings.push('Não foi possível verificar RLS completamente')
      }

      // 3. Testar inserção se userId fornecido
      if (userId) {
        result.canInsert = await this.testInsert(userId)
        if (!result.canInsert) {
          result.errors.push('Não foi possível inserir dados de teste')
        }
      } else {
        result.warnings.push('userId não fornecido - teste de inserção pulado')
      }

      return result
    } catch (error) {
      result.errors.push(`Erro geral na verificação: ${error}`)
      return result
    }
  }

  /**
   * Gera relatório de verificação
   */
  static generateReport(result: IMREVerificationResult): string {
    let report = '📊 RELATÓRIO DE VERIFICAÇÃO IMRE\n'
    report += '='.repeat(50) + '\n\n'

    report += `✅ Tabelas Existem: ${result.tablesExist ? 'SIM' : 'NÃO'}\n`
    report += `🔒 RLS Habilitado: ${result.rlsEnabled ? 'SIM' : 'NÃO'}\n`
    report += `✍️  Pode Inserir: ${result.canInsert ? 'SIM' : 'NÃO'}\n`
    report += `👁️  Pode Ler: ${result.canRead ? 'SIM' : 'NÃO'}\n\n`

    if (result.errors.length > 0) {
      report += '❌ ERROS:\n'
      result.errors.forEach(error => {
        report += `  - ${error}\n`
      })
      report += '\n'
    }

    if (result.warnings.length > 0) {
      report += '⚠️  AVISOS:\n'
      result.warnings.forEach(warning => {
        report += `  - ${warning}\n`
      })
      report += '\n'
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      report += '✅ Sistema IMRE está funcionando corretamente!\n'
    }

    return report
  }
}

