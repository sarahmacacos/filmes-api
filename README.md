# Movies API — Projeto Final

API REST completa para gerenciamento de filmes, construída com **Node.js**, **Express** e **SQLite**, com autenticação **JWT**, relacionamentos, filtros, paginação e validações robustas.

---

## Tecnologias

- **Node.js** + **Express** — servidor e rotas
- **SQLite** (via `sql.js`) — banco de dados embutido
- **JWT** (`jsonwebtoken`) — autenticação
- **bcryptjs** — hash de senhas
- **dotenv** — variáveis de ambiente

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/sarahmacacos/movies-api.git
cd movies-api

# 2. Instale as dependências
npm install

# 3. Configure o .env
cp .env.example .env
# edite JWT_SECRET se quiser

# 4. Inicie o servidor (banco é criado e populado automaticamente)
npm start
```

Acesse: `http://localhost:3000`

---

## Banco de Dados

O banco SQLite é criado automaticamente com **22 filmes**, **8 gêneros**, **3 usuários** e **10 avaliações** no primeiro start.

### Estrutura das Tabelas

```
users       → id, name, email, password, role, created_at
genres      → id, name, description, created_at
movies      → id, title, original_title, director, year, duration, synopsis,
               rating, genre_id (FK), language, country, poster_url,
               created_at, updated_at
reviews     → id, movie_id (FK), user_id (FK), score, comment, created_at
```

### Usuários para teste

| E-mail               | Senha      | Role  |
|----------------------|------------|-------|
| admin@movies.com     | admin123   | admin |
| sarah@movies.com     | user123    | user  |
| joao@movies.com      | user123    | user  |

---

## Autenticação JWT

Rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

O token é retornado no login/registro e expira em **7 dias**.

**Roles:**
- `user` — pode criar/editar/deletar **suas próprias** avaliações
- `admin` — acesso total (CRUD de filmes e gêneros)

---

## Endpoints

### Auth

| Método | Rota               | Auth | Descrição               |
|--------|--------------------|------|-------------------------|
| POST   | /api/auth/register | ❌   | Registrar novo usuário  |
| POST   | /api/auth/login    | ❌   | Login (retorna token)   |
| GET    | /api/auth/me       | ✅   | Dados do usuário logado |

### Filmes

| Método | Rota              | Auth  | Descrição               |
|--------|-------------------|-------|-------------------------|
| GET    | /api/movies       | ❌    | Listar filmes           |
| GET    | /api/movies/:id   | ❌    | Buscar filme por ID     |
| POST   | /api/movies       | Admin | Criar filme             |
| PUT    | /api/movies/:id   | Admin | Atualizar filme         |
| DELETE | /api/movies/:id   | Admin | Deletar filme           |

### Gêneros

| Método | Rota              | Auth  | Descrição               |
|--------|-------------------|-------|-------------------------|
| GET    | /api/genres       | ❌    | Listar gêneros          |
| GET    | /api/genres/:id   | ❌    | Buscar gênero + filmes  |
| POST   | /api/genres       | Admin | Criar gênero            |
| PUT    | /api/genres/:id   | Admin | Atualizar gênero        |
| DELETE | /api/genres/:id   | Admin | Deletar gênero          |

### Avaliações

| Método | Rota                                  | Auth    | Descrição                  |
|--------|---------------------------------------|---------|----------------------------|
| GET    | /api/movies/:movie_id/reviews         | ❌      | Listar avaliações do filme |
| POST   | /api/movies/:movie_id/reviews         | ✅ User | Criar avaliação            |
| PUT    | /api/movies/:movie_id/reviews/:id     | ✅ User | Atualizar avaliação        |
| DELETE | /api/movies/:movie_id/reviews/:id     | ✅ User | Deletar avaliação          |

---

## Filtros, Ordenação e Paginação — GET /api/movies

| Parâmetro    | Tipo    | Descrição                                  | Exemplo              |
|--------------|---------|--------------------------------------------|----------------------|
| `search`     | string  | Busca no título, diretor e sinopse         | `?search=nolan`      |
| `genre_id`   | integer | Filtrar por gênero                         | `?genre_id=4`        |
| `year`       | integer | Filtrar por ano                            | `?year=2019`         |
| `director`   | string  | Filtrar por diretor                        | `?director=tarantino`|
| `min_rating` | float   | Nota mínima                                | `?min_rating=9`      |
| `language`   | string  | Filtrar por idioma                         | `?language=japonês`  |
| `sort_by`    | string  | Campo de ordenação (title, year, rating, director, duration) | `?sort_by=rating` |
| `sort_order` | string  | `asc` ou `desc`                            | `?sort_order=desc`   |
| `page`       | integer | Página (padrão: 1)                         | `?page=2`            |
| `limit`      | integer | Itens por página, máx 50 (padrão: 10)      | `?limit=5`           |

**Exemplo combinado:**
```
GET /api/movies?search=nolan&sort_by=year&sort_order=desc&min_rating=8&page=1&limit=5
```

---

## Validações

**Filmes (POST/PUT):**
- `title`: obrigatório, máx 200 chars
- `director`: obrigatório, mín 2 chars
- `year`: obrigatório, entre 1888 e ano atual + 5
- `duration`: obrigatório, entre 1 e 600 min
- `genre_id`: obrigatório, deve existir no banco
- `rating`: opcional, entre 0 e 10

**Usuários (POST /register):**
- `name`: obrigatório, mín 2 chars
- `email`: formato válido, único no banco
- `password`: mín 6 caracteres

**Avaliações:**
- `score`: obrigatório, inteiro entre 1 e 10
- `comment`: opcional, máx 1000 chars
- Um usuário só pode avaliar um filme uma vez

---

## Status Codes

| Código | Significado                            |
|--------|----------------------------------------|
| 200    | OK — requisição bem-sucedida           |
| 201    | Created — recurso criado               |
| 204    | No Content — OPTIONS (CORS)            |
| 400    | Bad Request — dados inválidos          |
| 401    | Unauthorized — sem token ou inválido   |
| 403    | Forbidden — sem permissão              |
| 404    | Not Found — recurso não encontrado     |
| 409    | Conflict — duplicidade de dados        |
| 500    | Internal Server Error — erro do server |

---

## Deploy (Render)

1. Faça push do projeto para um repositório GitHub
2. Acesse [render.com](https://render.com) → **New Web Service**
3. Conecte o repositório
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
5. Adicione as variáveis de ambiente:
   - `JWT_SECRET` = (uma chave segura)
   - `NODE_ENV` = `production`

> **Nota:** O `sql.js` é pure JavaScript, não precisa de compilação nativa — funciona perfeitamente no Render.

---

## 🧪 Estrutura do Projeto

```
movies-api/
├── app.js                          # Entry point
├── .env                            # Variáveis de ambiente
├── .env.example
├── package.json
├── README.md
├── movies.db                       # Criado automaticamente
└── src/
    ├── controllers/
    │   ├── authController.js       # Register, Login, Me
    │   ├── moviesController.js     # CRUD de filmes
    │   └── genresReviewsController.js  # CRUD gêneros + reviews
    ├── middleware/
    │   ├── auth.js                 # JWT authenticate + requireAdmin
    │   └── validate.js             # Validações de input
    ├── routes/
    │   └── index.js                # Todas as rotas
    └── database/
        ├── db.js                   # Adapter sql.js
        └── init.js                 # initDatabase + seedDatabase
```

---

## 👩‍💻 Autora

**Sarah** — CS @ UniFil | CyberSecurity @ FIAP  
GitHub: [@sarahmacacos](https://github.com/sarahmacacos)
