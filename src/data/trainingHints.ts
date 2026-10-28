import { createWordId } from './wordId'
import type { Category, Difficulty, TrainingWord } from '../types'

type HintSeed = readonly [word: string, ...hints: string[]]

function group(category: Category, difficulty: Difficulty, seeds: readonly HintSeed[]): TrainingWord[] {
  return seeds.map(([text, ...hints]) => ({
    word: {
      id: createWordId(category, difficulty, text),
      text: text.toLocaleUpperCase('pt-BR'),
      category,
      difficulty,
    },
    hints,
  }))
}

export const trainingWords: TrainingWord[] = [
  ...group('animais', 'facil', [
    ['cachorro', 'Animal', 'Latido', 'Coleira', 'Canil'],
    ['gato', 'Felino', 'Miado', 'Bigodes', 'Telhado'],
    ['leão', 'Savana', 'Felino', 'Juba', 'Rugido'],
    ['tigre', 'Selva', 'Felino', 'Listras', 'Rugido'],
    ['elefante', 'Savana', 'Cinza', 'Tromba', 'Marfim'],
  ]),
  ...group('animais', 'medio', [
    ['rinoceronte', 'Savana', 'Pesado', 'Chifre', 'Couraça'],
    ['hipopótamo', 'África', 'Rio', 'Pesado', 'Mandíbula'],
    ['canguru', 'Austrália', 'Salto', 'Bolsa', 'Marsupial'],
    ['camelo', 'Deserto', 'Caravana', 'Corcova', 'Sede'],
    ['gorila', 'Floresta', 'Primata', 'Peito', 'Banana'],
  ]),
  ...group('animais', 'dificil', [
    ['ornitorrinco', 'Austrália', 'Aquático', 'Bico', 'Ovíparo'],
    ['axolote', 'México', 'Aquático', 'Brânquias', 'Regeneração'],
    ['narval', 'Ártico', 'Marinho', 'Presa', 'Unicórnio'],
    ['pangolim', 'Ásia', 'Escamas', 'Formigas', 'Enrolado'],
    ['suricato', 'África', 'Deserto', 'Vigia', 'Colônia'],
  ]),

  ...group('objetos', 'facil', [
    ['mesa', 'Móvel', 'Apoio', 'Pernas', 'Refeição'],
    ['cadeira', 'Móvel', 'Assento', 'Encosto', 'Sentar'],
    ['cama', 'Quarto', 'Colchão', 'Sono', 'Dormir'],
    ['sofá', 'Sala', 'Estofado', 'Assento', 'Conforto'],
    ['porta', 'Casa', 'Entrada', 'Maçaneta', 'Abrir'],
  ]),
  ...group('objetos', 'medio', [
    ['microfone', 'Áudio', 'Palco', 'Voz', 'Cantar'],
    ['termômetro', 'Medição', 'Febre', 'Graus', 'Temperatura'],
    ['bússola', 'Navegação', 'Agulha', 'Norte', 'Direção'],
    ['binóculo', 'Lentes', 'Distância', 'Olhos', 'Ampliar'],
    ['lanterna', 'Portátil', 'Pilha', 'Escuro', 'Iluminar'],
  ]),
  ...group('objetos', 'dificil', [
    ['caleidoscópio', 'Tubo', 'Espelhos', 'Cores', 'Padrões'],
    ['sextante', 'Navegação', 'Ângulo', 'Horizonte', 'Marinheiro'],
    ['ampulheta', 'Vidro', 'Areia', 'Tempo', 'Virar'],
    ['estilete', 'Ferramenta', 'Lâmina', 'Corte', 'Retrátil'],
    ['cinzel', 'Ferramenta', 'Escultura', 'Pedra', 'Martelo'],
  ]),

  ...group('alimentos', 'facil', [
    ['arroz', 'Grão', 'Branco', 'Panela', 'Feijão'],
    ['feijão', 'Grão', 'Panela', 'Caldo', 'Arroz'],
    ['pão', 'Farinha', 'Forno', 'Padaria', 'Trigo'],
    ['bolo', 'Doce', 'Forno', 'Fatia', 'Aniversário'],
    ['queijo', 'Laticínio', 'Leite', 'Fatia', 'Rato'],
  ]),
  ...group('alimentos', 'medio', [
    ['lasanha', 'Massa', 'Camadas', 'Molho', 'Forno'],
    ['risoto', 'Arroz', 'Cremoso', 'Caldo', 'Italiano'],
    ['panqueca', 'Massa', 'Frigideira', 'Disco', 'Recheio'],
    ['omelete', 'Ovos', 'Frigideira', 'Dobrado', 'Recheio'],
    ['salada', 'Folhas', 'Crua', 'Tempero', 'Leve'],
  ]),
  ...group('alimentos', 'dificil', [
    ['ratatouille', 'Francês', 'Legumes', 'Ensopado', 'Berinjela'],
    ['carpaccio', 'Italiano', 'Cru', 'Fino', 'Fatias'],
    ['quiche', 'Francês', 'Torta', 'Ovos', 'Recheio'],
    ['suflê', 'Forno', 'Leve', 'Crescer', 'Aerado'],
    ['nhoque', 'Italiano', 'Massa', 'Batata', 'Molho'],
  ]),

  ...group('profissoes', 'facil', [
    ['professor', 'Escola', 'Aula', 'Alunos', 'Ensinar'],
    ['médico', 'Saúde', 'Consulta', 'Hospital', 'Diagnóstico'],
    ['enfermeiro', 'Saúde', 'Cuidado', 'Hospital', 'Plantão'],
    ['dentista', 'Saúde', 'Consultório', 'Dentes', 'Cárie'],
    ['advogado', 'Justiça', 'Cliente', 'Processo', 'Tribunal'],
  ]),
  ...group('profissoes', 'medio', [
    ['arquiteto', 'Projeto', 'Planta', 'Edifício', 'Construção'],
    ['nutricionista', 'Saúde', 'Alimento', 'Dieta', 'Cardápio'],
    ['fisioterapeuta', 'Saúde', 'Movimento', 'Reabilitação', 'Exercício'],
    ['psicólogo', 'Saúde', 'Mente', 'Escuta', 'Terapia'],
    ['farmacêutico', 'Saúde', 'Remédio', 'Receita', 'Farmácia'],
  ]),
  ...group('profissoes', 'dificil', [
    ['arqueólogo', 'Pesquisa', 'Escavação', 'Ruínas', 'Antiguidade'],
    ['paleontólogo', 'Pesquisa', 'Fóssil', 'Dinossauro', 'Escavação'],
    ['oceanógrafo', 'Pesquisa', 'Mar', 'Correntes', 'Oceano'],
    ['cartógrafo', 'Geografia', 'Mapa', 'Escala', 'Território'],
    ['meteorologista', 'Ciência', 'Clima', 'Previsão', 'Atmosfera'],
  ]),

  ...group('lugares', 'facil', [
    ['escola', 'Ensino', 'Alunos', 'Aula', 'Recreio'],
    ['hospital', 'Saúde', 'Médicos', 'Leitos', 'Emergência'],
    ['igreja', 'Religião', 'Altar', 'Missa', 'Oração'],
    ['praia', 'Litoral', 'Areia', 'Mar', 'Banho'],
    ['parque', 'Lazer', 'Árvores', 'Passeio', 'Brinquedos'],
  ]),
  ...group('lugares', 'medio', [
    ['laboratório', 'Pesquisa', 'Experimento', 'Bancada', 'Ciência'],
    ['observatório', 'Cúpula', 'Astronomia', 'Telescópio', 'Estrelas'],
    ['planetário', 'Astronomia', 'Projeção', 'Cúpula', 'Universo'],
    ['aquário', 'Água', 'Tanque', 'Peixes', 'Visitação'],
    ['catedral', 'Religião', 'Templo', 'Vitral', 'Bispo'],
  ]),
  ...group('lugares', 'dificil', [
    ['arquipélago', 'Geografia', 'Mar', 'Ilhas', 'Conjunto'],
    ['península', 'Geografia', 'Terra', 'Água', 'Quase'],
    ['istmo', 'Geografia', 'Faixa', 'Terra', 'Ligação'],
    ['fiorde', 'Geografia', 'Vale', 'Mar', 'Noruega'],
    ['cânion', 'Geografia', 'Profundo', 'Paredões', 'Rio'],
  ]),

  ...group('natureza', 'facil', [
    ['sol', 'Céu', 'Calor', 'Luz', 'Dia'],
    ['lua', 'Céu', 'Noite', 'Fases', 'Satélite'],
    ['estrela', 'Céu', 'Noite', 'Brilho', 'Constelação'],
    ['nuvem', 'Céu', 'Branca', 'Vapor', 'Chuva'],
    ['chuva', 'Clima', 'Nuvem', 'Gotas', 'Molhado'],
  ]),
  ...group('natureza', 'medio', [
    ['tempestade', 'Clima', 'Nuvens', 'Vento', 'Trovão'],
    ['furacão', 'Clima', 'Oceano', 'Ventos', 'Olho'],
    ['tornado', 'Clima', 'Funil', 'Vento', 'Rotação'],
    ['neblina', 'Clima', 'Branca', 'Visibilidade', 'Névoa'],
    ['orvalho', 'Manhã', 'Frio', 'Gotas', 'Folhas'],
  ]),
  ...group('natureza', 'dificil', [
    ['metamorfose', 'Mudança', 'Fases', 'Lagarta', 'Borboleta'],
    ['fotossíntese', 'Planta', 'Luz', 'Clorofila', 'Oxigênio'],
    ['biodiversidade', 'Natureza', 'Espécies', 'Variedade', 'Vida'],
    ['ecossistema', 'Natureza', 'Ambiente', 'Organismos', 'Interação'],
    ['atmosfera', 'Planeta', 'Gases', 'Camadas', 'Ar'],
  ]),

  ...group('esportes', 'facil', [
    ['futebol', 'Esporte', 'Campo', 'Bola', 'Gol'],
    ['basquete', 'Esporte', 'Quadra', 'Bola', 'Cesta'],
    ['vôlei', 'Esporte', 'Quadra', 'Rede', 'Saque'],
    ['tênis', 'Esporte', 'Quadra', 'Raquete', 'Saque'],
    ['natação', 'Esporte', 'Piscina', 'Braçadas', 'Nadar'],
  ]),
  ...group('esportes', 'medio', [
    ['maratona', 'Corrida', 'Resistência', 'Quilômetros', 'Quarenta'],
    ['triatlo', 'Prova', 'Natação', 'Ciclismo', 'Corrida'],
    ['pentatlo', 'Prova', 'Cinco', 'Modalidades', 'Olímpico'],
    ['atletismo', 'Esporte', 'Pista', 'Corrida', 'Saltos'],
    ['badminton', 'Esporte', 'Rede', 'Raquete', 'Peteca'],
  ]),
  ...group('esportes', 'dificil', [
    ['decatlo', 'Prova', 'Atletismo', 'Dez', 'Modalidades'],
    ['heptatlo', 'Prova', 'Atletismo', 'Sete', 'Modalidades'],
    ['curling', 'Gelo', 'Pedra', 'Vassoura', 'Alvo'],
    ['biatlo', 'Neve', 'Esqui', 'Tiro', 'Resistência'],
    ['bobsled', 'Gelo', 'Trenó', 'Equipe', 'Velocidade'],
  ]),

  ...group('tecnologia', 'facil', [
    ['computador', 'Tecnologia', 'Máquina', 'Teclado', 'Monitor'],
    ['internet', 'Tecnologia', 'Rede', 'Sites', 'Conexão'],
    ['celular', 'Tecnologia', 'Bolso', 'Tela', 'Ligação'],
    ['aplicativo', 'Tecnologia', 'Ícone', 'Instalar', 'Programa'],
    ['câmera', 'Tecnologia', 'Lente', 'Imagem', 'Foto'],
  ]),
  ...group('tecnologia', 'medio', [
    ['algoritmo', 'Lógica', 'Passos', 'Código', 'Solução'],
    ['software', 'Digital', 'Programa', 'Sistema', 'Aplicativo'],
    ['hardware', 'Máquina', 'Peças', 'Físico', 'Componentes'],
    ['servidor', 'Rede', 'Dados', 'Hospedagem', 'Requisições'],
    ['navegador', 'Internet', 'Abas', 'Sites', 'Chrome'],
  ]),
  ...group('tecnologia', 'dificil', [
    ['criptografia', 'Segurança', 'Dados', 'Chave', 'Cifrar'],
    ['inteligência-artificial', 'Tecnologia', 'Modelo', 'Dados', 'Aprendizado'],
    ['blockchain', 'Tecnologia', 'Blocos', 'Distribuído', 'Criptomoeda'],
    ['metaverso', 'Digital', 'Virtual', 'Avatar', 'Imersão'],
    ['holograma', 'Imagem', 'Luz', 'Tridimensional', 'Projeção'],
  ]),

  ...group('cotidiano', 'facil', [
    ['família', 'Casa', 'Parentes', 'União', 'Lar'],
    ['amigo', 'Pessoa', 'Companhia', 'Confiança', 'Amizade'],
    ['festa', 'Evento', 'Música', 'Convidados', 'Celebração'],
    ['trabalho', 'Rotina', 'Profissão', 'Salário', 'Emprego'],
    ['dinheiro', 'Compra', 'Valor', 'Carteira', 'Moeda'],
  ]),
  ...group('cotidiano', 'medio', [
    ['saudade', 'Sentimento', 'Distância', 'Ausência', 'Lembrança'],
    ['nostalgia', 'Sentimento', 'Passado', 'Memória', 'Saudade'],
    ['rotina', 'Cotidiano', 'Repetição', 'Hábitos', 'Agenda'],
    ['compromisso', 'Agenda', 'Responsabilidade', 'Horário', 'Encontro'],
    ['reunião', 'Trabalho', 'Pessoas', 'Pauta', 'Encontro'],
  ]),
  ...group('cotidiano', 'dificil', [
    ['paradoxo', 'Ideia', 'Contradição', 'Lógica', 'Aparente'],
    ['diplomacia', 'Relações', 'Países', 'Negociação', 'Acordo'],
    ['arqueologia', 'Ciência', 'Passado', 'Escavação', 'Vestígios'],
    ['empatia', 'Sentimento', 'Outro', 'Compreensão', 'Perspectiva'],
    ['resiliência', 'Capacidade', 'Adversidade', 'Recuperação', 'Superação'],
  ]),

  ...group('cultura_geral', 'facil', [
    ['canção', 'Música', 'Voz', 'Letra', 'Melodia'],
    ['álbum', 'Música', 'Coleção', 'Faixas', 'Capa'],
    ['banda', 'Música', 'Grupo', 'Instrumentos', 'Palco'],
    ['orquestra', 'Música', 'Conjunto', 'Maestro', 'Instrumentos'],
    ['violão', 'Música', 'Cordas', 'Madeira', 'Dedilhar'],
  ]),
  ...group('cultura_geral', 'medio', [
    ['ópera', 'Arte', 'Palco', 'Canto', 'Teatro'],
    ['sinfonia', 'Música', 'Orquestra', 'Movimentos', 'Composição'],
    ['concerto', 'Música', 'Palco', 'Plateia', 'Instrumentos'],
    ['melodia', 'Música', 'Notas', 'Sequência', 'Cantar'],
    ['ritmo', 'Música', 'Pulso', 'Batida', 'Tempo'],
  ]),
  ...group('cultura_geral', 'dificil', [
    ['epistemologia', 'Filosofia', 'Conhecimento', 'Verdade', 'Ciência'],
    ['antropologia', 'Ciência', 'Humanidade', 'Cultura', 'Sociedade'],
    ['sociologia', 'Ciência', 'Sociedade', 'Grupos', 'Relações'],
    ['psicologia', 'Ciência', 'Mente', 'Comportamento', 'Emoções'],
    ['linguística', 'Ciência', 'Idioma', 'Fala', 'Linguagem'],
  ]),
]

export const TRAINING_WORD_COUNT = trainingWords.length
