
Node.js/JavaScript/TypeScript

Todo o código-fonte deve ser escrito em TypeScript

Utilize yarn como ferramenta padrão para gerenciar dependências e executar scripts

Se necessário, faça a instalação dos types das bibliotecas, por exemplo: jest e @types/jest

Antes de terminar uma tarefa, sempre valide de a tipagem está correta

Utilize const ao invés de let onde for possível

Nunca utilize var para declarar uma variável

Sempre declare as propriedades da classe como private ou readonly, evitando o uso de public

Prefira o uso de find, filter, map e reduce ao invés de for e while

Sempre utilize async/await para lidar com promises, evite o uso de callbacks

Nunca utilize any, sempre utilize types existentes ou crie types para tudo que for implementado

Nunca utilize require para importar módulos, sempre utilize import

Nunca utilize module.exports para exportar módulos, sempre export

Se o arquivo tiver apenas uma coisa sendo exportada, utilize default, senão named exports

Evite dependência circular