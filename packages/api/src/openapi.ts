// Minimal OpenAPI 3.1 spec stub for existing endpoints (T-009 enhancement)
// Purpose: Provide a machine-readable contract for current auth & group routes.
// NOTE: This is a stub; schemas are simplified. Expand with full component schemas + security later.

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Budget API',
    version: '0.0.1',
    description: 'Auth and group management endpoints (stub spec)',
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 12 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RegisterResponse' } },
            },
          },
          '400': { description: 'Invalid input' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login existing user',
        requestBody: { $ref: '#/components/requestBodies/LoginRequest' },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access/refresh token pair',
        requestBody: { $ref: '#/components/requestBodies/RefreshRequest' },
        responses: {
          '200': {
            description: 'Rotated tokens',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenPair' } } },
          },
          '401': { description: 'Invalid refresh token' },
        },
      },
    },
    '/groups': {
      post: {
        summary: 'Create a group',
        security: [{ bearerAuth: [] }],
        requestBody: { $ref: '#/components/requestBodies/CreateGroupRequest' },
        responses: {
          '201': {
            description: 'Group created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateGroupResponse' } },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/groups/{id}/invite': {
      post: {
        summary: 'Issue group invite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { $ref: '#/components/requestBodies/InviteRequest' },
        responses: {
          '201': {
            description: 'Invite issued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/InviteResponse' } },
            },
          },
          '400': { description: 'Failed / invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      TokenPair: {
        type: 'object',
        required: ['accessToken', 'refreshToken'],
        properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'mfaEnabled', 'createdAt'],
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          mfaEnabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterResponse: {
        allOf: [
          { $ref: '#/components/schemas/TokenPair' },
          {
            type: 'object',
            required: ['user'],
            properties: { user: { $ref: '#/components/schemas/User' } },
          },
        ],
      },
      LoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/TokenPair' },
          {
            type: 'object',
            required: ['user'],
            properties: { user: { $ref: '#/components/schemas/User' } },
          },
        ],
      },
      CreateGroupResponse: {
        type: 'object',
        required: ['group'],
        properties: {
          group: {
            type: 'object',
            required: ['id', 'name', 'ownerUserId', 'createdAt'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              ownerUserId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      InviteResponse: {
        type: 'object',
        required: ['invite'],
        properties: {
          invite: {
            type: 'object',
            required: ['token', 'groupId', 'invitedEmail', 'createdAt', 'expiresAt'],
            properties: {
              token: { type: 'string' },
              groupId: { type: 'string' },
              invitedEmail: { type: 'string', format: 'email' },
              createdAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              acceptedAt: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    requestBodies: {
      LoginRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 12 },
              },
            },
          },
        },
      },
      RefreshRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string', minLength: 10 } },
            },
          },
        },
      },
      CreateGroupRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string', minLength: 1 } },
            },
          },
        },
      },
      InviteRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['invitedEmail'],
              properties: { invitedEmail: { type: 'string', format: 'email' } },
            },
          },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
