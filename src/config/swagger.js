import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MangaBuddy Scraper Pro API',
      version: '1.0.0',
      description: `
## Professional Manga Scraping Interface
This API provides high-performance access to MangaBuddy content. 
### Key Features:
* **Cloudflare Bypass**: Integrated FlareSolverr support.
* **Full Image Extraction**: Uses JS-variable parsing for 100% chapter coverage.
* **Image Proxying**: Native support for bypassing hotlink protection.
      `,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Local Development Server',
      },
    ],
    components: {
      schemas: {
        MangaBase: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Solo Leveling' },
            slug: { type: 'string', example: 'solo-leveling' },
            url: { type: 'string', example: '/solo-leveling' },
            image: { type: 'string', example: 'https://res.mbbcdn.com/thumb/solo-leveling.png' },
          }
        },
        HomeData: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                hotUpdates: {
                  type: 'array',
                  items: { 
                    allOf: [
                      { $ref: '#/components/schemas/MangaBase' },
                      { type: 'object', properties: { chapter: { type: 'string', example: 'Chapter 179' } } }
                    ]
                  }
                },
                latestUpdates: { type: 'array', items: { $ref: '#/components/schemas/MangaBase' } },
                ranking: { type: 'array', items: { $ref: '#/components/schemas/MangaBase' } }
              }
            }
          }
        },
        MangaDetails: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'One Piece' },
            synopsis: { type: 'string', example: 'As a child, Monkey D. Luffy dreamed...' },
            image: { type: 'string', example: 'https://...' },
            status: { type: 'string', example: 'Ongoing' },
            genres: { type: 'array', items: { type: 'string' }, example: ['Action', 'Adventure'] },
            chapters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Chapter 1179' },
                  slug: { type: 'string', example: 'chapter-1179' },
                  url: { type: 'string', example: '/one-piece/chapter-1179' },
                  time: { type: 'string', example: '6 days ago' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Resource not found' },
            message: { type: 'string', example: 'The requested manga slug is invalid.' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
