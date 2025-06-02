"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';
import { initialBlocks, initialContainers, blockTypes } from '../../../data/data';

export default function BlockDetails({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const blockId = unwrappedParams.blockId;
  
  const [block, setBlock] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContainer, setNewContainer] = useState({
    container_number: "",
    type: "20GP",
    consignee_name: "",
    status: "empty",
    size: "20",
    freight_indicator: "FCL"
  });
  // States for container removal process
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [isDirectlyAccessible, setIsDirectlyAccessible] = useState(false);
  const [removalPath, setRemovalPath] = useState([]);
  const [showPathVisualization, setShowPathVisualization] = useState(false);

  useEffect(() => {
    if (!blockId) {
      setError("Invalid block ID");
      setLoading(false);
      return;
    }

    fetchBlockDetails();
    
    // Subscribe to real-time changes
    const blockSubscription = supabase
      .channel('blocks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocks', filter: `id=eq.${blockId}` },
        (payload) => {
          console.log('Block update:', payload);
          fetchBlockDetails();
        }
      )
      .subscribe();

    const slotsSubscription = supabase
      .channel('slots_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'slots', filter: `block_id=eq.${blockId}` },
        (payload) => {
          console.log('Slots update:', payload);
          fetchBlockDetails();
        }
      )
      .subscribe();

    return () => {
      blockSubscription.unsubscribe();
      slotsSubscription.unsubscribe();
    };
  }, [blockId]);

  const fetchBlockDetails = async () => {
    try {
      setError(null);
      
      // Fetch block details
      const { data: blockData, error: blockError } = await supabase
        .from('blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (blockError) throw blockError;
      
      if (!blockData) {
        setError("Block not found");
        return;
      }

      // Fetch slots with their containers
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select(`
          *,
          container:container_id (
            id,
            container_number,
            type,
            consignee_name,
            status,
            size,
            freight_indicator,
            created_at,
            updated_at
          )
        `)
        .eq('block_id', blockId)
        .order('bay', { ascending: true })
        .order('row', { ascending: true })
        .order('tier', { ascending: true });

      if (slotsError) throw slotsError;
      
      setBlock(blockData);
      setSlots(slotsData || []);
    } catch (error) {
      console.error("Error loading block details:", error);
      setError(error.message || "Failed to load block details");
    } finally {
      setLoading(false);
    }
  };

  // Filter slots based on search query
  const filteredSlots = slots.filter(slot => {
    if (!searchQuery || !slot.container) return true;
    
    const query = searchQuery.toLowerCase();
    const container = slot.container;
    return (
      container.container_number?.toLowerCase().includes(query) ||
      container.consignee_name?.toLowerCase().includes(query) ||
      container.type?.toLowerCase().includes(query) ||
      container.status?.toLowerCase().includes(query) ||
      `B${slot.bay}-R${slot.row}-T${slot.tier}`.toLowerCase().includes(query)
    );
  });

  // Find the next available slot
  const findNextAvailableSlot = () => {
    try {
      if (!block) return null;
      
      // Find first empty slot
      const emptySlot = slots.find(slot => !slot.container_id);
      return emptySlot ? `B${emptySlot.bay}-R${emptySlot.row}-T${emptySlot.tier}` : null;
    } catch (error) {
      console.error("Error finding next available slot:", error);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContainer({
      ...newContainer,
      [name]: value
    });
  };

  const handleAddContainer = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Basic validation
      if (!newContainer.container_number || !newContainer.consignee_name) {
        setError("Please fill all required fields");
        return;
      }
      
      // Find an empty slot
      const emptySlot = slots.find(slot => !slot.container_id);
      
      if (!emptySlot) {
        setError("No available slots in this block. The block is full.");
        return;
      }

      // First create the container
      const { data: containerData, error: containerError } = await supabase
        .from('containers')
        .insert([{
          container_number: newContainer.container_number,
          type: newContainer.type,
          consignee_name: newContainer.consignee_name,
          status: newContainer.status,
          size: newContainer.size,
          freight_indicator: newContainer.freight_indicator,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (containerError) throw containerError;

      // Then update the slot with the container ID
      const { error: slotError } = await supabase
        .from('slots')
        .update({ 
          container_id: containerData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', emptySlot.id);

      if (slotError) throw slotError;
      
      // Reset form
      setNewContainer({
        container_number: "",
        type: "20GP",
        consignee_name: "",
        status: "empty",
        size: "20",
        freight_indicator: "FCL"
      });
      
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding container:", error);
      setError(error.message || "Failed to add container");
    }
  };

  const removeContainer = async (slot) => {
    if (!slot.container_id) return;
    
    try {
      setError(null);
      
      // Update the slot to remove container reference
      const { error: slotError } = await supabase
        .from('slots')
        .update({ 
          container_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', slot.id);

      if (slotError) throw slotError;
      
      // Close modal
      setRemovalModalOpen(false);
      setSelectedContainer(null);
    } catch (error) {
      console.error("Error removing container:", error);
      setError(error.message || "Failed to remove container");
    }
  };

  // Get color for cell based on container count (tier level)
  const getCellColor = (count, maxTier) => {
    if (count === 0) return 'bg-gray-100'; // Empty
    
    const ratio = count / maxTier;
    if (ratio <= 0.25) return 'bg-blue-100'; // 1-25% full
    if (ratio <= 0.5) return 'bg-blue-300'; // 26-50% full
    if (ratio <= 0.75) return 'bg-blue-500 text-white'; // 51-75% full
    return 'bg-green-700 text-white'; // 76-100% full
  };

  // Get container counts for visualization
  const getContainerCountByPosition = () => {
    try {
      if (!block) return {};
      
      const slotCounts = {};
      
      // Initialize all slots with 0
      for (let b = 1; b <= block.bays; b++) {
        for (let r = 1; r <= block.rows; r++) {
          const slotBase = `B${b}-R${r}`;
          slotCounts[slotBase] = 0;
        }
      }
      
      // Count containers in each slot
      slots.forEach(slot => {
        if (slot.container_id) {
          const slotBase = `B${slot.bay}-R${slot.row}`;
          if (slotCounts[slotBase] !== undefined) {
            slotCounts[slotBase]++;
          }
        }
      });
      
      return slotCounts;
    } catch (error) {
      console.error("Error counting containers by slot:", error);
      return {};
    }
  };

  // Calculate block statistics
  const calculateBlockStats = () => {
    if (!block || !slots) return { totalSlots: 0, occupiedSlots: 0, utilizationPercentage: 0 };
    
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(slot => slot.container_id).length;
    const utilizationPercentage = Math.round((occupiedSlots / totalSlots) * 100);
    
    return { totalSlots, occupiedSlots, utilizationPercentage };
  };

  // Path Visualization Component
  const PathVisualization = ({ container, path, onClose }) => {
    // Calculate positions based on the container's slot
    const getSlotPosition = (slot) => {
      try {
        const [bayPart, rowPart, tierPart] = slot.split('-');
        const bay = parseInt(bayPart.substring(1)) - 1; // Convert to 0-indexed
        const row = parseInt(rowPart.substring(1)) - 1; // Convert to 0-indexed
        const tier = parseInt(tierPart.substring(1));
        
        return { bay, row, tier };
      } catch (error) {
        console.error("Error parsing slot:", error);
        return { bay: 0, row: 0, tier: 0 };
      }
    };
    
    // Get target container position
    const targetPos = getSlotPosition(container.slot);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#1a202c]">Path Visualization</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              This visualization shows the containers that need to be moved to access the target container.
            </p>
          </div>
          
          <div className="relative border-2 border-gray-300 rounded-lg p-4" style={{ height: '400px' }}>
            {/* Block visualization with overlay */}
            <div className="grid gap-1 h-full" 
              style={{ 
                gridTemplateColumns: `repeat(${block.bays}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${block.rows}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: block.rows }).map((_, rowIndex) => (
                Array.from({ length: block.bays }).map((_, bayIndex) => {
                  // Count rows from top to bottom (R3 to R1)
                  const row = block.rows - rowIndex;
                  // Count bays from right to left (B1 on right to B3 on left)
                  const bay = block.bays - bayIndex;
                  const slotBase = `B${bay}-R${row}`;
                  const count = containerCountsBySlot[slotBase] || 0;
                  
                  // Check if this is the target container's position
                  const isTargetPosition = targetPos.bay === bayIndex && targetPos.row === rowIndex;
                  
                  // Check if any containers in the path are at this position
                  const pathContainersHere = path.filter(c => {
                    const pos = getSlotPosition(c.slot);
                    return pos.bay === bayIndex && pos.row === rowIndex;
                  });
                  
                  return (
                    <div 
                      key={slotBase}
                      className={`flex flex-col items-center justify-center border border-gray-200 rounded-md ${getCellColor(count, block.tiers)} p-1`}
                    >
                      {count > 0 && (
                        <span className="text-lg font-semibold text-gray-700">
                          {count}
                        </span>
                      )}
                      <span className="text-xs opacity-75">
                        B{bay}-R{row}-T{count > 0 ? count : 1}
                      </span>
                      
                      {/* Highlight for target container */}
                      {isTargetPosition && (
                        <div className="absolute inset-0 border-4 border-red-500 rounded-md z-10 flex items-center justify-center">
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                            Target
                          </div>
                        </div>
                      )}
                      
                      {/* Numbered indicators for path containers */}
                      {pathContainersHere.map((pathContainer, index) => {
                        const pathIndex = path.findIndex(c => c.id === pathContainer.id);
                        return (
                          <div 
                            key={pathContainer.id}
                            className="absolute top-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold z-20"
                          >
                            {pathIndex + 1}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ))}
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 p-2 rounded border border-gray-200 text-xs">
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 border-4 border-red-500 mr-2"></div>
                <span>Target Container</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                <span>Containers to Move (in order)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between">
            <div>
              <p className="font-medium">Container: {container.container_number}</p>
              <p className="text-sm text-gray-600">Location: {container.slot}</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading block details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button 
            onClick={() => router.push('/yard-management/storage-blocks')}
            className="flex items-center text-indigo-700 hover:text-indigo-900 hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Storage Blocks
          </button>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Get container counts for visualization
  const containerCountsBySlot = getContainerCountByPosition();

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mb-4">
        <button 
          onClick={() => router.push('/yard-management/storage-blocks')}
          className="flex items-center text-indigo-700 hover:text-indigo-900 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Storage Blocks
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{block.block_name}</h1>
            <span className="bg-white text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
              {block.type}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-6">
            <div className='col-span-2'>
              <div className="bg-indigo-50 p-4 rounded-lg h-full">
                <h2 className="text-lg font-semibold mb-4 text-indigo-800">Block Visualization</h2>
                <div className="w-full bg-white border-2 border-indigo-100 rounded-lg p-4 shadow-sm">
                  {/* Block Visualization - Top View */}
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-indigo-500">Top view of block</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-indigo-500 mr-1">Legend:</span>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-1"></div>
                        <span className="text-xs">Empty</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-100 border border-gray-200 rounded mr-1"></div>
                        <span className="text-xs">Tier 1</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-300 border border-gray-200 rounded mr-1"></div>
                        <span className="text-xs">Tier 2</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 border border-gray-200 rounded mr-1"></div>
                        <span className="text-xs">Tier 3</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-700 border border-gray-200 rounded mr-1"></div>
                        <span className="text-xs">Tier 4</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grid for visualization - with fixed size */}
                  <div className="flex justify-center">
                    <div 
                      className="grid gap-1" 
                      style={{ 
                        gridTemplateColumns: `repeat(${block.bays}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${block.rows}, minmax(0, 1fr))`,
                        width: '100%',
                        maxWidth: '600px',
                        height: '300px'
                      }}
                    >
                      {Array.from({ length: block.rows }).map((_, rowIndex) => (
                        Array.from({ length: block.bays }).map((_, bayIndex) => {
                          // Count rows from top to bottom (R3 to R1)
                          const row = block.rows - rowIndex;
                          // Count bays from right to left (B1 on right to B3 on left)
                          const bay = block.bays - bayIndex;
                          const slotBase = `B${bay}-R${row}`;
                          const count = containerCountsBySlot[slotBase] || 0;
                          
                          return (
                            <div 
                              key={slotBase}
                              className={`flex flex-col items-center justify-center border border-gray-200 rounded-md ${getCellColor(count, block.tiers)} p-1`}
                            >
                              {count > 0 && (
                                <span className="text-lg font-semibold text-gray-700">
                                  {count}
                                </span>
                              )}
                              <span className="text-xs opacity-75">
                                B{bay}-R{row}-T{count > 0 ? count : 1}
                              </span>
                            </div>
                          );
                        })
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-indigo-700">Block Type:</span> {block.type}
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-700">{calculateBlockStats().occupiedSlots} containers</span> out of {calculateBlockStats().totalSlots} slots ({calculateBlockStats().utilizationPercentage}%)
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-indigo-700">Dimensions:</span> {block.tiers} tiers × {block.rows} rows × {block.bays} bays
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='col-span-1 flex flex-col gap-4'>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-indigo-800">Block Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-indigo-600 text-sm">Dimensions</p>
                    <p className="font-medium">{block.bays} × {block.rows} × {block.tiers}</p>
                  </div>
                  <div>
                    <p className="text-indigo-600 text-sm">Type</p>
                    <p className="font-medium">{block.type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-indigo-600 text-sm">Total Capacity</p>
                    <p className="font-medium">{calculateBlockStats().totalSlots} containers</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-indigo-800">Utilization</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-indigo-600 text-sm">Containers</p>
                    <p className="font-medium">{calculateBlockStats().occupiedSlots}</p>
                  </div>
                  <div>
                    <p className="text-indigo-600 text-sm">Available Slots</p>
                    <p className="font-medium">{calculateBlockStats().totalSlots - calculateBlockStats().occupiedSlots}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-indigo-600 text-sm mb-1">Utilization</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-indigo-600 h-4 rounded-full" 
                        style={{ width: `${calculateBlockStats().utilizationPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm mt-1">{calculateBlockStats().utilizationPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-indigo-800">
                Containers ({calculateBlockStats().occupiedSlots})
              </h2>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded text-sm font-medium transition-colors"
              >
                {showAddForm ? "Cancel" : "Add Container"}
              </button>
            </div>

            {showAddForm && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                <h3 className="text-md font-semibold mb-3 text-indigo-800">Add New Container</h3>
                <form onSubmit={handleAddContainer}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Container Number*</label>
                      <input
                        type="text"
                        name="container_number"
                        value={newContainer.container_number}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. MSCU1234567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Container Type</label>
                      <select
                        name="type"
                        value={newContainer.type}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="20GP">20GP</option>
                        <option value="40GP">40GP</option>
                        <option value="40HQ">40HQ</option>
                        <option value="45HQ">45HQ</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Consignee Name*</label>
                      <input
                        type="text"
                        name="consignee_name"
                        value={newContainer.consignee_name}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. ABC Company"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={newContainer.status}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="empty">Empty</option>
                        <option value="loaded">Loaded</option>
                        <option value="held">Held</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Size</label>
                      <select
                        name="size"
                        value={newContainer.size}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="20">20ft</option>
                        <option value="40">40ft</option>
                        <option value="45">45ft</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Freight Indicator</label>
                      <select
                        name="freight_indicator"
                        value={newContainer.freight_indicator}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="FCL">FCL</option>
                        <option value="LCL">LCL</option>
                        <option value="Empty">Empty</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow-md transition-colors text-sm"
                    >
                      Add Container
                    </button>
                    <div className="text-sm text-indigo-600">
                      Next available slot: {findNextAvailableSlot() || "No slots available"}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Search bar for containers */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search containers by number, consignee, type, slot or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-10 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-indigo-600">
                  Found {filteredSlots.length} {filteredSlots.length === 1 ? 'container' : 'containers'} matching &apos;{searchQuery}&apos;
                </div>
              )}
            </div>

            {slots.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg border border-indigo-100">
                <table className="min-w-full divide-y divide-indigo-100">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Slot</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Container Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Consignee</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-indigo-50">
                    {filteredSlots.map(slot => (
                      <tr key={slot.id} className="hover:bg-indigo-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          B{slot.bay}-R{slot.row}-T{slot.tier}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {slot.container?.container_number || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {slot.container?.type || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {slot.container?.size ? `${slot.container.size}ft` : '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {slot.container?.consignee_name || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {slot.container ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              slot.container.status === 'empty' ? 'bg-green-100 text-green-800' :
                              slot.container.status === 'held' ? 'bg-yellow-100 text-yellow-800' :
                              slot.container.status === 'damaged' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {slot.container.status.charAt(0).toUpperCase() + slot.container.status.slice(1)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {slot.container && (
                            <button 
                              onClick={() => removeContainer(slot)}
                              className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs font-medium transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-indigo-500 text-center py-4 bg-white rounded-lg">No slots in this block</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Container Removal Modal */}
      {removalModalOpen && selectedContainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-800">
                {isDirectlyAccessible ? "Remove Container" : "Container Access Path"}
              </h3>
              <button 
                onClick={() => setRemovalModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 bg-indigo-50 p-3 rounded-lg">
              <p className="font-semibold">Container: {selectedContainer.container_number}</p>
              <p>Type: {selectedContainer.type}</p>
              <p>Location: {selectedContainer.slot}</p>
            </div>
            
            {isDirectlyAccessible ? (
              <div>
                <p className="mb-4 text-green-600 font-medium">
                  This container is directly accessible and can be removed.
                </p>
                
                <div className="mb-4">
                  <p className="font-medium mb-2 text-indigo-700">Select destination:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-indigo-100 hover:bg-indigo-200 py-2 px-3 rounded text-sm text-indigo-800">
                      Another Block
                    </button>
                    <button className="bg-indigo-100 hover:bg-indigo-200 py-2 px-3 rounded text-sm text-indigo-800">
                      Verification Area
                    </button>
                    <button className="bg-indigo-100 hover:bg-indigo-200 py-2 px-3 rounded text-sm text-indigo-800">
                      Stripping Area
                    </button>
                    <button className="bg-indigo-100 hover:bg-indigo-200 py-2 px-3 rounded text-sm text-indigo-800">
                      Load Container
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    onClick={() => setRemovalModalOpen(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => removeContainer(selectedContainer)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                  >
                    Remove Container
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-amber-600 font-medium">
                  This container is not directly accessible. You need to move {removalPath.length} container(s) first.
                </p>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-indigo-700">Containers to move (in order):</h4>
                  <div className="border border-indigo-100 rounded-lg overflow-hidden">
                    {removalPath.map((container, index) => (
                      <div key={container.id} className="flex items-center p-3 border-b border-indigo-50 last:border-b-0 bg-white">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">{container.container_number}</p>
                          <p className="text-sm text-gray-600">{container.slot}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-blue-800 mb-1">Path Visualization</h4>
                  <p className="text-sm text-blue-600">
                    Click below to see a visual representation of the container removal path.
                  </p>
                  <button 
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                    onClick={() => {
                      setShowPathVisualization(true);
                      setRemovalModalOpen(false);
                    }}
                  >
                    Show Path Visualization
                  </button>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    onClick={() => setRemovalModalOpen(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Path Visualization Modal */}
      {showPathVisualization && selectedContainer && (
        <PathVisualization 
          container={selectedContainer}
          path={removalPath}
          onClose={() => {
            setShowPathVisualization(false);
            setRemovalModalOpen(true);
          }}
        />
      )}
    </div>
  );
}



