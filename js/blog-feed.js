/**
 * Blog Feed Handler
 * Funcionalidade para buscar artigos do blog fazedordecodigo.com
 */

(function () {
  "use strict";

  // Função para buscar artigos reais do RSS feed
  window.BlogFeed = {
    // URL do RSS feed do seu blog
    RSS_URL: "https://www.fazedordecodigo.com/feed.xml",

    // Função para buscar artigos via RSS
    fetchRealArticles: function (callback) {
      // Usando um proxy CORS gratuito para acessar o RSS
      var proxyUrl = "https://api.allorigins.win/get?url=";
      var targetUrl = encodeURIComponent(this.RSS_URL);

      $.ajax({
        url: proxyUrl + targetUrl,
        method: "GET",
        success: function (response) {
          try {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(response.contents, "text/xml");
            var items = xmlDoc.getElementsByTagName("item");
            var articles = [];

            for (var i = 0; i < Math.min(items.length, 6); i++) {
              var item = items[i];
              var title =
                item.getElementsByTagName("title")[0]?.textContent || "";
              var description =
                item.getElementsByTagName("description")[0]?.textContent || "";
              var link =
                item.getElementsByTagName("link")[0]?.textContent || "";
              var pubDate =
                item.getElementsByTagName("pubDate")[0]?.textContent || "";

              // Extrair imagem do conteúdo se disponível
              var imageMatch = description.match(/<img[^>]+src="([^">]+)"/);
              var image = imageMatch
                ? imageMatch[1]
                : "images/blog-" + (i + 1) + ".jpg";

              // Limpar HTML da descrição
              var excerpt =
                description.replace(/<[^>]*>/g, "").substring(0, 120) + "...";

              articles.push({
                title: title,
                excerpt: excerpt,
                date: new Date(pubDate).toISOString().split("T")[0],
                link: link,
                image: image,
              });
            }

            callback(articles);
          } catch (error) {
            console.error("Erro ao processar RSS:", error);
            callback(null);
          }
        },
        error: function () {
          console.log("Erro ao buscar RSS, usando artigos de exemplo");
          callback(null);
        },
      });
    },

    // Artigos de fallback caso o RSS não funcione
    getFallbackArticles: function () {
      return [
        {
          title:
            "Como Criar Mocks do DbContext no Entity Framework Core 8 para Testes Unitários",
          excerpt:
            "Este artigo aborda como criar mocks do DbContext do Entity Framework Core 8 para realizar testes unitários de forma eficaz e sem a necessidade de um banco de dados real.",
          date: "2024-12-21",
          link: "https://www.fazedordecodigo.com/blog/dotnet/como-criar-mocks-dbcontext-ef8-testes-unitarios",
          image: "images/blog-1.jpg",
        },
        {
          title: "Configurando super ambiente de desenvolvimento com WSL2, Arch Linux e Docker",
          excerpt:
            "Como configurar um ambiente de desenvolvimento robusto no Windows usando WSL2, Arch Linux e Docker, integrando o VS Code para facilitar o trabalho com containers e ferramentas Linux.",
          date: "2024-04-09",
          link: "https://www.fazedordecodigo.com/blog/wsl2/configurando-super-ambiente-dev-wsl2-archlinux-docker",
          image: "images/blog-2.jpg",
        },
        {
          title: "Desenvolvimento em Python com WSL 2: Uma Revolução para Desenvolvedores",
          excerpt:
            "O WSL 2 permite aos desenvolvedores Python utilizar um ambiente Linux nativo no Windows, com melhor desempenho e integração com ferramentas populares.",
          date: "2024-04-08",
          link: "https://www.fazedordecodigo.com/blog/wsl2/desenvolvimento-python-wsl2-revolucao-devs",
          image: "images/portfolio-1.jpg",
        },
      ];
    },
  };
})();
