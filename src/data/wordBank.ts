import type { Category, Difficulty, WordEntry } from '../types'
import { createWordId } from './wordId'

type CoreCategory = Exclude<Category, 'cultura_geral'>
type WordGroups = Record<CoreCategory, Record<Difficulty, string>>

const groups: WordGroups = {
  animais: {
    facil: 'cachorro|gato|leão|tigre|elefante|girafa|macaco|cavalo|vaca|porco|coelho|rato|urso|lobo|raposa|zebra|cobra|sapo|peixe|pato|galinha|galo|ovelha|cabra|tartaruga|jacaré|tubarão|baleia|golfinho|pinguim',
    medio: 'rinoceronte|hipopótamo|canguru|camelo|gorila|águia|coruja|falcão|tucano|papagaio|avestruz|flamingo|pelicano|morcego|esquilo|lontra|foca|polvo|lula|caranguejo|lagosta|cavalo-marinho|água-viva|tamanduá|tatu|capivara|hiena|javali|pavão|salamandra',
    dificil: 'ornitorrinco|axolote|narval|pangolim|suricato|lêmure|ocapi|carcaju|quati|mangusto|chimpanzé|orangotango|mandril|condor|albatroz|grou|faisão|perdiz|garça|marreco|doninha|texugo|antílope|bisão|búfalo|gazela|jaguatirica|suçuarana|arraia|enguia',
  },
  objetos: {
    facil: 'mesa|cadeira|cama|sofá|porta|janela|copo|prato|garfo|faca|colher|panela|balde|vassoura|espelho|relógio|chave|livro|lápis|caneta|papel|mochila|sapato|camisa|telefone|garrafa|caixa|toalha|escova|tesoura',
    medio: 'microfone|termômetro|bússola|binóculo|lanterna|martelo|alicate|parafuso|furadeira|liquidificador|batedeira|torradeira|chaleira|frigideira|travesseiro|cabide|grampeador|calculadora|teclado|monitor|controle|ventilador|aspirador|extintor|capacete|guarda-chuva|carteira|moldura|cortina|tapete',
    dificil: 'caleidoscópio|sextante|ampulheta|estilete|cinzel|bigorna|compasso|esquadro|paquímetro|estetoscópio|microscópio|telescópio|periscópio|projetor|retrovisor|vitrola|metrônomo|diapasão|catraca|roldana|engrenagem|torniquete|pergaminho|cavalete|manivela|trinco|aldrava|lampião|lamparina|relicário',
  },
  alimentos: {
    facil: 'arroz|feijão|pão|bolo|queijo|leite|ovo|carne|frango|linguiça|maçã|banana|laranja|uva|morango|limão|manga|melancia|abacaxi|batata|cenoura|tomate|alface|milho|chocolate|sorvete|pizza|macarrão|sopa|café',
    medio: 'lasanha|risoto|panqueca|omelete|salada|hambúrguer|pastel|coxinha|quibe|empada|pudim|brigadeiro|biscoito|iogurte|granola|aveia|lentilha|ervilha|brócolis|berinjela|abóbora|beterraba|mandioca|inhame|palmito|azeitona|castanha|amendoim|canela|mel',
    dificil: 'ratatouille|carpaccio|quiche|suflê|nhoque|ravióli|talharim|cuscuz|polenta|paella|ceviche|sashimi|guacamole|homus|falafel|chutney|fondue|rocambole|pavê|tiramisu|merengue|marzipã|pralina|pistache|açafrão|cardamomo|noz-moscada|alcachofra|aspargo|trufa',
  },
  profissoes: {
    facil: 'professor|médico|enfermeiro|dentista|advogado|engenheiro|policial|bombeiro|motorista|cozinheiro|padeiro|garçom|vendedor|pintor|ator|cantor|jornalista|fotógrafo|fazendeiro|mecânico|eletricista|encanador|pedreiro|carteiro|costureiro|cabeleireiro|veterinário|piloto|juiz|cientista',
    medio: 'arquiteto|nutricionista|fisioterapeuta|psicólogo|farmacêutico|contador|economista|programador|designer|publicitário|tradutor|bibliotecário|historiador|geólogo|biólogo|químico|sociólogo|diplomata|astronauta|marinheiro|soldado|detetive|locutor|dublador|cenógrafo|coreógrafo|maestro|escultor|joalheiro|florista',
    dificil: 'arqueólogo|paleontólogo|oceanógrafo|cartógrafo|meteorologista|antropólogo|agrônomo|urbanista|tabelião|auditor|atuário|estatístico|psicanalista|fonoaudiólogo|quiropraxista|acupunturista|anestesista|neurologista|cardiologista|imunologista|epidemiologista|geneticista|entomologista|ornitólogo|primatólogo|vulcanólogo|sismólogo|lexicógrafo|musicólogo|criminologista',
  },
  lugares: {
    facil: 'escola|hospital|igreja|praia|parque|praça|mercado|cinema|teatro|restaurante|hotel|aeroporto|estação|biblioteca|museu|fazenda|floresta|deserto|ilha|cidade|bairro|rua|avenida|castelo|ponte|porto|zoológico|estádio|academia|circo',
    medio: 'laboratório|observatório|planetário|aquário|catedral|mosteiro|palácio|fortaleza|embaixada|prefeitura|quartel|fábrica|oficina|depósito|armazém|rodoviária|plataforma|condomínio|cobertura|porão|sótão|varanda|cafeteria|padaria|livraria|galeria|auditório|santuário|cemitério|farol',
    dificil: 'arquipélago|península|istmo|fiorde|cânion|planalto|savana|tundra|manguezal|estuário|oásis|geleira|vulcão|cratera|abismo|caverna|catacumba|mausoléu|anfiteatro|hipódromo|autódromo|heliporto|estaleiro|vinhedo|orquidário|viveiro|cidadela|labirinto|mirante|ruína',
  },
  natureza: {
    facil: 'sol|lua|estrela|nuvem|chuva|vento|mar|rio|lago|montanha|árvore|flor|pedra|areia|terra|fogo|água|céu|trovão|raio|arco-íris|neve|gelo|folha|semente|raiz|galho|fruto|grama|lama',
    medio: 'tempestade|furacão|tornado|neblina|orvalho|geada|granizo|relâmpago|cachoeira|oceano|riacho|nascente|vale|colina|penhasco|duna|recife|coral|onda|maré|correnteza|redemoinho|terremoto|eclipse|aurora|horizonte|primavera|outono|inverno|litoral',
    dificil: 'metamorfose|fotossíntese|biodiversidade|ecossistema|atmosfera|biosfera|estratosfera|ionosfera|magma|lava|gêiser|avalanche|erosão|sedimentação|evaporação|condensação|precipitação|polinização|germinação|migração|hibernação|equinócio|solstício|constelação|nebulosa|galáxia|asteroide|cometa|meteorito|gravidade',
  },
  esportes: {
    facil: 'futebol|basquete|vôlei|tênis|natação|corrida|ciclismo|boxe|judô|surfe|golfe|skate|xadrez|handebol|beisebol|dança|yoga|ginástica|salto|remo|vela|canoagem|pesca|sinuca|boliche|dardo|arco|flecha|medalha|torcida',
    medio: 'maratona|triatlo|pentatlo|atletismo|badminton|squash|rúgbi|críquete|polo|esgrima|caratê|taekwondo|capoeira|halterofilismo|escalada|mergulho|patinação|hipismo|automobilismo|motocross|paraquedismo|rapel|rafting|hóquei|futsal|queimada|peteca|dominó|bilhar|parkour',
    dificil: 'decatlo|heptatlo|curling|biatlo|bobsled|skeleton|luge|lacrosse|softbol|pelota|sumô|kendo|jiu-jitsu|polo-aquático|nado-sincronizado|marcha-atlética|arremesso|pentatlo-moderno|windsurfe|kitesurfe|wakeboard|canicross|ciclocross|enduro|orientação|corfebol|sepak-takraw|kabaddi|slackline|ultramaratona',
  },
  tecnologia: {
    facil: 'computador|internet|celular|aplicativo|câmera|televisão|rádio|robô|impressora|bateria|cabo|senha|arquivo|pasta|mouse|site|vídeo|jogo|tela|botão|rede|sinal|satélite|e-mail|mensagem|chip|dados|código|busca|link',
    medio: 'algoritmo|software|hardware|servidor|navegador|planilha|podcast|streaming|bluetooth|roteador|modem|memória|processador|sensor|drone|console|joystick|scanner|backup|firewall|login|perfil|download|upload|atualização|pixel|cursor|portal|domínio|avatar',
    dificil: 'criptografia|inteligência-artificial|blockchain|metaverso|holograma|cibersegurança|biometria|nanotecnologia|computação-quântica|realidade-virtual|realidade-aumentada|aprendizado-de-máquina|banco-de-dados|código-fonte|protocolo|linguagem|compilador|depurador|repositório|contêiner|microsserviço|arquitetura|automação|interface|telemetria|virtualização|autenticação|sincronização|interoperabilidade|latência',
  },
  cotidiano: {
    facil: 'família|amigo|festa|trabalho|dinheiro|manhã|noite|almoço|jantar|banho|sono|sonho|sorriso|abraço|beijo|presente|viagem|férias|trânsito|ônibus|trem|bicicleta|cozinha|jardim|quarto|banheiro|quintal|elevador|escada|vizinho',
    medio: 'saudade|nostalgia|rotina|compromisso|reunião|entrevista|aluguel|mudança|reforma|limpeza|compras|orçamento|receita|remédio|consulta|casamento|aniversário|formatura|passeio|piquenique|churrasco|telefonema|conversa|notícia|surpresa|coragem|ciúme|paciência|recordação|silêncio',
    dificil: 'paradoxo|diplomacia|arqueologia|empatia|resiliência|ansiedade|liberdade|justiça|ética|cidadania|democracia|igualdade|diversidade|solidariedade|responsabilidade|criatividade|intuição|consciência|identidade|propósito|esperança|frustração|coincidência|consequência|prioridade|reputação|privacidade|confiança|convivência|vulnerabilidade',
  },
}

const entriesWithLegacyIds = Object.entries(groups).flatMap(([category, difficultyGroups]) =>
  Object.entries(difficultyGroups).flatMap(([difficulty, words]) =>
    words.split('|').map((text, index) => ({
      entry: {
        id: createWordId(category as Category, difficulty as Difficulty, text),
        text: text.toLocaleUpperCase('pt-BR'),
        category: category as Category,
        difficulty: difficulty as Difficulty,
      } satisfies WordEntry,
      legacyId: `${category}-${difficulty}-${index + 1}`,
    })),
  ),
)

export const coreWordBank: WordEntry[] = entriesWithLegacyIds.map(({ entry }) => entry)
export const legacyWordIdMap = new Map(entriesWithLegacyIds.map(({ legacyId, entry }) => [legacyId, entry.id]))
