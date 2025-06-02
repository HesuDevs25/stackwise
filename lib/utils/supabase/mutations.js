import supabase from '@/lib/config/supabase';

/**
 * User related mutations
 */

// Create or update a user profile
export const upsertProfile = async (profile) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(profile)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error upserting profile:', error);
        throw error;
    }
};

// Delete a user profile
export const deleteProfile = async (userId) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting profile:', error);
        throw error;
    }
};

/**
 * Container related mutations
 */

// Create or update a container
export const upsertContainer = async (container) => {
    try {
        const { data, error } = await supabase
            .from('containers')
            .upsert(container)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error upserting container:', error);
        throw error;
    }
};

// Update container status and create history record
export const updateContainerStatus = async ({ containerId, newStatus, previousStatus, notes, performedBy }) => {
    try {
        // Start a transaction
        const { data: container, error: containerError } = await supabase
            .from('containers')
            .update({ status: newStatus })
            .eq('id', containerId)
            .select()
            .single();

        if (containerError) throw containerError;

        // Create history record
        const { error: historyError } = await supabase
            .from('container_history')
            .insert({
                container_id: containerId,
                action: 'status_changed',
                previous_status: previousStatus,
                new_status: newStatus,
                notes,
                performed_by: performedBy
            });

        if (historyError) throw historyError;

        return container;
    } catch (error) {
        console.error('Error updating container status:', error);
        throw error;
    }
};

/**
 * Block related mutations
 */

// Create or update a block
export const upsertBlock = async (block) => {
    try {
        const { data, error } = await supabase
            .from('blocks')
            .upsert(block)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error upserting block:', error);
        throw error;
    }
};

// Delete a block
export const deleteBlock = async (blockId) => {
    try {
        const { error } = await supabase
            .from('blocks')
            .delete()
            .eq('id', blockId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting block:', error);
        throw error;
    }
};

/**
 * Slot related mutations
 */

// Assign container to slot
export const assignContainerToSlot = async ({ slotId, containerId, blockId, performedBy }) => {
    try {
        // Update slot
        const { data: slot, error: slotError } = await supabase
            .from('slots')
            .update({ container_id: containerId })
            .eq('id', slotId)
            .select()
            .single();

        if (slotError) throw slotError;

        // Create history record
        const { error: historyError } = await supabase
            .from('container_history')
            .insert({
                container_id: containerId,
                action: 'moved',
                new_location: `${blockId}-${slot.bay}-${slot.row}-${slot.tier}`,
                performed_by: performedBy
            });

        if (historyError) throw historyError;

        return slot;
    } catch (error) {
        console.error('Error assigning container to slot:', error);
        throw error;
    }
};

/**
 * Booking related mutations
 */

// Create or update a booking
export const upsertBooking = async (booking) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .upsert(booking)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error upserting booking:', error);
        throw error;
    }
};

/**
 * Truck related mutations
 */

// Create or update a truck
export const upsertTruck = async (truck) => {
    try {
        const { data, error } = await supabase
            .from('trucks')
            .upsert(truck)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error upserting truck:', error);
        throw error;
    }
};

// Update truck status and timestamps
export const updateTruckStatus = async ({ truckId, status, timestamp }) => {
    try {
        const updates = { status };
        
        // Add appropriate timestamp based on status
        switch (status) {
            case 'loading':
                updates.loading_start_time = timestamp;
                break;
            case 'loaded':
                updates.loading_complete_time = timestamp;
                break;
            case 'departed':
                updates.exit_time = timestamp;
                break;
        }

        const { data, error } = await supabase
            .from('trucks')
            .update(updates)
            .eq('id', truckId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating truck status:', error);
        throw error;
    }
}; 