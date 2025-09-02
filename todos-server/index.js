const express = require('express');
const app = express();
const port = 3000;

// Middleware para parsing JSON
app.use(express.json());

// Dados fixos de todos
const todos = [
  { id: 1, title: "Aprender JavaScript", completed: false },
  { id: 2, title: "Criar aplicação web", completed: true },
  { id: 3, title: "Estudar Node.js", completed: false },
  { id: 4, title: "Implementar API REST", completed: true },
  { id: 5, title: "Configurar banco de dados", completed: false }
];

// Endpoint para retornar todos os todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
