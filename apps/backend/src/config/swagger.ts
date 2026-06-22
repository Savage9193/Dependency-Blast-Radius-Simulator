import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dependency Blast Radius Simulator API',
      version: '1.0.0',
      description:
        'API for managing service dependencies, running failure simulations, and analyzing blast radius impact.',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://dbrs-api.onrender.com', description: 'Production' },
    ],
    tags: [
      { name: 'Health', description: 'Health dashboard' },
      { name: 'Services', description: 'Service management' },
      { name: 'Dependencies', description: 'Dependency graph management' },
      { name: 'Simulations', description: 'Failure simulations' },
      { name: 'Analytics', description: 'Analytics and trends' },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
});
