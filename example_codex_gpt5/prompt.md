Desenvolva um painel para monitorar o preço do bitcoin em tempo real

* Já existem dois projetos frontend e backend, elas devem ser utilizadas para realizar a implementação, não crie pastas ou arquivos fora delas
* A tela deve exibir: preço atual, variação 24hrs %, variação 24hrs USD, máxima 24hrs, mínima 24hrs, volume 24hrs
* Faça uma tela onde cada um desses valores fique em uma matriz 2x3, a variação deve ser verde se subiu, vermelho se desceu, as labels em fonte menor que o valor
* Mostre um texto com a data da última atualização e o intervalo de atualização
* Coloque um botão para atualizar
* Atualize a cada 10 minutos chamando a api novamente
* Implemente a tela no @frontend/src/App.jsx
* Implemente a integração no backend para não expor a chave de api no frontend
* Utilize a api https://api.api-ninjas.com/v1/bitcoin com o header X-Api-Key kIwRwVNydIUrJzArE4LajA==xX81Zit9JC2zePiQ para obter os dados que devem ser exibidos
* Faça um curl para o endpoint tanto para testar quanto para ter certeza dos dados retornados
* Utilize o endpoint /bitcoin-info GET retornando um objeto obtido pelo curl
* Crie uma cache em memória e só busque os dados na api-ninjas a cada 10 segundos
* Implemente o endpoint em @backend/src/index.ts
* Siga o mesmo padrão de codificação que já existe nos projetos
* Verifique se os serviços estão rodando corretamente, mas não suba, considere que já estão rodando

Implemente o código