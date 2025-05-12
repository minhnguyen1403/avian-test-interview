const serviceConfig = {
  type: 'object',
  properties: {    
    name: { type: 'string', minLength: 1 },
    publicKey: { type: 'string', minLength: 1 },
  },
  required: [
    'name',
    'publicKey'
  ]
};

exports.config = {
  type: 'object',
  properties: {
    baseUrl: { type: 'string' },
    debug: { type: 'boolean' },
    services: {
      type: 'array',
      items: [serviceConfig]
    }
  },
  required: [],
};