import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import type { StoreSettings } from '../types/store';

interface NewsletterSectionProps {
  settings: StoreSettings;
}

export function NewsletterSection({ settings }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [integrationReady, setIntegrationReady] = useState<boolean | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }
    if (!consentAccepted) {
      setError('Marque a opção confirmando seu consentimento para receber comunicações por e-mail.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          consentAccepted,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        integrationConfigured?: boolean;
      };
      if (!res.ok) {
        setError(data.error || 'Não foi possível concluir o cadastro.');
        return;
      }
      setStatusMessage(data.message || 'Cadastro registrado.');
      setIntegrationReady(Boolean(data.integrationConfigured));
      setEmail('');
    } catch {
      setError('Erro de conexão ao registrar e-mail.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="ofertas-email"
      aria-labelledby="newsletter-title"
      className="bg-[#F1F5F2] border-t border-[#E2E8E4]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-[#E2E8E4] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-md space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#166534]">
              <Mail className="w-4 h-4" />
              <span>Novidades e Condições Comerciais</span>
            </div>
            <h2 id="newsletter-title" className="font-display text-xl sm:text-2xl font-bold text-[#14231A]">
              Cadastre-se e receba ofertas exclusivas.
            </h2>
            <p className="text-sm text-[#4A5D52]">
              Receba nossas novidades e ofertas por e-mail.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 max-w-xl space-y-3" noValidate>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu melhor e-mail"
                aria-label="Seu e-mail para receber ofertas"
                className="flex-1 h-11 px-4 rounded-lg border border-[#E2E8E4] bg-[#F8FAF8] text-sm text-[#14231A] focus:outline-none focus:border-[#166534] focus:bg-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-6 rounded-lg bg-[#166534] hover:bg-[#15803D] disabled:opacity-50 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
              >
                {submitting ? 'Enviando...' : 'Cadastrar'}
              </button>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#4A5D52] cursor-pointer">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 accent-[#166534]"
              />
              <span>
                Concordo em receber novidades e ofertas da AGROLEITE por e-mail, conforme a Política de Privacidade.
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div
                role="status"
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  integrationReady
                    ? 'border-[#166534]/30 bg-[#F1F5F2] text-[#166534]'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </div>
            )}

            {!statusMessage && !settings.newsletterIntegrationConfigured && (
              <p className="text-[11px] text-[#4A5D52]">
                Os e-mails informados ficam salvos no cadastro interno da loja para envio pela equipe AGROLEITE (integração externa automática configurável no painel administrativo).
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
