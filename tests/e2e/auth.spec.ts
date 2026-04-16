import { test, expect } from '@playwright/test';
import { e2eHasPatientCreds, e2eHasProCreds, e2ePatientEmail, e2ePatientPassword, e2eProEmail, e2eProPassword } from './e2eEnv';

test.describe('Autenticação', () => {
    test('Login Profissional com Sucesso', async ({ page }) => {
        test.skip(!e2eHasProCreds, 'Defina E2E_PRO_EMAIL e E2E_PRO_PASSWORD no .env');
        await page.goto('/login');
        await page.fill('input[type="email"]', e2eProEmail());
        await page.fill('input[type="password"]', e2eProPassword());
        await page.click('button[type="submit"]');

        // Espera redirecionamento para dashboard
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.getByText('Ricardo Test')).toBeVisible();
    });

    test('Login Paciente com Sucesso', async ({ page }) => {
        test.skip(!e2eHasPatientCreds, 'Defina E2E_PATIENT_EMAIL e E2E_PATIENT_PASSWORD no .env');
        await page.goto('/login');
        await page.fill('input[type="email"]', e2ePatientEmail());
        await page.fill('input[type="password"]', e2ePatientPassword());
        await page.click('button[type="submit"]');

        // Espera redirecionamento para área do paciente
        await expect(page).toHaveURL(/.*paciente/);
    });

    test('Login Falha com Senha Errada', async ({ page }) => {
        test.skip(!e2eHasProCreds, 'Defina E2E_PRO_EMAIL e E2E_PRO_PASSWORD no .env');
        await page.goto('/login');
        await page.fill('input[type="email"]', e2eProEmail());
        await page.fill('input[type="password"]', '__wrong_password_intentional__');
        await page.click('button[type="submit"]');

        // Verifica mensagem de erro (ajuste o seletor conforme sua UI real)
        await expect(page.getByText('Invalid login credentials')).toBeVisible();
    });
});
