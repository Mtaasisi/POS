#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create MCP server
const server = new Server(
  {
    name: 'supabase-database',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_database',
        description: 'Execute SQL queries on the Supabase database',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query to execute',
            },
            table: {
              type: 'string',
              description: 'Table name for simple operations',
            },
            operation: {
              type: 'string',
              enum: ['select', 'insert', 'update', 'delete'],
              description: 'Operation type for table operations',
            },
            data: {
              type: 'object',
              description: 'Data for insert/update operations',
            },
            filters: {
              type: 'object',
              description: 'Filters for select/update/delete operations',
            },
          },
        },
      },
      {
        name: 'get_table_info',
        description: 'Get information about database tables',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to get information about',
            },
          },
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'backup_table',
        description: 'Create a backup of a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to backup',
            },
            format: {
              type: 'string',
              enum: ['json', 'csv'],
              description: 'Backup format',
            },
          },
        },
      },
      {
        name: 'restore_table',
        description: 'Restore a table from backup data',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to restore',
            },
            data: {
              type: 'array',
              description: 'Backup data to restore',
            },
          },
        },
      },
      {
        name: 'get_table_stats',
        description: 'Get statistics about a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to get statistics for',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_database':
        return await handleDatabaseQuery(args);
      
      case 'get_table_info':
        return await handleGetTableInfo(args);
      
      case 'list_tables':
        return await handleListTables();
      
      case 'backup_table':
        return await handleBackupTable(args);
      
      case 'restore_table':
        return await handleRestoreTable(args);
      
      case 'get_table_stats':
        return await handleGetTableStats(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Tool handlers
async function handleDatabaseQuery(args) {
  const { query, table, operation, data, filters } = args;

  if (query) {
    // Direct SQL query
    const { data: result, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      throw new Error(`SQL query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Query executed successfully:\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  if (table && operation) {
    // Table operation
    let result;
    let error;

    switch (operation) {
      case 'select':
        const selectQuery = supabase.from(table).select('*');
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            selectQuery.eq(key, value);
          });
        }
        ({ data: result, error } = await selectQuery);
        break;

      case 'insert':
        ({ data: result, error } = await supabase.from(table).insert(data).select());
        break;

      case 'update':
        let updateQuery = supabase.from(table).update(data);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            updateQuery.eq(key, value);
          });
        }
        ({ data: result, error } = await updateQuery.select());
        break;

      case 'delete':
        let deleteQuery = supabase.from(table);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            deleteQuery.eq(key, value);
          });
        }
        ({ data: result, error } = await deleteQuery.delete().select());
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    if (error) {
      throw new Error(`Database operation failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Operation ${operation} on table ${table} completed successfully:\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  throw new Error('Either provide a query or table with operation');
}

async function handleGetTableInfo(args) {
  const { table } = args;
  
  if (!table) {
    throw new Error('Table name is required');
  }

  // Get table structure
  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_name', table);

  if (error) {
    throw new Error(`Failed to get table info: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Table: ${table}\nColumns:\n${JSON.stringify(columns, null, 2)}`,
      },
    ],
  };
}

async function handleListTables() {
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_type')
    .eq('table_schema', 'public');

  if (error) {
    throw new Error(`Failed to list tables: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Available tables:\n${JSON.stringify(tables, null, 2)}`,
      },
    ],
  };
}

async function handleBackupTable(args) {
  const { table, format = 'json' } = args;
  
  if (!table) {
    throw new Error('Table name is required');
  }

  const { data, error } = await supabase.from(table).select('*');

  if (error) {
    throw new Error(`Failed to backup table: ${error.message}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${table}_backup_${timestamp}.${format}`;

  return {
    content: [
      {
        type: 'text',
        text: `Backup created for table ${table}:\nFilename: ${filename}\nRecords: ${data.length}\nData: ${JSON.stringify(data, null, 2)}`,
      },
    ],
  };
}

async function handleRestoreTable(args) {
  const { table, data } = args;
  
  if (!table || !data) {
    throw new Error('Table name and data are required');
  }

  const { data: result, error } = await supabase.from(table).insert(data).select();

  if (error) {
    throw new Error(`Failed to restore table: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Table ${table} restored successfully:\n${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
}

async function handleGetTableStats(args) {
  const { table } = args;
  
  if (!table) {
    throw new Error('Table name is required');
  }

  // Get row count
  const { count, error: countError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to get table stats: ${countError.message}`);
  }

  // Get sample data
  const { data: sample, error: sampleError } = await supabase
    .from(table)
    .select('*')
    .limit(5);

  if (sampleError) {
    throw new Error(`Failed to get sample data: ${sampleError.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Table: ${table}\nRow count: ${count}\nSample data:\n${JSON.stringify(sample, null, 2)}`,
      },
    ],
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Supabase MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
