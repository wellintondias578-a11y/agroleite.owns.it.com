import { MessageCircle, X } from 'lucide-react';
import type { StoreSettings } from '../types/store';
import { buildWhatsAppSupportMessage, buildWhatsAppUrl } from '../utils/whatsapp';

export type InfoModalTopic =
  | 'sobre-agroleite'
  | 'nossa-loja'
  | 'fale-conosco'
  | 'privacidade'
  | 'trocas-devolucoes'
  | 'termos-uso'
  | null;

interface InfoContentModalProps {
  topic: InfoModalTopic;
  settings: StoreSettings;
  onClose: () => void;
}

const TOPIC_CONTENT: Record<
  Exclude<InfoModalTopic, null>,
  { title: string; paragraphs: string[] }
> = {
  'sobre-agroleite': {
    title: 'Conheça a AGROLEITE',
    paragraphs: [
      'A AGROLEITE é uma loja agropecuária focada em soluções práticas para a pecuária leiteira, reunindo ordenhadeiras completas, transferidores de leite, teteiras e centenas de peças de reposição em um catálogo organizado.',
      'Nosso atendimento é realizado diretamente por nossa equipe técnica via WhatsApp, garantindo conferência de modelo, voltagem, compatibilidade de peças, disponibilidade e frete antes de finalizar cada compra.',
    ],
  },
  'nossa-loja': {
    title: 'Nossa Loja e Modelo de Atendimento',
    paragraphs: [
      'Trabalhamos com transparência nos preços e nas condições de pagamento: equipamentos e conjuntos elegíveis a partir de R$ 1.000,00 contam com 40% de desconto promocional já exibido e 5% adicional para pagamento via PIX, enquanto itens abaixo de R$ 1.000,00 mantêm seus preços originais.',
      'Cada pedido montado no carrinho é enviado de forma organizada ao nosso WhatsApp oficial para acompanhamento humano, cálculo exato de frete pelo CEP e orientação antes do pagamento.',
    ],
  },
  'fale-conosco': {
    title: 'Fale Conosco',
    paragraphs: [
      'Para tirar dúvidas técnicas, consultar compatibilidade de peças, solicitar cotação de itens sob consulta ou calcular frete, fale diretamente com nossa equipe pelo WhatsApp oficial.',
      'Você também pode enviar perguntas específicas diretamente na página de qualquer produto ou compartilhar sua experiência na seção de avaliações.',
    ],
  },
  privacidade: {
    title: 'Política de Privacidade',
    paragraphs: [
      'As informações fornecidas no fechamento do pedido (nome completo, CPF, telefone, CEP, cidade/estado e observações) são utilizadas exclusivamente para identificação do comprador, cálculo de frete, conferência comercial e atendimento via WhatsApp.',
      'Os cadastros de e-mail realizados com consentimento destinam-se somente ao envio de novidades e ofertas da AGROLEITE. Avaliações de clientes só exibem nome ou cidade/estado quando expressamente autorizados no envio.',
    ],
  },
  'trocas-devolucoes': {
    title: 'Política de Trocas e Devoluções',
    paragraphs: [
      'Em caso de necessidade de troca, devolução ou divergência no recebimento de equipamentos ou peças, entre em contato imediatamente pelo WhatsApp oficial informando o código do pedido e o CPF do comprador.',
      'As condições específicas de prazo, frete de retorno e análise técnica do item são informadas e acompanhadas pela equipe de atendimento conforme o equipamento adquirido e a legislação aplicável.',
    ],
  },
  'termos-uso': {
    title: 'Termos de Uso',
    paragraphs: [
      'Os preços e condições exibidos no catálogo AGROLEITE estão sujeitos à conferência final de estoque, voltagem/especificação e cálculo de frete durante o atendimento oficial pelo WhatsApp.',
      'Itens identificados como "Consulte o preço pelo WhatsApp" dependem de cotação direta com nossa equipe antes do fechamento.',
    ],
  },
};

export function InfoContentModal({ topic, settings, onClose }: InfoContentModalProps) {
  if (!topic) return null;
  const content = TOPIC_CONTENT[topic];
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    buildWhatsAppSupportMessage()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
    >
      <div className="bg-white w-full max-w-lg max-h-[88vh] rounded-2xl border border-[#E2E8E4] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8E4] bg-[#F8FAF8] flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#14231A]">{content.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela informativa"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#E5ECE7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-[#4A5D52] leading-relaxed">
          {content.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}

          <div className="pt-3 border-t border-[#E2E8E4] text-xs space-y-2">
            <div>
              <strong className="text-[#14231A]">Horário de atendimento:</strong>{' '}
              {settings.supportHours}
            </div>
            <div>
              <strong className="text-[#14231A]">Cobertura:</strong> {settings.supportCityState}
            </div>
            {settings.companyLegalInfo && (
              <div>
                <strong className="text-[#14231A]">Dados da empresa:</strong>{' '}
                {settings.companyLegalInfo}
              </div>
            )}
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 rounded-lg bg-[#128C7E] hover:bg-[#0F766E] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar com a equipe no WhatsApp ({settings.whatsappDisplay})</span>
          </a>
        </div>
      </div>
    </div>
  );
}
