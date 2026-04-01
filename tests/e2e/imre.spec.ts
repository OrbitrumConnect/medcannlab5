import { test, expect } from '@playwright/test';
import { e2eHasPatientCreds, e2ePatientEmail, e2ePatientPassword } from './e2eEnv';

test.describe('Fluxo Clínico IMRE', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!e2eHasPatientCreds, 'Defina E2E_PATIENT_EMAIL e E2E_PATIENT_PASSWORD no .env');
        await page.goto('/login');
        await page.fill('input[type="email"]', e2ePatientEmail());
        await page.fill('input[type="password"]', e2ePatientPassword());
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*paciente/);
    });

    test('Iniciar Avaliação IMRE', async ({ page }) => {
        // Navegar para avaliação
        await page.goto('/app/paciente/avaliacao/imre');

        // Verificar se a página carregou
        await expect(page.getByText('Inventário de Medicina Receptiva')).toBeVisible();

        // Iniciar
        await page.getByRole('button', { name: /iniciar|começar/i }).click();

        // Verificar passo 1
        await expect(page.getByText('Passo 1')).toBeVisible();

        // Simular preenchimento (ajuste conforme os campos reais)
        // await page.click('text=Opção A');
        // await page.click('button:has-text("Próximo")');
    });
});
