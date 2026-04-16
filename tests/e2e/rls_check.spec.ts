import { test, expect } from '@playwright/test';
import { e2eHasFullCreds, e2eHasProCreds, e2ePatientEmail, e2ePatientPassword, e2eProEmail, e2eProPassword } from './e2eEnv';

test.describe('Segurança e RLS', () => {
    test('Médico deve acessar lista de pacientes', async ({ page }) => {
        test.skip(!e2eHasProCreds, 'Defina E2E_PRO_EMAIL e E2E_PRO_PASSWORD no .env');
        await page.goto('/login');
        await page.fill('input[type="email"]', e2eProEmail());
        await page.fill('input[type="password"]', e2eProPassword());
        await page.click('button[type="submit"]');

        // Acessar rota protegida
        await page.goto('/app/clinica/profissional/pacientes');
        await expect(page).toHaveURL(/.*pacientes/);
        await expect(page.getByText('Lista de Pacientes')).toBeVisible();
    });

    test('Paciente NÃO deve acessar área médica', async ({ page }) => {
        test.skip(!e2eHasFullCreds, 'Defina E2E_* (profissional + paciente) no .env');
        await page.goto('/login');
        await page.fill('input[type="email"]', e2ePatientEmail());
        await page.fill('input[type="password"]', e2ePatientPassword());
        await page.click('button[type="submit"]');

        // Tentar acessar rota de médico
        await page.goto('/app/clinica/profissional/pacientes');

        // Deve ser redirecionado ou receber erro (Ajuste conforme lógica do app)
        // Aqui assumimos que redireciona para dashboard do paciente ou login
        await expect(page).not.toHaveURL(/.*profissional\/pacientes/);
        await expect(page).toHaveURL(/.*paciente|login/);
    });
});
