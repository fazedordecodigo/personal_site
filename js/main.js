(function () {
  "use strict";

  let isMobile = {
    Android: function () {
      return RegExp(/Android/i).exec(navigator.userAgent);
    },
    BlackBerry: function () {
      return RegExp(/BlackBerry/i).exec(navigator.userAgent);
    },
    iOS: function () {
      return RegExp(/iPhone|iPad|iPod/i).exec(navigator.userAgent);
    },
    Opera: function () {
      return RegExp(/Opera Mini/i).exec(navigator.userAgent);
    },
    Windows: function () {
      return RegExp(/IEMobile/i).exec(navigator.userAgent);
    },
    any: function () {
      return (
        isMobile.Android() ||
        isMobile.BlackBerry() ||
        isMobile.iOS() ||
        isMobile.Opera() ||
        isMobile.Windows()
      );
    },
  };

  let fullHeight = function () {
    if (!isMobile.any()) {
      $(".js-fullheight").css("height", $(window).height());
      $(window).resize(function () {
        $(".js-fullheight").css("height", $(window).height());
      });
    }
  };

  // Parallax
  let parallax = function () {
    $(window).stellar();
  };

  let contentWayPoint = function () {
    let i = 0;
    $(".animate-box").waypoint(
      function (direction) {
        if (
          direction === "down" &&
          !$(this.element).hasClass("animated-fast")
        ) {
          i++;

          $(this.element).addClass("item-animate");
          setTimeout(function () {
            $("body .animate-box.item-animate").each(function (k) {
              let el = $(this);
              setTimeout(
                function () {
                  let effect = el.data("animate-effect");
                  if (effect === "fadeIn") {
                    el.addClass("fadeIn animated-fast");
                  } else if (effect === "fadeInLeft") {
                    el.addClass("fadeInLeft animated-fast");
                  } else if (effect === "fadeInRight") {
                    el.addClass("fadeInRight animated-fast");
                  } else {
                    el.addClass("fadeInUp animated-fast");
                  }

                  el.removeClass("item-animate");
                },
                k * 100,
                "easeInOutExpo"
              );
            });
          }, 50);
        }
      },
      { offset: "85%" }
    );
  };

  let goToTop = function () {
    $(".js-gotop").on("click", function (event) {
      event.preventDefault();

      $("html, body").animate(
        {
          scrollTop: $("html").offset().top,
        },
        500,
        "easeInOutExpo"
      );

      return false;
    });

    $(window).scroll(function () {
      let $win = $(window);
      if ($win.scrollTop() > 200) {
        $(".js-top").addClass("active");
      } else {
        $(".js-top").removeClass("active");
      }
    });
  };

  let pieChart = function () {
    $(".chart").easyPieChart({
      scaleColor: false,
      lineWidth: 4,
      lineCap: "butt",
      barColor: "#FF9000",
      trackColor: "#f5f5f5",
      size: 160,
      animate: 1000,
    });
  };

  let skillsWayPoint = function () {
    if ($("#fh5co-skills").length > 0) {
      $("#fh5co-skills").waypoint(
        function (direction) {
          if (direction === "down" && !$(this.element).hasClass("animated")) {
            setTimeout(pieChart, 400);
            $(this.element).addClass("animated");
          }
        },
        { offset: "90%" }
      );
    }
  };

  // Loading page
  let loaderPage = function () {
    $(".fh5co-loader").fadeOut("slow");
  };

  // Blog Carousel
  let blogCarousel = function () {
    let currentSlide = 0;
    let totalSlides = 0;
    let slider = $("#blog-slider");
    let prevBtn = $("#blog-prev");
    let nextBtn = $("#blog-next");

    // Função para buscar artigos do RSS feed
    function loadBlogPosts() {
      // Tentar buscar artigos reais do RSS primeiro
      if (window.BlogFeed) {
        BlogFeed.fetchRealArticles(function (articles) {
          if (articles && articles.length > 0) {
            renderBlogPosts(articles);
          } else {
            // Fallback para artigos de exemplo
            renderBlogPosts(BlogFeed.getFallbackArticles());
          }
        });
      } else {
        // Fallback caso blog-feed.js não carregue
        let fallbackPosts = [
          {
            title: "Como Criar Mocks do DbContext no Entity Framework Core 8 para Testes Unitários",
            excerpt:
              "Este artigo aborda como criar mocks do DbContext do Entity Framework Core 8 para realizar testes unitários de forma eficaz e sem a necessidade de um banco de dados real.",
            date: "2024-12-21",
            link: "https://www.fazedordecodigo.com/blog/dotnet/como-criar-mocks-dbcontext-ef8-testes-unitarios",
            image: "images/blog-1.jpg",
          },
          {
            title: "Arquitetura de Microsserviços com FastAPI",
            excerpt:
              "Como construir uma arquitetura robusta de microsserviços utilizando FastAPI e Docker.",
            date: "2024-05-10",
            link: "https://www.fazedordecodigo.com",
            image: "images/blog-2.jpg",
          },
          {
            title: "Clean Code e SOLID Principles",
            excerpt:
              "Aplicando os princípios SOLID para escrever código limpo e sustentável em projetos reais.",
            date: "2024-05-05",
            link: "https://www.fazedordecodigo.com",
            image: "images/portfolio-1.jpg",
          },
        ];
        renderBlogPosts(fallbackPosts);
      }
    }

    function renderBlogPosts(posts) {
      let html = "";
      posts.forEach(function (post) {
        let formattedDate = new Date(post.date).toLocaleDateString("pt-BR");
        html += '<div class="blog-item">';
        html +=
          '<div class="blog-img" style="background-image: url(' +
          post.image +
          ');"></div>';
        html += '<div class="blog-text">';
        html += '<span class="posted_on">' + formattedDate + "</span>";
        html +=
          '<h3><a href="' +
          post.link +
          '" target="_blank">' +
          post.title +
          "</a></h3>";
        html += "<p>" + post.excerpt + "</p>";
        html += "</div>";
        html += "</div>";
      });

      slider.html(html);
      totalSlides = Math.ceil(posts.length / getItemsPerSlide());
      updateNavigation();
    }

    function getItemsPerSlide() {
      if ($(window).width() <= 768) return 1;
      if ($(window).width() <= 992) return 2;
      return 3;
    }

    function updateNavigation() {
      prevBtn.prop("disabled", currentSlide === 0);
      nextBtn.prop("disabled", currentSlide >= totalSlides - 1);
    }

    function moveSlide(direction) {
      let itemWidth = slider.find(".blog-item").outerWidth(true);
      let itemsPerSlide = getItemsPerSlide();

      if (direction === "next" && currentSlide < totalSlides - 1) {
        currentSlide++;
      } else if (direction === "prev" && currentSlide > 0) {
        currentSlide--;
      }

      let translateX = -(currentSlide * itemWidth * itemsPerSlide);
      slider.css("transform", "translateX(" + translateX + "px)");
      updateNavigation();
    }

    // Event listeners
    nextBtn.on("click", function () {
      moveSlide("next");
    });

    prevBtn.on("click", function () {
      moveSlide("prev");
    });

    // Responsive handling
    $(window).on("resize", function () {
      currentSlide = 0;
      totalSlides = Math.ceil(
        slider.find(".blog-item").length / getItemsPerSlide()
      );
      slider.css("transform", "translateX(0px)");
      updateNavigation();
    });

    // Initialize
    loadBlogPosts();
  };

  $(function () {
    contentWayPoint();
    goToTop();
    loaderPage();
    fullHeight();
    parallax();
    skillsWayPoint();
    blogCarousel();
  });
})();
