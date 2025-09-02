
SQL/Banco de Dados

Utilize pg-promise para se conectar no banco de dados

Utilize nomes de tabelas e colunas sempre em inglês e no plural e em snake_case

Para chaves primárias e estrangeiras, sempre utilize o nome da tabela no singular seguido por _id, por exemplo: users -> user_id, customers -> customer_id, orders -> order_id, payments -> payment_id

Use uppercase para as palavras-reservadas, por exemplo SELECT, FROM, JOIN, WHERE

Sempre utilize join ao invés de selecionar as tabelas e fazer a junção na cláusula where

Se possível, faça o join com using on invés de on

Nunca utilize * no select, sempre deixe claro quais são as colunas que estão sendo retornadas

Para os tipos string, sempre adote text, não utilize varchar

Para os tipos numéricos, utilize int ou numeric dependendo se tem ponto flutuante

Para datas utilize o tipo timestamptz

Quando uma coluna for utilizada como busca, crie index

Sempre que possível, resolva questões de agrupamento ou ordem na própria query com group by e order by

Se utilizar order by, sempre indique se a ordem é desc ou asc

Sempre utilize prepared statement e não interpole strings em queries

Quando fizer sentido, dê preferência para in e between ao invés de combinações com and e or

Quebre as linhas após SELECT, FROM, WHERE, GROUP BY, ORDER BY

Utilize constraints como NOT NULL sempre que fizer sentido, alinhado com o que estiver sendo feito na aplicação

Toda tabela deve ter created_at, updated_at

Sempre que fizer qualquer modificação no banco de dados, crie uma migration para aplicar e outra para desfazer caso necessário