export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  elascticSearch: {
    ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || '',
    ELASTICSEARCH_USERNAME: process.env.ELASTICSEARCH_USERNAME || '',
    ELASTICSEARCH_PASSWORD: process.env.ELASTICSEARCH_PASSWORD || '',
  },
  db: {
    POSTGRES_USER: process.env.POSTGRES_USER || '',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
    POSTGRES_DB: process.env.POSTGRES_DB || '',
    POSTGRES_PORT: process.env.POSTGRES_PORT || '',
    POSTGRES_HOST: process.env.POSTGRES_HOST || '',
  },
});
