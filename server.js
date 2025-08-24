const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "production_scheduler_secret_key_2024";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const DB_DIR = process.env.DB_DIR || __dirname;
const dbPath = path.join(DB_DIR, "production_schedule.db");

if (!fs.existsSync(dbPath)) {
  console.log("Criando novo arquivo de banco de dados...");
  fs.writeFileSync(dbPath, "");
}

const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("Erro ao abrir o banco de dados:", err.message);
      process.exit(1);
    }
    console.log("Conectado ao SQLite.");
    initDb();
  }
);

function initDb() {
  db.serialize(() => {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        description TEXT,
        blends_total TEXT,
        blend_qty TEXT,
        allergens TEXT,
        cures TEXT,
        blends_actions TEXT,
        additions_comments TEXT,
        table_name TEXT,
        start_time TEXT,
        end_time TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS service_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        product_code TEXT,
        service_description TEXT,
        technician_name TEXT,
        service_notes TEXT,
        creation_time TEXT,
        start_time TEXT,
        completed BOOLEAN,
        completed_date TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        day TEXT,
        time TEXT,
        location TEXT
      )`,
    ];

    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`Erro criando tabela ${index + 1}:`, err);
        } else {
          console.log(`Tabela ${index + 1} criada/verificada com sucesso`);
        }
      });
    });

    // Criar usuário admin padrão se não existir
    createDefaultUser();
  });
}

async function createDefaultUser() {
  const defaultEmail = "admin@example.com";
  const defaultPassword = "admin123";
  
  try {
    const userExists = await queryAsync("SELECT * FROM users WHERE email = ?", [defaultEmail]);
    
    if (userExists.length === 0) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await runAsync("INSERT INTO users (email, password) VALUES (?, ?)", [defaultEmail, hashedPassword]);
      console.log("Usuário padrão criado:");
      console.log("Email:", defaultEmail);
      console.log("Senha:", defaultPassword);
    }
  } catch (error) {
    console.error("Erro ao criar usuário padrão:", error);
  }
}

// Middleware para verificar autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Token de acesso necessário" });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    next();
  });
}

// Rotas públicas
app.get("/api/test", (req, res) => {
  res.json({ status: "API funcionando", timestamp: new Date() });
});

// Rota de registro
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    
    // Verificar se o usuário já existe
    const existingUser = await queryAsync("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Usuário já existe" });
    }
    
    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário no banco de dados
    await runAsync("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword]);
    
    res.json({ success: true, message: "Usuário criado com sucesso" });
  } catch (err) {
    console.error("Erro em /api/register:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota de login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    
    // Buscar usuário no banco de dados
    const users = await queryAsync("SELECT * FROM users WHERE email = ?", [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    
    const user = users[0];
    
    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    
    // Gerar token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });
    
    res.json({ success: true, token, email: user.email });
  } catch (err) {
    console.error("Erro em /api/login:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rotas protegidas
app.get("/api/get_data", authenticateToken, async (req, res) => {
  try {
    console.log("Recebida requisição GET /api/get_data");

    const [products, serviceOrders, notifications] = await Promise.all([
      queryAsync("SELECT * FROM products"),
      queryAsync("SELECT * FROM service_orders"),
      queryAsync("SELECT * FROM notifications"),
    ]);

    console.log("Dados recuperados com sucesso:", {
      products: products.length,
      serviceOrders: serviceOrders.length,
      notifications: notifications.length,
    });

    res.json({
      all_products: products,
      service_orders: serviceOrders,
      notifications: notifications,
    });
  } catch (err) {
    console.error("Erro em /api/get_data:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/save_data", authenticateToken, async (req, res) => {
  try {
    console.log("Recebido POST /api/save_data");

    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }

    const {
      all_products = [],
      service_orders = [],
      notifications = [],
    } = req.body;

    await runTransaction(async () => {
      await runAsync("DELETE FROM products");
      await runAsync("DELETE FROM service_orders");
      await runAsync("DELETE FROM notifications");

      for (const product of all_products) {
        if (product.code && product.description) {
          await runAsync(
            `INSERT INTO products (
              code, description, blends_total, blend_qty, allergens, 
              cures, blends_actions, additions_comments, table_name, 
              start_time, end_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.code,
              product.description,
              product.blends_total,
              product.blend_qty,
              product.allergens,
              product.cures,
              product.blends_actions,
              product.additions_comments,
              product.table_name,
              product.start_time || null,
              product.end_time || null,
            ]
          );
        }
      }

      for (const order of service_orders) {
        await runAsync(
          `INSERT INTO service_orders (
            order_number, product_code, service_description, 
            technician_name, service_notes, creation_time, 
            start_time, completed, completed_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.order_number,
            order.product_code,
            order.service_description,
            order.technician_name,
            order.service_notes,
            order.creation_time,
            order.start_time || null,
            order.completed ? 1 : 0,
            order.completed_date || null,
          ]
        );
      }

      for (const notification of notifications) {
        await runAsync(
          `INSERT INTO notifications (
            title, description, day, time, location
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            notification.title,
            notification.description,
            notification.day,
            notification.time,
            notification.location,
          ]
        );
      }
    });

    console.log("Dados salvos com sucesso:", {
      products: all_products.length,
      service_orders: service_orders.length,
      notifications: notifications.length,
    });

    res.json({ success: true, message: "Data saved successfully" });
  } catch (err) {
    console.error("Erro em /api/save_data:", err);
    res.status(500).json({ error: err.message });
  }
});

// Funções auxiliares do banco de dados
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function runTransaction(callback) {
  try {
    await runAsync("BEGIN TRANSACTION");
    await callback();
    await runAsync("COMMIT");
  } catch (err) {
    await runAsync("ROLLBACK");
    throw err;
  }
}

// Servir a página de login como padrão
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Servir a aplicação principal
app.get("/app", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err.stack);
  res.status(500).json({ error: "Ocorreu um erro interno no servidor" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint não encontrado" });
});

const server = app
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  })
  .on("error", (err) => {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
  });

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => {
    console.log(`Recebido ${signal}. Encerrando servidor...`);
    server.close(() => {
      db.close((err) => {
        if (err) console.error("Erro fechando banco de dados:", err.message);
        else console.log("Conexão com banco de dados fechada.");
        process.exit(0);
      });
    });
  });
});