const { getDb, run, saveDb } = require('./db');

async function initDatabase() {
  const db = await getDb();

  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Tabela de gêneros
  db.run(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Tabela de filmes
  db.run(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      original_title TEXT,
      director TEXT NOT NULL,
      year INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      synopsis TEXT,
      rating REAL DEFAULT 0,
      genre_id INTEGER NOT NULL,
      language TEXT DEFAULT 'Inglês',
      country TEXT DEFAULT 'EUA',
      poster_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (genre_id) REFERENCES genres(id)
    )
  `);

  // Tabela de avaliações
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(movie_id, user_id)
    )
  `);

  saveDb();
  console.log('✅ Tabelas criadas com sucesso!');
}

async function seedDatabase() {
  const { all } = require('./db');
  const db = await getDb();

  const existingMovies = all(db, 'SELECT id FROM movies LIMIT 1');
  if (existingMovies.length > 0) {
    console.log('⚠️  Banco já possui dados. Seed ignorado.');
    return;
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  // Usuários
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    ['Admin', 'admin@movies.com', hashedPassword, 'admin']);
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    ['Sarah', 'sarah@movies.com', userPassword, 'user']);
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    ['João', 'joao@movies.com', userPassword, 'user']);

  // Gêneros
  const genres = [
    ['Ação', 'Filmes com sequências de luta, perseguições e explosões'],
    ['Drama', 'Filmes focados em desenvolvimento emocional e personagens'],
    ['Comédia', 'Filmes com foco em humor e situações engraçadas'],
    ['Ficção Científica', 'Filmes que exploram futuros alternativos e tecnologia'],
    ['Terror', 'Filmes projetados para assustar e criar suspense'],
    ['Animação', 'Filmes produzidos com técnicas de animação'],
    ['Thriller', 'Filmes de suspense e tensão psicológica'],
    ['Romance', 'Filmes centrados em histórias de amor'],
  ];

  for (const [name, description] of genres) {
    db.run('INSERT INTO genres (name, description) VALUES (?, ?)', [name, description]);
  }

  // Filmes (20+)
  const movies = [
    ['The Dark Knight', 'Batman: O Cavaleiro das Trevas', 'Christopher Nolan', 2008, 152, 'Batman enfrenta o Coringa, um criminoso que semeia o caos em Gotham City.', 9.5, 1, 'Inglês', 'EUA/Reino Unido'],
    ['Inception', 'A Origem', 'Christopher Nolan', 2010, 148, 'Um ladrão especializado em roubar segredos do subconsciente recebe a missão de plantar uma ideia.', 9.0, 4, 'Inglês', 'EUA/Reino Unido'],
    ['Interstellar', 'Interestelar', 'Christopher Nolan', 2014, 169, 'Um grupo de astronautas viaja por um buraco de minhoca em busca de um novo lar para a humanidade.', 8.9, 4, 'Inglês', 'EUA/Reino Unido'],
    ['Parasite', 'Parasita', 'Bong Joon-ho', 2019, 132, 'A família Kim se infiltra na vida de uma família rica de maneiras surpreendentes.', 9.2, 2, 'Coreano', 'Coreia do Sul'],
    ['Pulp Fiction', 'Pulp Fiction', 'Quentin Tarantino', 1994, 154, 'As histórias entrelaçadas de criminosos em Los Angeles.', 9.1, 7, 'Inglês', 'EUA'],
    ['The Shawshank Redemption', 'Um Sonho de Liberdade', 'Frank Darabont', 1994, 142, 'Dois homens se tornam amigos após anos na Penitenciária de Shawshank.', 9.3, 2, 'Inglês', 'EUA'],
    ['The Godfather', 'O Poderoso Chefão', 'Francis Ford Coppola', 1972, 175, 'O patriarca de uma família da máfia americana transfere o controle de seu império para seu filho relutante.', 9.4, 2, 'Inglês', 'EUA'],
    ['Schindler\'s List', 'A Lista de Schindler', 'Steven Spielberg', 1993, 195, 'Oskar Schindler salva mais de mil judeus poloneses durante o Holocausto.', 9.0, 2, 'Inglês/Alemão/Hebraico', 'EUA'],
    ['The Matrix', 'Matrix', 'Wachowski Sisters', 1999, 136, 'Um hacker descobre que a realidade que conhece é uma simulação criada por máquinas.', 8.8, 4, 'Inglês', 'EUA/Austrália'],
    ['Forrest Gump', 'Forrest Gump: O Contador de Histórias', 'Robert Zemeckis', 1994, 142, 'Um homem simples do Alabama participa involuntariamente dos principais eventos históricos dos EUA.', 8.9, 2, 'Inglês', 'EUA'],
    ['The Lion King', 'O Rei Leão', 'Roger Allers', 1994, 88, 'O jovem príncipe Simba foge depois que seu tio assassina seu pai e precisa recuperar seu reino.', 8.7, 6, 'Inglês', 'EUA'],
    ['Spirited Away', 'A Viagem de Chihiro', 'Hayao Miyazaki', 2001, 125, 'Uma menina entra num mundo espiritual mágico enquanto seus pais são transformados em porcos.', 9.1, 6, 'Japonês', 'Japão'],
    ['The Silence of the Lambs', 'O Silêncio dos Inocentes', 'Jonathan Demme', 1991, 118, 'Uma agente do FBI usa a ajuda de Hannibal Lecter para capturar um serial killer.', 8.7, 7, 'Inglês', 'EUA'],
    ['Gladiator', 'Gladiador', 'Ridley Scott', 2000, 155, 'Um general romano traído se torna gladiador para se vingar do imperador.', 8.6, 1, 'Inglês', 'EUA/Reino Unido'],
    ['Titanic', 'Titanic', 'James Cameron', 1997, 194, 'Jack e Rose se apaixonam no fatídico navio que afundou em 1912.', 8.5, 8, 'Inglês', 'EUA'],
    ['The Avengers', 'Os Vingadores', 'Joss Whedon', 2012, 143, 'Heróis se reúnem para lutar contra Loki e salvar o mundo.', 8.4, 1, 'Inglês', 'EUA'],
    ['Avatar', 'Avatar', 'James Cameron', 2009, 162, 'Um ex-fuzileiro naval viaja para Pandora e se une aos Na\'vi na luta por seu mundo.', 8.3, 4, 'Inglês', 'EUA'],
    ['The Grand Budapest Hotel', 'O Grande Hotel Budapeste', 'Wes Anderson', 2014, 99, 'As aventuras de um concierge de um famoso hotel europeu.', 8.5, 3, 'Inglês', 'Alemanha/EUA'],
    ['Get Out', 'Corra!', 'Jordan Peele', 2017, 104, 'Um homem negro descobre um segredo sombrio quando visita a família branca de sua namorada.', 8.6, 5, 'Inglês', 'EUA'],
    ['Whiplash', 'Em Busca da Perfeição', 'Damien Chazelle', 2014, 107, 'Um jovem baterista enfrenta um instrutor implacável em busca da grandeza.', 8.8, 2, 'Inglês', 'EUA'],
    ['La La Land', 'La La Land: Cantando Estações', 'Damien Chazelle', 2016, 128, 'Uma aspirante a atriz e um pianista de jazz se apaixonam enquanto perseguem seus sonhos em LA.', 8.5, 8, 'Inglês', 'EUA'],
    ['Everything Everywhere All at Once', 'Tudo em Todo Lugar ao Mesmo Tempo', 'Daniel Kwan', 2022, 139, 'Uma mulher descobre que pode acessar habilidades de versões paralelas de si mesma.', 9.0, 4, 'Inglês/Mandarim', 'EUA'],
  ];

  for (const [title, original_title, director, year, duration, synopsis, rating, genre_id, language, country] of movies) {
    db.run(
      `INSERT INTO movies (title, original_title, director, year, duration, synopsis, rating, genre_id, language, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, original_title, director, year, duration, synopsis, rating, genre_id, language, country]
    );
  }

  // Avaliações
  const reviews = [
    [1, 1, 10, 'Obra-prima absoluta! O Coringa do Heath Ledger é inesquecível.'],
    [1, 2, 9, 'Incrível do início ao fim. Nolan no seu melhor.'],
    [2, 1, 9, 'A ideia de sonhos dentro de sonhos é brilhante.'],
    [3, 2, 10, 'Me fez chorar e pensar. Cinema perfeito.'],
    [4, 3, 10, 'Que virada de roteiro! Assistam sem spoilers.'],
    [6, 1, 10, 'O melhor filme de todos os tempos.'],
    [7, 2, 9, 'Um clássico intocável. Al Pacino magistral.'],
    [10, 3, 9, 'Tão emocionante hoje quanto era nos anos 90.'],
    [12, 2, 10, 'Miyazaki é um gênio. Animação sem igual.'],
    [20, 1, 10, 'Trilha sonora + atuação + direção = perfeito.'],
  ];

  for (const [movie_id, user_id, score, comment] of reviews) {
    db.run(
      `INSERT OR IGNORE INTO reviews (movie_id, user_id, score, comment) VALUES (?, ?, ?, ?)`,
      [movie_id, user_id, score, comment]
    );
  }

  saveDb();
  console.log('✅ Seed executado: 22 filmes, 3 usuários, 8 gêneros, 10 avaliações inseridos!');
}

module.exports = { initDatabase, seedDatabase };
