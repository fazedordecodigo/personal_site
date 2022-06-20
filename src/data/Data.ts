import {Configuration} from '../types/Configuration';

const data: Configuration = {
    settings: {
        locale: "pt-BR",
        cycleInSeconds: 3600,
        browserColor: "#FFD602",
        lightColor: "#1AF1F2",
    },
    profile: {
        title: "delatorre.dev",
        name: "Emerson Delatorre",
        description: "Software Developer",
        url: "https://delatorre.dev/",
        sections: [
            {
                name: "fas fa-phone-volume",
                description: "Contatos",
                content: [
                    {
                        name: "Email",
                        url: "mailto:emerson@delatorre.dev",
                        icon: "far fa-envelope",
                    },
                    {
                        name: "Whatsapp",
                        url: "https://wa.me/5521980231818",
                        icon: "fab fa-whatsapp",
                    },
                    {
                        name: "Telegram",
                        url: "https://t.me/delatorrea",
                        icon: "fab fa-telegram",
                    },
                    {
                        name: "Discord",
                        url: "https://discord.gg/pVBcXxKx",
                        icon: "fab fa-discord",
                    },
                ],
            },
            {
                name: "fas fa-globe-americas",
                description: "Redes Sociais",
                content: [
                    {
                        name: "GitHub",
                        url: "https://github.com/delatorrea",
                        icon: "fab fa-github",
                    },
                    {
                        name: "StackOverflow",
                        url: "https://stackoverflow.com/story/delatorrea",
                        icon: "fab fa-stack-overflow",
                    },
                    {
                        name: "LinkedIn",
                        url: "https://www.linkedin.com/in/delatorrea",
                        icon: "fab fa-linkedin",
                    },
                    {
                        name: "Twitch",
                        url: "https://www.twitch.tv/emersondelatorre",
                        icon: "fab fa-twitch",
                    },
                    {
                        name: "YouTube",
                        url: "https://www.youtube.com/c/EmersonDelatorre",
                        icon: "fab fa-youtube-square",
                    },
                    {
                        name: "Instagram",
                        url: "https://www.instagram.com/delatorre.dev",
                        icon: "fab fa-instagram",
                    },
                    {
                        name: "Twitter",
                        url: "https://twitter.com/delatorre_",
                        icon: "fab fa-twitter",
                    },
                    {
                        name: "about.me",
                        url: "https://about.me/delatorrea",
                        icon: "far fa-address-card",
                    },
                ],
            },
            {
                name: "fas fa-cogs",
                description: "Meus Projetos",
                content: [
                    {
                        name: "PyFlunt",
                        url: "https://github.com/Delatorrea/pyflunt",
                        icon: "fas fa-box-open",
                    },
                    {
                        name: "Simulador Banco Imobiliário",
                        url: "https://github.com/Delatorrea/banco_imobiliario_simulador",
                        icon: "fas fa-dice",
                    },
                ],
            },
            {
                name: "fas fa-id-card",
                description: "Quem Sou Eu?",
                content: `
                    <p>
                        🏁 Trabalho como <b>Senior Software Engineer</b> na Avanade 😎  desenvolvo microsserviços custom SAP com NestJS.
                    </p>
                `,
            },
        ],
    },
};

export default data;
