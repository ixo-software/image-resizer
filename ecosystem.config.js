module.exports = {
  apps : [{
    script: 'index.js',
    name: 'media-ds-resizer',
    instances: 3,
    max_memory_restart: '350M',
    env: {
	    NODE_ENV: 'production',
    }
  }],
};
