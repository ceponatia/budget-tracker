#!/usr/bin/env node
// Dump OpenAPI spec to stdout (T-017)
const { openApiSpec } = require('../packages/api/dist/openapi.js');
process.stdout.write(JSON.stringify(openApiSpec, null, 2));
