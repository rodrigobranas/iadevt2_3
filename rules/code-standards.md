
Padrões de Codificação

Todo o código-fonte deve ser escrito e em inglês

Utilize camelCase para a declaração de métodos, funções e variáveis, PascalCase para classes e interfaces e kebab-case para arquivos e diretórios

Evite abreviações, mas também não escreva nomes muito longos (com mais de 30 caracteres)

Declare constantes para representar magic numbers com legibilidade

Os métodos e funções devem executar uma ação clara e bem definida, e isso deve ser refletido no seu nome, que deve começar por um verbo, nunca um substantivo

Sempre que possível, evite passar mais de 3 parâmetros, dê preferência para o uso de objetos caso necessário

Evite efeitos colaterais, em geral um método ou função deve fazer uma mutação ou consulta, nunca permita que uma consulta tenha efeitos colaterais

Nunca faça o aninhamento de mais de dois if/else, sempre dê preferência por early returns

Nunca utilize flag params para chavear o comportamento de métodos e funções, nesses casos faça a extração para métodos e funções com comportamentos específicos

Evite métodos longos, com mais de 50 linhas

Evite classes longas, com mais de 300 linhas

Sempre inverta as dependências para recursos externos tanto nos use cases quanto nos interface adapters utilizando o Dependency Inversion Principle

Evite linhas em branco dentro de métodos e funções

Evite o uso de comentários sempre que possível

Nunca declare mais de uma variável na mesma linha

Declare as variáveis o mais próximo possível de onde serão utilizadas

Prefira composição do que herança sempre que possível