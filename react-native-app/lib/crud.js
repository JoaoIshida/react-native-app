import supabase from './createClient';
import { debugLog, measureQueryPerformance } from './debug';

export const crud = {
    /**
     * Fetch data from a table
     * 
     * @param {string} table - Table name
     * @param {Object} options - Query options (columns, filters, etc.)
     * @returns {Promise} - Query result
     * 
     * @example
     * // Get all profiles
     * const { data, error } = await crud.get('profiles');
     * 
     * // Get specific columns with filter
     * const { data, error } = await crud.get('profiles', {
     *   select: 'id, username, avatar_url',
     *   filters: { username: 'eq.johndoe' }
     * });
     */
    get: async (table, options = {}) => {
        const { select = '*', filters = {}, limit, offset, order } = options;

        return await measureQueryPerformance(`GET ${table}`, async () => {
            let query = supabase.from(table).select(select);

            // Apply filters
            Object.entries(filters).forEach(([column, operation]) => {
                const [operator, value] = operation.split('.');
                query = query.filter(column, operator, value);
            });

            // Apply ordering
            if (order) {
                const { column, ascending = true } = order;
                query = query.order(column, { ascending });
            }

            // Apply pagination
            if (limit) query = query.limit(limit);
            if (offset) query = query.range(offset, offset + (limit || 10) - 1);

            return await query;
        });
    },

    /**
     * Get a single record by ID
     * 
     * @param {string} table - Table name
     * @param {string|number} id - Record ID
     * @param {string} select - Columns to select
     * @returns {Promise} - Query result
     * 
     * @example
     * const { data, error } = await crud.getById('profiles', 123);
     */
    getById: async (table, id, select = '*') => {
        return await measureQueryPerformance(`GET ${table} by ID`, async () => {
            return await supabase
                .from(table)
                .select(select)
                .eq('id', id)
                .single();
        });
    },

    /**
     * Create a new record
     * 
     * @param {string} table - Table name
     * @param {Object|Array} data - Data to insert
     * @param {Object} options - Additional options
     * @returns {Promise} - Insert result
     * 
     * @example
     * // Insert a single record
     * const { data, error } = await crud.create('profiles', { 
     *   username: 'johndoe', 
     *   email: 'john@example.com' 
     * });
     * 
     * // Insert multiple records
     * const { data, error } = await crud.create('tasks', [
     *   { title: 'Task 1', user_id: 123 },
     *   { title: 'Task 2', user_id: 123 }
     * ]);
     */
    create: async (table, data, options = {}) => {
        const { returning = 'minimal' } = options;

        return await measureQueryPerformance(`CREATE ${table}`, async () => {
            return await supabase
                .from(table)
                .insert(data)
                .select(returning === 'minimal' ? 'id' : '*');
        });
    },

    /**
     * Update an existing record
     * 
     * @param {string} table - Table name
     * @param {Object} data - Data to update
     * @param {Object} filters - Filters to select records
     * @param {Object} options - Additional options
     * @returns {Promise} - Update result
     * 
     * @example
     * // Update by ID
     * const { data, error } = await crud.update(
     *   'profiles',
     *   { username: 'newusername' },
     *   { id: 'eq.123' }
     * );
     * 
     * // Update with multiple filters
     * const { data, error } = await crud.update(
     *   'tasks',
     *   { completed: true },
     *   { 
     *     user_id: 'eq.123',
     *     status: 'eq.pending'
     *   }
     * );
     */
    update: async (table, data, filters, options = {}) => {
        const { returning = 'minimal' } = options;

        return await measureQueryPerformance(`UPDATE ${table}`, async () => {
            let query = supabase.from(table).update(data);

            // Apply filters
            Object.entries(filters).forEach(([column, operation]) => {
                const [operator, value] = operation.split('.');
                query = query.filter(column, operator, value);
            });

            return await query.select(returning === 'minimal' ? 'id' : '*');
        });
    },

    /**
     * Update a record by ID
     * 
     * @param {string} table - Table name
     * @param {string|number} id - Record ID
     * @param {Object} data - Data to update
     * @param {Object} options - Additional options
     * @returns {Promise} - Update result
     * 
     * @example
     * const { data, error } = await crud.updateById(
     *   'profiles',
     *   123,
     *   { username: 'newusername' }
     * );
     */
    updateById: async (table, id, data, options = {}) => {
        const { returning = '*' } = options;

        return await measureQueryPerformance(`UPDATE ${table} by ID`, async () => {
            return await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select(returning);
        });
    },

    /**
     * Delete records
     * 
     * @param {string} table - Table name
     * @param {Object} filters - Filters to select records
     * @returns {Promise} - Delete result
     * 
     * @example
     * // Delete by ID
     * const { error } = await crud.delete('profiles', { id: 'eq.123' });
     * 
     * // Delete with filters
     * const { error } = await crud.delete('tasks', { 
     *   user_id: 'eq.123',
     *   completed: 'eq.true'
     * });
     */
    delete: async (table, filters) => {
        return await measureQueryPerformance(`DELETE ${table}`, async () => {
            let query = supabase.from(table).delete();

            // Apply filters
            Object.entries(filters).forEach(([column, operation]) => {
                const [operator, value] = operation.split('.');
                query = query.filter(column, operator, value);
            });

            return await query;
        });
    },

    /**
     * Delete a record by ID
     * 
     * @param {string} table - Table name
     * @param {string|number} id - Record ID
     * @returns {Promise} - Delete result
     * 
     * @example
     * const { error } = await crud.deleteById('profiles', 123);
     */
    deleteById: async (table, id) => {
        return await measureQueryPerformance(`DELETE ${table} by ID`, async () => {
            return await supabase
                .from(table)
                .delete()
                .eq('id', id);
        });
    },
};