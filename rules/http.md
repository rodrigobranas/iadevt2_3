
REST/HTTP

Utilize express para mapear os endpoints

Utilize o padrão REST para consultas, mantendo o nome dos recursos em inglês e no plural, permitindo a navegabilidade em recursos alinhados, por exemplo: /playlists/:playlistId/videos ou /customers/:customerId/invoices

Recursos e verbos compostos devem usar kebab-case, por exemplo: scheduled-events ou process-payment

Evite criar endpoints com mais de 3 recursos, por exemplo: /channels/:channelId/playlists/:playlistId/videos/:videoId/comments

Para mutações não siga REST à risca, utilize uma combinação de REST para navegar nos recursos e verbos para representar ação que estão sendo executadas, sempre com POST, por exemplo: /users/:userId/change_password evitando PUT /users/:userId

O formato do payload de requisição e resposta deve ser sempre JSON, salvo que especificado algum diferente

Sempre siga as regras de segurança, validando a autenticação e autorização

Tipos de retorno:

Retorne 200 quando for bem sucedido

Retorne 404 se um recurso não for encontrado

Retorne 500 se for um erro inesperado

Retorne 422 se for um erro de negócio

Retorne 400 se a requisição não estiver bem formatada

Retorne 401 se o usuário não estiver autenticado

Retorne 403 se o usuário não estiver autorizado

Documente os endpoints, methods, status code para cada endpoint utilizando OpenAPI

Implemente paginação para as consultas mais complexas, baseado em limit e offset passados por meio da query string

Implemente partial response para consultas que retornam grandes quantidade de dados

Utilize axios para fazer chamadas para api externa