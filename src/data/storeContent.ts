import type { AcceptedPaymentMethods, FaqItem, SocialLinks } from '../types/store';

export const DEFAULT_ACCEPTED_PAYMENT_METHODS: AcceptedPaymentMethods = {
  pix: true,
  visa: false,
  mastercard: false,
  elo: false,
  hipercard: false,
  amex: false,
  boleto: false,
};

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
};

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-como-comprar',
    topic: 'Como comprar',
    question: 'Como comprar na loja virtual AGROLEITE?',
    answer:
      'Navegue pelas categorias ou utilize a barra de busca para localizar ordenhadeiras, teteiras ou peças. Adicione os itens desejados ao carrinho, revise as quantidades e clique em "Finalizar Pedido pelo WhatsApp" para preencher seus dados e enviar o pedido diretamente à nossa equipe.',
  },
  {
    id: 'faq-pagamento',
    topic: 'Como funciona o pagamento',
    question: 'Como funciona o pagamento e o desconto no PIX?',
    answer:
      'Produtos com preço original igual ou superior a R$ 1.000,00 contam com 40% de desconto promocional já aplicado e recebem ainda 5% de desconto adicional no pagamento via PIX. Itens abaixo de R$ 1.000,00 mantêm o preço original. As instruções e confirmações de pagamento são passadas diretamente no atendimento oficial pelo WhatsApp.',
  },
  {
    id: 'faq-whatsapp',
    topic: 'Como finalizar pelo WhatsApp',
    question: 'Como funciona a finalização do pedido pelo WhatsApp?',
    answer:
      'Ao finalizar no carrinho, solicitamos nome completo, CPF, telefone, CEP e cidade/estado. O sistema gera automaticamente o resumo completo com códigos, quantidades e valores e abre a conversa oficial da AGROLEITE no WhatsApp (+55 11 91415-7359) para conferência antes da confirmação final.',
  },
  {
    id: 'faq-cep',
    topic: 'Como informar o CEP',
    question: 'Por que preciso informar meu CPF e CEP ao finalizar?',
    answer:
      'O CEP é obrigatório para que nossa equipe verifique a cobertura logística e calcule o frete exato para sua região. O CPF é utilizado para identificação do comprador e conferência cadastral durante o atendimento.',
  },
  {
    id: 'faq-entrega',
    topic: 'Como funciona a entrega',
    question: 'Como funciona a entrega dos equipamentos e peças?',
    answer:
      'Realizamos atendimento para envio em todo o Brasil. A modalidade de envio (transportadora ou correios, conforme peso e volume do equipamento) e o prazo estimado são confirmados individualmente com você durante o atendimento pelo WhatsApp após validação do CEP.',
  },
  {
    id: 'faq-frete',
    topic: 'Como consultar o frete',
    question: 'Como consultar o valor do frete antes de fechar o pedido?',
    answer:
      'Basta adicionar os itens desejados ao carrinho e informar seu CEP na finalização — ou enviar o produto e o seu CEP diretamente pelo WhatsApp (+55 11 91415-7359). Nossa equipe calcula e informa o valor do frete com transparência antes da confirmação do pagamento.',
  },
  {
    id: 'faq-garantias',
    topic: 'Como funcionam as garantias',
    question: 'Como funcionam as garantias dos equipamentos e peças?',
    answer:
      'As condições e prazos de garantia variam conforme o fabricante e a linha do equipamento ou componente de reposição. Confirme as condições aplicáveis ao item selecionado diretamente com nossa equipe no WhatsApp antes de concluir sua compra.',
  },
  {
    id: 'faq-ordenhadeiras',
    topic: 'Dúvidas sobre ordenhadeiras',
    question: 'Qual a diferença entre ordenhadeiras elétricas e a gasolina?',
    answer:
      'Modelos elétricos (como a linha Ordenhadeiras Inox e Ordenhadeira Carrelo) são indicados para currais com rede elétrica estável, enquanto os modelos a gasolina (Carrelo Gasolina e 4G Gasolina) oferecem autonomia para propriedades sem ponto de energia próximo ao local de ordenha ou com oscilações frequentes.',
  },
  {
    id: 'faq-pecas',
    topic: 'Peças e acessórios',
    question: 'Como identificar peças e acessórios compatíveis com minha ordenhadeira?',
    answer:
      'Confira o código SKU, medidas e fotos na página do produto. Se tiver qualquer dúvida sobre encaixe, diâmetro de mangueira, modelo de teteira, palheta ou reparo de pulsador, clique em "Precisa de ajuda para escolher?" na página do item para falar direto com nossa equipe.',
  },
  {
    id: 'faq-escolher',
    topic: 'Como escolher o equipamento adequado',
    question: 'Como escolher o equipamento ideal para a minha propriedade?',
    answer:
      'Considere o número de vacas em lactação, o tempo disponível para cada ordenha, a disponibilidade de energia elétrica e a estrutura do curral. Nossa equipe presta atendimento consultivo gratuito pelo WhatsApp para ajudar você a dimensionar o conjunto correto.',
  },
];

export interface AgroArticle {
  id: string;
  slug: string;
  topic: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  readTime: string;
  categoryTarget: string;
  sections: Array<{ heading: string; body: string }>;
}

export const AGRO_ARTICLES: AgroArticle[] = [
  {
    id: 'art-producao-leiteira',
    slug: 'boas-praticas-producao-leiteira',
    topic: 'Produção leiteira',
    title: 'Boas práticas na rotina diária de ordenha e qualidade do leite',
    summary:
      'Organização da sala de ordenha, rotina tranquila com o rebanho e higienização dos utensílios contribuem para a qualidade do leite.',
    image: '/src/assets/images/hero_agroleite_dairy_1795562327189.jpg',
    imageAlt: 'Sala de ordenha organizada com equipamentos em aço inox para produção leiteira',
    readTime: '3 min de leitura',
    categoryTarget: 'Ordenhadeiras Inox',
    sections: [
      {
        heading: 'Ambiente organizado e manejo calmo',
        body: 'Manter o piso limpo, boa ventilação e conduzir os animais sem estresse favorece a descida natural do leite e torna a rotina de ordenha mais previsível e segura para o operador.',
      },
      {
        heading: 'Higienização antes e depois da ordenha',
        body: 'Utilize água limpa para higienização dos equipamentos e siga a sequência recomendada de lavagem após cada turno de ordenha para evitar acúmulo de resíduos nos componentes que entram em contato com o leite.',
      },
    ],
  },
  {
    id: 'art-funcionamento-ordenhadeiras',
    slug: 'como-funciona-uma-ordenhadeira-mecanica',
    topic: 'Funcionamento de ordenhadeiras',
    title: 'Como funciona uma ordenhadeira mecânica: vácuo, pulsação e coleta',
    summary:
      'Entenda o papel conjunto da bomba de vácuo, regulador, pulsador, coletor e teteiras durante o ciclo de ordenha.',
    image: '/src/assets/images/showcase_ordenhadeira_inox_1795562327222.jpg',
    imageAlt: 'Ordenhadeira mecânica em aço inox com tarro coletor e conjunto de teteiras',
    readTime: '4 min de leitura',
    categoryTarget: 'Ordenhadeiras Inox',
    sections: [
      {
        heading: 'Geração e estabilidade do vácuo',
        body: 'A bomba de vácuo retira o ar da tubulação enquanto o regulador estabiliza a pressão de trabalho. O vacuômetro permite acompanhar visualmente se o nível está estável durante toda a operação.',
      },
      {
        heading: 'Alternância entre ordenha e descanso',
        body: 'O pulsador alterna a entrada de ar atmosférico e vácuo na câmara da capa da teteira, fazendo com que o insuflador massageie e extraia o leite de forma cíclica até o coletor e o tarro ou transferidor.',
      },
    ],
  },
  {
    id: 'art-cuidados-equipamentos',
    slug: 'cuidados-com-equipamentos-de-ordenha',
    topic: 'Cuidados com equipamentos',
    title: 'Cuidados diários para prolongar a vida útil da ordenhadeira',
    summary:
      'Verificações rápidas antes de ligar o equipamento evitam desgaste prematuro e paradas inesperadas no curral.',
    image: '/src/assets/images/showcase_ordenhadeira_gasolina_1795562328422.jpg',
    imageAlt: 'Ordenhadeira móvel sobre carrelo com motor acoplado pronta para uso no curral',
    readTime: '3 min de leitura',
    categoryTarget: 'Ordenhadeira Carrelo',
    sections: [
      {
        heading: 'Inspeção visual antes de iniciar',
        body: 'Antes de cada ordenha, observe se há rachaduras nas mangueiras, folgas em abraçadeiras, obstruções no coletor e se a leitura do vacuômetro responde normalmente ao ligar a unidade.',
      },
      {
        heading: 'Armazenamento protegido',
        body: 'Após a limpeza e secagem dos conjuntos, guarde mangueiras e peças sobressalentes em local seco, limpo e protegido da incidência direta de sol intenso para preservar borrachas e silicones.',
      },
    ],
  },
  {
    id: 'art-limpeza-manutencao',
    slug: 'limpeza-e-manutencao-preventiva',
    topic: 'Limpeza e manutenção',
    title: 'Limpeza de mangueiras, coletores e tarros após a ordenha',
    summary:
      'Utilizar escovas adequadas e manter anéis e juntas em bom estado evita contaminações e perda de vácuo.',
    image: '/src/assets/images/showcase_pecas_reposicao_1795562327003.jpg',
    imageAlt: 'Peças de reposição, teteiras, coletores e acessórios de limpeza para ordenhadeira',
    readTime: '3 min de leitura',
    categoryTarget: 'Peças e Acessórios',
    sections: [
      {
        heading: 'Lavagem imediata após o término',
        body: 'Enxaguar o circuito logo após a última vaca impede que gordura e proteínas do leite sequem nas paredes internas das mangueiras, do coletor e do transferidor.',
      },
      {
        heading: 'Escovas e inspeção de vedações',
        body: 'Escovas específicas para tubos e teteiras alcançam pontos onde a água corrente não remove resíduos sozinha. Aproveite o momento para revisar anéis de vedação da tampa do tarro e do coletor.',
      },
    ],
  },
  {
    id: 'art-bombas-vacuo',
    slug: 'bombas-de-vacuo-lubrificacao-e-palhetas',
    topic: 'Bombas de vácuo',
    title: 'Bombas de vácuo: lubrificação, palhetas e checagem periódica',
    summary:
      'A bomba de vácuo é o coração do sistema de ordenha. Lubrificação correta e atenção às palhetas mantêm o desempenho.',
    image: '/src/assets/images/showcase_pecas_reposicao_1795562327003.jpg',
    imageAlt: 'Componentes de bomba de vácuo, lubrificadores e palhetas de reposição',
    readTime: '4 min de leitura',
    categoryTarget: 'Peças e Acessórios',
    sections: [
      {
        heading: 'Óleo específico e gotejamento do lubrificador',
        body: 'Nos modelos lubrificados a óleo, utilize sempre óleo adequado para bomba de vácuo e observe o visor do lubrificador para garantir fluxo contínuo sem excesso nem falta de lubrificação.',
      },
      {
        heading: 'Desgaste de palhetas, correias e retentores',
        body: 'Queda de vácuo ou ruídos incomuns podem indicar desgaste nas palhetas, folga na correia ou desgaste de retentores e rolamentos. Manter peças básicas de reposição reduz o tempo de parada.',
      },
    ],
  },
  {
    id: 'art-teteiras-mangueiras',
    slug: 'teteiras-e-mangueiras-quando-substituir',
    topic: 'Teteiras e mangueiras',
    title: 'Teteiras e mangueiras: sinais de desgaste e cuidados essenciais',
    summary:
      'Insufladores ressecados ou deformados comprometem a vedação e o conforto durante a ordenha.',
    image: '/src/assets/images/showcase_ordenhadeira_inox_1795562327222.jpg',
    imageAlt: 'Conjunto de teteiras e mangueiras conectado ao coletor da ordenhadeira',
    readTime: '3 min de leitura',
    categoryTarget: 'Teteiras',
    sections: [
      {
        heading: 'Atenção à elasticidade da borracha ou silicone',
        body: 'Com o uso contínuo e as lavagens diárias, a parede interna do insuflador perde elasticidade e pode apresentar microfissuras ou deformações na boca.',
      },
      {
        heading: 'Substituição completa do jogo',
        body: 'Quando for necessário trocar as teteiras, recomenda-se substituir o jogo completo de 4 unidades por conjunto de ordenha para manter o funcionamento uniforme em todos os tetos.',
      },
    ],
  },
  {
    id: 'art-escolha-equipamento',
    slug: 'como-escolher-ordenhadeira-ideal',
    topic: 'Escolha de equipamentos',
    title: 'Como escolher entre ordenhadeira balde ao pé, carrelo ou a gasolina',
    summary:
      'Avalie energia disponível, quantidade de conjuntos e rotina da fazenda antes de definir o modelo ideal.',
    image: '/src/assets/images/showcase_ordenhadeira_gasolina_1795562328422.jpg',
    imageAlt: 'Ordenhadeira sobre carrelo com opções elétrica e a gasolina para diferentes propriedades',
    readTime: '4 min de leitura',
    categoryTarget: 'Ordenhadeira Carrelo Gasolina',
    sections: [
      {
        heading: 'Infraestrutura elétrica da propriedade',
        body: 'Se o curral possui energia confiável na voltagem correta (110V ou 220V), as linhas elétricas Inox e Carrelo oferecem operação silenciosa. Em locais sem rede ou sujeitos a quedas frequentes, os modelos a gasolina garantem continuidade.',
      },
      {
        heading: 'Quantidade de conjuntos e transferência de leite',
        body: 'Propriedades que buscam reduzir o transporte manual de tarros até o resfriador podem avaliar o uso de transferidores de leite e unidades finais compatíveis com a sala.',
      },
    ],
  },
  {
    id: 'art-pecas-acessorios',
    slug: 'pecas-e-acessorios-reposicao-rapida',
    topic: 'Peças e acessórios',
    title: 'Kit preventivo de peças e acessórios para não parar a ordenha',
    summary:
      'Ter itens de desgaste comum disponíveis na propriedade evita atrasos nos horários de ordenha.',
    image: '/src/assets/images/hero_agroleite_dairy_1795562327189.jpg',
    imageAlt: 'Estrutura completa de ordenha leiteira com acessórios e peças de reposição',
    readTime: '3 min de leitura',
    categoryTarget: 'Peças e Acessórios',
    sections: [
      {
        heading: 'Itens de troca recorrente',
        body: 'Anéis de vedação, membranas de pulsador, jogo extra de teteiras, pedaços de mangueira de leite e vácuo, abraçadeiras e óleo de bomba de vácuo estão entre os itens mais úteis para manter em estoque na fazenda.',
      },
      {
        heading: 'Apoio na identificação da peça certa',
        body: 'Em caso de dúvida sobre medidas ou compatibilidade de modelo, nossa equipe presta orientação pelo WhatsApp antes de confirmar o envio.',
      },
    ],
  },
];
