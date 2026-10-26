import type { Category, Difficulty, WordEntry } from '../types'
import { createWordId } from './wordId'

const additionalGroups: Record<Category, Record<Difficulty, string>> = {
  animais: {
    facil: 'abelha|aranha|barata|borboleta|formiga|mosquito|mosca|besouro|grilo|gafanhoto|joaninha|minhoca|lesma|caracol|siri|camarão|salmão|sardinha|atum|bacalhau|piranha|bagre|tilápia|truta|boi|bezerro|burro|jumento|lhama|alpaca|veado|rena|coala|panda|hamster|porquinho-da-índia|periquito|canário|pombo|cisne',
    medio: 'onça|leopardo|guepardo|pantera|lebre|castor|guaxinim|gambá|preguiça|ouriço|porco-espinho|toupeira|chacal|coiote|dromedário|iaque|alce|mula|pônei|cervo|impala|gnu|ema|seriema|urubu|gaivota|pardal|andorinha|beija-flor|pica-pau|rouxinol|cegonha|maritaca|calopsita|mariposa|libélula|cigarra|centopeia|escorpião|carrapato',
    dificil: 'naja|píton|cascavel|sucuri|iguana|camaleão|lagarto|lagartixa|jabuti|cágado|crocodilo|tritão|rã|perereca|sapo-cururu|baiacu|pirarucu|dourado|lambari|anchova|arenque|esturjão|moreia|barracuda|orca|cachalote|manatim|dugongo|beluga|elefante-marinho|leão-marinho|lince|serval|caracal|jaguarundi|irara|cutia|paca|preá|mutum',
  },
  objetos: {
    facil: 'armário|estante|gaveta|banqueta|escrivaninha|cômoda|berço|colchão|cobertor|lençol|almofada|xícara|tigela|jarra|bule|funil|peneira|ralador|abridor|saca-rolhas|tábua|avental|rodo|pá|espanador|sabão|esponja|prendedor|agulha|linha|zíper|fivela|chapéu|boné|cinto|luva|meia|chinelo|bota|saia',
    medio: 'prateleira|cristaleira|aparador|biombo|pufe|poltrona|beliche|mosquiteiro|edredom|colcha|persiana|veneziana|maçaneta|cadeado|corrente|dobradiça|ferrolho|tomada|interruptor|extensão|adaptador|carregador|pilha|lâmpada|lustre|abajur|candelabro|castiçal|bandeja|sopeira|escumadeira|concha|espátula|pegador|moedor|espremedor|coador|guardanapo|paliteiro|açucareiro',
    dificil: 'almofariz|pilão|samovar|decantador|cantil|odre|alforje|bornal|coldre|bainha|boina|cartola|tiara|broche|bracelete|tornozeleira|abotoadura|monóculo|luneta|astrolábio|cronômetro|barômetro|higrômetro|anemômetro|goniômetro|transferidor|nível|prumo|torno|serrote|plaina|formão|lima|broca|rebite|arruela|porca|grampo|esmeril|maçarico',
  },
  alimentos: {
    facil: 'pera|pêssego|ameixa|cereja|mamão|goiaba|maracujá|coco|kiwi|melão|tangerina|jabuticaba|acerola|caju|figo|caqui|romã|abacate|cebola|alho|pepino|repolho|couve|espinafre|rabanete|pimentão|vagem|quiabo|chuchu|cogumelo|sal|açúcar|manteiga|margarina|presunto|mortadela|salsicha|bacon|farinha|vinagre',
    medio: 'rúcula|agrião|couve-flor|acelga|nabo|jiló|cará|batata-doce|pinhão|noz|avelã|macadâmia|gergelim|linhaça|chia|quinoa|cevada|centeio|grão-de-bico|soja|tofu|ricota|requeijão|muçarela|parmesão|salame|pernil|costela|lombo|maionese|mostarda|ketchup|molho|geleia|compota|picles|torrada|tapioca|farofa|feijoada',
    dificil: 'amaranto|alcaparra|funcho|erva-doce|sálvia|alecrim|manjericão|coentro|tomilho|orégano|páprica|cominho|gengibre|cúrcuma|wasabi|missô|tempeh|tahine|burrata|gorgonzola|camembert|gruyère|provolone|pecorino|pastrami|prosciutto|salmoura|melaço|rapadura|ambrosia|zabaglione|panna-cotta|petit-four|macaron|éclair|cannoli|strudel|brioche|focaccia|ciabatta',
  },
  profissoes: {
    facil: 'agricultor|pescador|jardineiro|açougueiro|feirante|assistente|recepcionista|secretário|gerente|empresário|administrador|técnico|operador|entregador|motoboy|taxista|cobrador|frentista|porteiro|zelador|vigia|segurança|salva-vidas|guia|comerciante|balconista|atendente|barista|confeiteiro|pizzaiolo|churrasqueiro|manicure|maquiador|massagista|treinador|instrutor|músico|escritor|poeta|mágico',
    medio: 'analista|consultor|pesquisador|pedagogo|assistente-social|terapeuta|ortopedista|pediatra|cirurgião|radiologista|oftalmologista|dermatologista|ginecologista|obstetra|urologista|oncologista|psiquiatra|paramédico|socorrista|protético|optometrista|zootecnista|botânico|ecologista|físico|matemático|geógrafo|filósofo|teólogo|linguista|intérprete|revisor|editor|roteirista|produtor|cineasta|repórter|apresentador|radialista|ilustrador',
    dificil: 'neurocirurgião|endocrinologista|gastroenterologista|hematologista|nefrologista|pneumologista|reumatologista|geriatra|infectologista|patologista|otorrinolaringologista|proctologista|podólogo|terapeuta-ocupacional|instrumentador|perfusionista|biomédico|bioquímico|astrofísico|microbiologista|virologista|parasitologista|toxicologista|perito|legista|arquivista|museólogo|genealogista|etnógrafo|demógrafo|semiólogo|dramaturgo|figurinista|sonoplasta|iluminador|cinegrafista|ourives|luthier|tapeceiro|marceneiro',
  },
  lugares: {
    facil: 'supermercado|farmácia|correio|posto|delegacia|salão|barbearia|petshop|shopping|loja|feira|açougue|sorveteria|lanchonete|pizzaria|bar|boate|clube|piscina|quadra|campo|ginásio|creche|faculdade|universidade|apartamento|prédio|garagem|corredor|sala|escritório|consultório|despensa|lavanderia|sacada|terraço|telhado|calçada|esquina|túnel',
    medio: 'alfândega|consulado|fórum|cartório|tribunal|penitenciária|usina|refinaria|mineradora|serraria|gráfica|editora|estúdio|camarim|arena|pista|hangar|doca|trapiche|marina|camping|pousada|albergue|chalé|cabana|tenda|quiosque|coreto|parquinho|parque-aquático|jardim-botânico|reserva|aldeia|vila|distrito|subúrbio|metrópole|capital|fronteira|rotatória',
    dificil: 'necrópole|claustro|seminário|convento|sinagoga|mesquita|pagode|basílica|capela|templo|torre|campanário|minarete|miradouro|aqueduto|barragem|eclusa|represa|cisterna|celeiro|moinho|silo|galpão|casamata|bastião|muralha|trincheira|arsenal|sítio|chácara|latifúndio|haras|curral|estábulo|pocilga|galinheiro|canil|gatil|apiário|aviário',
  },
  natureza: {
    facil: 'brisa|sereno|garoa|temporal|verão|calor|frio|umidade|seca|enchente|poça|bosque|mata|selva|arbusto|musgo|samambaia|bambu|pinheiro|coqueiro|roseira|margarida|girassol|orquídea|violeta|lírio|tulipa|cravo|cipó|casca|tronco|pétala|espinho|pólen|néctar|colmeia|ninho|toca|teia|orvalho-da-manhã',
    medio: 'ciclone|vendaval|monção|cerração|miragem|ressaca|tsunami|maremoto|enxurrada|inundação|estiagem|foz|afluente|delta|lagoa|pântano|brejo|charco|várzea|pradaria|pampas|cerrado|caatinga|chapada|serra|cordilheira|morro|desfiladeiro|ravina|grotão|gruta|alagado|restinga|falésia|atol|banco-de-areia|ilha-vulcânica|floresta-tropical|mata-atlântica|recife-de-coral',
    dificil: 'tectônica|crosta|manto|núcleo|mineral|cristal|quartzo|granito|basalto|calcário|argila|húmus|seiva|clorofila|estame|pistilo|sépala|esporo|líquen|fungo|micélio|plâncton|fitoplâncton|zooplâncton|cadeia-alimentar|habitat|bioma|fauna|flora|microclima|pressão-atmosférica|magnetismo|radiação-solar|maré-alta|maré-baixa|corrente-marítima|dorsal-oceânica|placa-tectônica|aquífero|lençol-freático',
  },
  esportes: {
    facil: 'caminhada|pular-corda|alongamento|musculação|aeróbica|zumba|balé|frescobol|pingue-pongue|vôlei-de-praia|futebol-de-areia|futebol-de-mesa|pebolim|jogo-de-damas|truco|buraco|bocha|malha|argolas|cambalhota|pirueta|revezamento|sprint|obstáculo|gol|passe|drible|chute|cabeceio|saque|bloqueio|manchete|cesta|rebote|pódio|troféu|uniforme|placar|apito|trave',
    medio: 'mountain-bike|BMX|spinning|crossfit|levantamento-de-peso|luta-livre|muay-thai|kickboxing|wrestling|aikido|kung-fu|krav-magá|savate|pugilismo|duatlo|aquatlo|corrida-de-aventura|corrida-de-rua|trail-running|patins|skateboard|snowboard|esqui|alpinismo|montanhismo|trekking|cavalgada|turfe|kart|rali|motovelocidade|jet-ski|esqui-aquático|bodyboard|stand-up-paddle|mergulho-livre|apneia|pesca-esportiva|tiro-esportivo|tiro-com-arco',
    dificil: 'futebol-americano|flag-football|futevôlei|voleibol-sentado|basquete-em-cadeira-de-rodas|goalball|bocha-paralímpica|esgrima-em-cadeira-de-rodas|paracanoagem|paratriatlo|parabadminton|hipismo-adaptado|rugby-em-cadeira-de-rodas|powerlifting|strongman|cross-country|steeplechase|salto-com-vara|salto-triplo|lançamento-de-disco|lançamento-de-martelo|lançamento-de-dardo|arremesso-de-peso|nado-borboleta|nado-costas|nado-peito|nado-livre|revezamento-medley|slalom|freestyle|halfpipe|downhill|supergigante|esqui-cross-country|patinação-artística|patinação-de-velocidade|hóquei-no-gelo|hóquei-sobre-grama|polo-equestre|adestramento',
  },
  tecnologia: {
    facil: 'tablet|notebook|relógio-inteligente|fone|caixa-de-som|controle-remoto|pendrive|cartão-de-memória|disco|programa|ícone|janela-digital|menu|atalho|toque|clique|foto|áudio|música-digital|chamada|contato|agenda|alarme|calendário|GPS|QR-code|código-de-barras|videogame|impressão|cópia|recorte|colagem|texto|documento|lixeira|antivírus|wi-fi|conexão|fone-de-ouvido|webcam',
    medio: 'placa-mãe|placa-de-vídeo|disco-rígido|fonte-de-alimentação|gabinete|cooler|porta-USB|HDMI|ethernet|fibra-óptica|banda-larga|rede-sem-fio|endereço-IP|cache|cookie|sessão|abas|extensão-digital|plugin|driver|firmware|sistema-operacional|aplicativo-web|editor-de-texto|terminal|comando|script|variável|função|classe|objeto-digital|biblioteca-digital|framework|API|nuvem-digital|hospedagem-digital|provedor|videoconferência|mensageiro|notificação',
    dificil: 'redes-neurais|visão-computacional|processamento-de-linguagem|mineração-de-dados|ciência-de-dados|computação-em-nuvem|computação-de-borda|internet-das-coisas|gêmeo-digital|robótica|mecatrônica|microeletrônica|semicondutor|transistor|circuito-integrado|microcontrolador|microprocessador|kernel|hipervisor|máquina-virtual|orquestração|balanceamento-de-carga|proxy|gateway|DNS|VPN|SSH|token|certificado-digital|assinatura-digital|hash|sandbox|ransomware|malware|phishing|engenharia-social|teste-de-penetração|código-aberto|controle-de-versão|integração-contínua',
  },
  cotidiano: {
    facil: 'pai|mãe|irmão|irmã|avô|vovó|tio|tia|primo|prima|namorado|namorada|colega|chefe|cliente|bebê|jovem|adulto|idoso|café-da-manhã|lanche|sobremesa|fome|sede|acordar|dormir|trabalhar|estudar|brincar|caminhar|dirigir|cozinhar|lavar|varrer|arrumar|telefonar|rir|chorar|falar|ouvir',
    medio: 'amizade|namoro|noivado|separação|divórcio|nascimento|batizado|velório|funeral|feriado|fim-de-semana|madrugada|pontualidade|atraso|fila|engarrafamento|carona|passagem|bagagem|pernoite|boleto|imposto|salário|poupança|dívida|empréstimo|desconto|promoção|garantia|entrega|encomenda|devolução|troca|manutenção|conserto|organização|planejamento|imprevisto|emergência|favor',
    dificil: 'comportamento|personalidade|temperamento|autoestima|motivação|disciplina|hábito|procrastinação|produtividade|concentração|aprendizado|experiência|maturidade|independência|autonomia|reciprocidade|respeito|tolerância|honestidade|lealdade|gratidão|generosidade|humildade|perseverança|determinação|adaptação|superação|arrependimento|decepção|preocupação|alívio|entusiasmo|tédio|vergonha|culpa|inveja|admiração|compaixão|pertencimento|intimidade',
  },
  cultura_geral: {
    facil: 'canção|álbum|banda|orquestra|violão|guitarra|piano|flauta|tambor|sanfona|harpa|violino|samba|forró|frevo|funk|rock|jazz|carnaval|folclore|lenda|mito|conto|poesia|romance|revista|jornal|desenho|pintura|escultura|fotografia|história|geografia|matemática|ciência|arte|idioma|alfabeto|número|mapa|globo|país|estado|continente|Brasil|América|Europa|África|Ásia|Oceania|Antártida|planeta|universo|espaço|foguete|dinossauro|fóssil|pirâmide|imperador|rei|rainha|príncipe|princesa|presidente|governo|eleição|voto|bandeira|hino|moeda',
    medio: 'ópera|sinfonia|concerto|melodia|ritmo|harmonia|partitura|refrão|estrofe|soneto|crônica|biografia|autobiografia|fábula|parábola|sátira|comédia|tragédia|documentário|animação|suspense|fantasia|ficção|aventura|drama|roteiro|palco|plateia|estreia|festival|exposição|patrimônio|monumento|estátua|mosaico|afresco|gravura|xilogravura|cerâmica|artesanato|maracatu|bossa-nova|sertanejo|chorinho|tropicalismo|modernismo|romantismo|realismo|renascimento|barroco|iluminismo|revolução|república|monarquia|império|colônia|abolição|constituição|parlamento|ministério|congresso|senado|município|população|sociedade|economia|agricultura|indústria|comércio|turismo',
    dificil: 'epistemologia|antropologia|sociologia|psicologia|linguística|semiótica|hermenêutica|estética|metafísica|ontologia|lógica|retórica|dialética|etimologia|mitologia|teologia|paleontologia|historiografia|cartografia|demografia|geopolítica|soberania|federalismo|presidencialismo|parlamentarismo|constitucionalismo|liberalismo|socialismo|capitalismo|mercantilismo|colonialismo|imperialismo|feudalismo|absolutismo|aristocracia|oligarquia|burguesia|proletariado|urbanização|industrialização|globalização|imigração|emigração|diáspora|miscigenação|etnocentrismo|multiculturalismo|patrimônio-imaterial|patrimônio-material|vanguarda|expressionismo|impressionismo|cubismo|surrealismo|dadaísmo|futurismo|neoclassicismo|minimalismo|abstracionismo|dramaturgia|coreografia|cenografia|filmografia|discografia|bibliografia|fonética|fonologia|morfologia|sintaxe|semântica',
  },
}

export const additionalWords: WordEntry[] = Object.entries(additionalGroups).flatMap(([category, difficultyGroups]) =>
  Object.entries(difficultyGroups).flatMap(([difficulty, words]) =>
    words.split('|').map((text) => ({
      id: createWordId(category as Category, difficulty as Difficulty, text),
      text: text.toLocaleUpperCase('pt-BR'),
      category: category as Category,
      difficulty: difficulty as Difficulty,
    })),
  ),
)

export const ADDITIONAL_WORD_COUNTS = Object.fromEntries(
  Object.entries(additionalGroups).flatMap(([category, difficultyGroups]) =>
    Object.entries(difficultyGroups).map(([difficulty, words]) => [`${category}:${difficulty}`, words.split('|').length]),
  ),
)
