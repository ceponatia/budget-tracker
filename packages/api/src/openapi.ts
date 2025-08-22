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
    { name: 'accounts', description: 'Account ingestion & listing (stub)' },
    { name: 'transactions', description: 'Transaction sync (stub)' },
    { name: 'budget', description: 'Budget categories, periods, and allocations' },
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
    '/accounts/sync': {
      post: {
        operationId: 'accountsSync',
        summary: 'Sync accounts from provider',
        description: 'Ingests accounts from linked provider access token and stores/returns list.',
        tags: ['accounts'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['accessToken'],
                properties: { accessToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Accounts synced',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['accounts'],
                  properties: {
                    accounts: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/transactions/sync': {
      post: {
        operationId: 'transactionsSync',
        summary: 'Full transaction sync',
        description: 'Performs a full (paged) provider sync of transactions (mock access token).',
        tags: ['transactions'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Sync result counts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['added', 'modified', 'removed'],
                  properties: {
                    added: { type: 'integer' },
                    modified: { type: 'integer' },
                    removed: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/transactions': {
      get: {
        operationId: 'listTransactions',
        summary: 'List transactions',
        description: 'Lists transactions for an account with basic pagination and filters.',
        tags: ['transactions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'accountId', in: 'query', required: true, schema: { type: 'string' } },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
          { name: 'cursor', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'minAmount', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'maxAmount', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Transaction page',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items'],
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                    nextCursor: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid parameters' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/transactions/{id}/category': {
      patch: {
        operationId: 'setTransactionCategory',
        summary: 'Set manual category',
        description:
          'Sets or overrides the primary category for a transaction (simple single category string).',
        tags: ['transactions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'accountId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Owning account id (temporary until lookup logic implemented).',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['category'],
                properties: { category: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated transaction',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['transaction'],
                  properties: { transaction: { $ref: '#/components/schemas/Transaction' } },
                },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/budget/categories': {
      post: {
        operationId: 'createBudgetCategory',
        summary: 'Create budget category',
        tags: ['budget'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateCategoryRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategoryResponse' },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/budget/periods': {
      post: {
        operationId: 'createBudgetPeriod',
        summary: 'Create budget period',
        tags: ['budget'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreatePeriodRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreatePeriodResponse' } },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/budget/allocations': {
      post: {
        operationId: 'createBudgetAllocation',
        summary: 'Create budget allocation',
        tags: ['budget'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAllocationRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateAllocationResponse' },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/budget/periods/{id}/summary': {
      get: {
        operationId: 'getBudgetPeriodSummary',
        summary: 'Get budget period summary',
        tags: ['budget'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'groupId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BudgetPeriodSummaryResponse' },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
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
      Account: {
        type: 'object',
        required: ['id', 'groupId', 'providerType', 'name'],
        properties: {
          id: { type: 'string' },
          groupId: { type: 'string' },
          providerType: { type: 'string' },
          name: { type: 'string' },
          institutionName: { type: 'string', nullable: true },
          type: { type: 'string', nullable: true },
          subtype: { type: 'string', nullable: true },
          currentBalance: { type: 'number', nullable: true },
          currency: { type: 'string', nullable: true },
          lastSyncedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Transaction: {
        type: 'object',
        required: ['id', 'accountId', 'postedAt', 'description', 'amount', 'currency', 'pending'],
        properties: {
          id: { type: 'string' },
          accountId: { type: 'string' },
          postedAt: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'integer' },
          currency: { type: 'string' },
          pending: { type: 'boolean' },
          category: { type: 'array', items: { type: 'string' }, nullable: true },
          modifiedAt: { type: 'string', format: 'date-time', nullable: true },
          removed: { type: 'boolean', nullable: true },
        },
      },
      CreateCategoryRequest: {
        type: 'object',
        required: ['groupId', 'name'],
        properties: { groupId: { type: 'string' }, name: { type: 'string', minLength: 1 } },
      },
      Category: {
        type: 'object',
        required: ['id', 'groupId', 'name', 'createdAt'],
        properties: {
          id: { type: 'string' },
          groupId: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          archivedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      CreateCategoryResponse: {
        type: 'object',
        required: ['category'],
        properties: { category: { $ref: '#/components/schemas/Category' } },
      },
      CreatePeriodRequest: {
        type: 'object',
        required: ['groupId', 'startDate'],
        properties: {
          groupId: { type: 'string' },
          startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        },
      },
      BudgetPeriod: {
        type: 'object',
        required: ['id', 'groupId', 'startDate', 'type', 'createdAt'],
        properties: {
          id: { type: 'string' },
          groupId: { type: 'string' },
          startDate: { type: 'string' },
          type: { type: 'string', enum: ['MONTH'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreatePeriodResponse: {
        type: 'object',
        required: ['period'],
        properties: { period: { $ref: '#/components/schemas/BudgetPeriod' } },
      },
      CreateAllocationRequest: {
        type: 'object',
        required: ['periodId', 'categoryId', 'amount', 'currency'],
        properties: {
          periodId: { type: 'string' },
          categoryId: { type: 'string' },
          amount: { type: 'integer', minimum: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
        },
      },
      Allocation: {
        type: 'object',
        required: ['id', 'periodId', 'categoryId', 'amount', 'currency', 'createdAt'],
        properties: {
          id: { type: 'string' },
          periodId: { type: 'string' },
          categoryId: { type: 'string' },
          amount: { type: 'integer' },
          currency: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          modifiedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      CreateAllocationResponse: {
        type: 'object',
        required: ['allocation'],
        properties: { allocation: { $ref: '#/components/schemas/Allocation' } },
      },
      BudgetPeriodSummaryResponse: {
        type: 'object',
        required: ['summary'],
        properties: {
          summary: {
            type: 'object',
            required: ['periodId', 'groupId', 'startDate', 'type', 'categories', 'totals'],
            properties: {
              periodId: { type: 'string' },
              groupId: { type: 'string' },
              startDate: { type: 'string' },
              type: { type: 'string', enum: ['MONTH'] },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  required: [
                    'categoryId',
                    'name',
                    'allocationMinorUnits',
                    'spentMinorUnits',
                    'remainingMinorUnits',
                    'currency',
                  ],
                  properties: {
                    categoryId: { type: 'string' },
                    name: { type: 'string' },
                    allocationMinorUnits: { type: 'integer' },
                    spentMinorUnits: { type: 'integer' },
                    remainingMinorUnits: { type: 'integer' },
                    currency: { type: 'string' },
                  },
                },
              },
              totals: {
                type: 'object',
                required: ['allocated', 'spent', 'remaining', 'currency'],
                properties: {
                  allocated: { type: 'integer' },
                  spent: { type: 'integer' },
                  remaining: { type: 'integer' },
                  currency: { type: 'string' },
                },
              },
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
