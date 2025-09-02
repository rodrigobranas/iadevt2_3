você é um desenvolvedor full stack typescript, implementando a página single de produto da nossa aplicação

<requirements>
- você deve usar os dados do @backend, criando um hook para pegar os dados do produto usando react-query
- você deve usar as imagens cadastradas no backend do produto no frontend, não use as imagens que estão no figma
- você deve usar flex box no css com tailwind e shadcn
- você deve usar o context7 para identificar como usar tailwind e shadcn
- **VOCÊ DEVE** seguir estritamente o layout do figma usando o Figma MCP para está pagina https://www.figma.com/design/2ozcLy62AQ7GJ8VG8ear4A/Untitled?node-id=0-99&t=TBC1VkJdAMOT1sUf-4
- você não deve usar cores explicitas, você deve usar design tokens para que seja respeitado o theme switcher
</requirements>

<backend_specs>
- O endpoint para pegar dados do produto é GET /api/products/:id (bonus)
- Verifique no @frontend como usar as imagens do backend no frontend
</backend_specs>

<mocks_frontend>
- para as ações relacionadas ao carrinho, você deve deixar o layout estático, sem efetuar nenhuma ação de backend, essa parte será implementada no futuro, mas o layout deve ainda ser feito e respeitado conforme o figma
</mocks_frontend>