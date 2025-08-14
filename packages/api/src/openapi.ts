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
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  tags: [
    { name: 'auth', description: 'Authentication & session endpoints' },
    { name: 'groups', description: 'Group lifecycle & invites' },
  ],
  paths: {
    '/auth/register': {
      post: {
        operationId: 'authRegister',
        summary: 'Register a new user',
        description: 'Creates a new user account and returns initial access + refresh tokens.',
        tags: ['auth'],
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
        operationId: 'authLogin',
        summary: 'Login existing user',
        description: 'Authenticates a user with email/password returning rotated tokens.',
        tags: ['auth'],
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
        operationId: 'authRefresh',
        summary: 'Refresh access/refresh token pair',
        description: 'Rotates refresh token and issues new short-lived access token.',
        tags: ['auth'],
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
        operationId: 'createGroup',
        summary: 'Create a group',
        description: 'Creates a new group owned by the authenticated user.',
        tags: ['groups'],
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
        operationId: 'issueGroupInvite',
        summary: 'Issue group invite',
        description: 'Issues an invite token for another user to join the specified group.',
        tags: ['groups'],
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
