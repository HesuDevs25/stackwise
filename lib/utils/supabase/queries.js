import supabase from '@/lib/config/supabase';

/**
 * User related queries
 */

// Fetch all users with optional filters
export const fetchUsers = async (filters = {}) => {
    try {
        let query = supabase
            .from('profiles')
            .select('*');

        // Apply filters if any
        if (filters.role) query = query.eq('role', filters.role);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

/**
 * Container related queries
 */

// Fetch all containers with optional filters
export const fetchContainers = async (filters = {}) => {
    try {
        let query = supabase
            .from('containers')
            .select(`
                *,
                slots (
                    id,
                    block_id,
                    bay,
                    row,
                    tier
                ),
                bookings (
                    id,
                    booking_type,
                    booking_date,
                    status,
                    notes
                )
            `);

        // Apply filters
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.search) {
            query = query.or(`
                container_number.ilike.%${filters.search}%,
                bl_number.ilike.%${filters.search}%,
                consignee_name.ilike.%${filters.search}%
            `);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching containers:', error);
        throw error;
    }
};

/**
 * Block related queries
 */

// Fetch all blocks with optional filters
export const fetchBlocks = async (filters = {}) => {
    try {
        let query = supabase
            .from('blocks')
            .select(`
                *,
                slots (
                    id,
                    container_id,
                    bay,
                    row,
                    tier
                )
            `);

        if (filters.type) query = query.eq('type', filters.type);
        if (filters.search) {
            query = query.or(`block_name.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching blocks:', error);
        throw error;
    }
};

/**
 * Slot related queries
 */

// Fetch slots for a specific block
export const fetchBlockSlots = async (blockId) => {
    try {
        const { data, error } = await supabase
            .from('slots')
            .select(`
                *,
                containers (
                    id,
                    container_number,
                    type,
                    status
                )
            `)
            .eq('block_id', blockId)
            .order('bay', { ascending: true })
            .order('row', { ascending: true })
            .order('tier', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching block slots:', error);
        throw error;
    }
};

/**
 * Truck related queries
 */

// Fetch all trucks with optional filters
export const fetchTrucks = async (filters = {}) => {
    try {
        let query = supabase
            .from('trucks')
            .select(`
                *,
                containers (
                    id,
                    container_number,
                    type,
                    status
                )
            `);

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.search) {
            query = query.or(`
                truck_number.ilike.%${filters.search}%,
                driver_name.ilike.%${filters.search}%,
                company.ilike.%${filters.search}%
            `);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching trucks:', error);
        throw error;
    }
};

/**
 * Booking related queries
 */

// Fetch all bookings with optional filters
export const fetchBookings = async (filters = {}) => {
    try {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                containers (
                    id,
                    container_number,
                    type,
                    status
                )
            `);

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.type) query = query.eq('booking_type', filters.type);
        if (filters.search) {
            query = query.or(`notes.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('booking_date', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }
};

/**
 * Container History related queries
 */

// Fetch history for a specific container
export const fetchContainerHistory = async (containerId) => {
    try {
        const { data, error } = await supabase
            .from('container_history')
            .select(`
                *,
                profiles (
                    id,
                    name,
                    role
                )
            `)
            .eq('container_id', containerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching container history:', error);
        throw error;
    }
};

export async function fetchContainerByNumber(container_number) {
    try {
        const { data, error } = await supabase
            .from('containers')
            .select('*')
            .eq('container_number', container_number)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching container:', error);
        throw error;
    }
}

/**
 * Dashboard related queries
 */

// Fetch dashboard statistics
export const fetchDashboardStats = async () => {
    try {
        // Get total containers count
        const { count: totalContainers, error: containersError } = await supabase
            .from('containers')
            .select('*', { count: 'exact', head: true });

        if (containersError) throw containersError;

        // Get available slots count
        const { count: totalSlots, error: slotsError } = await supabase
            .from('slots')
            .select('*', { count: 'exact', head: true });

        if (slotsError) throw slotsError;

        // Get pending bookings count
        const { count: pendingBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (bookingsError) throw bookingsError;

        // Get trucks count for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: trucksToday, error: trucksError } = await supabase
            .from('trucks')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        if (trucksError) throw trucksError;

        return {
            totalContainers: totalContainers || 0,
            availableSlots: totalSlots || 0,
            pendingBookings: pendingBookings || 0,
            trucksToday: trucksToday || 0
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

// Fetch recent activity
export const fetchRecentActivity = async (limit = 5) => {
    try {
        const { data, error } = await supabase
            .from('container_history')
            .select(`
                *,
                containers (
                    id,
                    container_number
                ),
                profiles (
                    id,
                    name,
                    role
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        throw error;
    }
}; 