"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/config/supabase';

export default function StorageBlocks() {
  const router = useRouter();
  const [blocks, setBlocks] = useState([]);
  const [blockStats, setBlockStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBlock, setNewBlock] = useState({
    block_name: "",
    bays: "",
    rows: "",
    type: "regular",
    tiers: 4
  });

  // Fetch blocks and their stats from Supabase
  useEffect(() => {
    fetchBlocksAndStats();
    
    // Subscribe to real-time changes for both blocks and slots
    const blocksSubscription = supabase
      .channel('blocks_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocks' }, 
        (payload) => {
          console.log('Blocks update:', payload);
          fetchBlocksAndStats();
        }
      )
      .subscribe();

    const slotsSubscription = supabase
      .channel('slots_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'slots' },
        (payload) => {
          console.log('Slots update:', payload);
          fetchBlocksAndStats();
        }
      )
      .subscribe();

    return () => {
      blocksSubscription.unsubscribe();
      slotsSubscription.unsubscribe();
    };
  }, []);

  const fetchBlocksAndStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (blocksError) throw blocksError;
      
      // Fetch slots with container counts for each block
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('block_id, container_id');

      if (slotsError) throw slotsError;
      
      // Calculate stats for each block
      const stats = {};
      slotsData.forEach(slot => {
        if (!stats[slot.block_id]) {
          stats[slot.block_id] = {
            totalSlots: 0,
            occupiedSlots: 0
          };
        }
        stats[slot.block_id].totalSlots++;
        if (slot.container_id) {
          stats[slot.block_id].occupiedSlots++;
        }
      });
      
      setBlocks(blocksData || []);
      setBlockStats(stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load storage blocks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Filter blocks based on search query
  const filteredBlocks = blocks.filter(block => {
    const query = searchQuery.toLowerCase();
    return (
      block.block_name.toLowerCase().includes(query) || 
      block.type.toLowerCase().includes(query)
    );
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBlock({
      ...newBlock,
      [name]: ['bays', 'rows', 'tiers'].includes(name) ? 
        (value === "" ? "" : parseInt(value, 10)) : value
    });
  };

  const validateBlockData = (blockData) => {
    const errors = [];
    
    if (!blockData.block_name.trim()) {
      errors.push("Block name is required");
    } else if (blockData.block_name.length > 10) {
      errors.push("Block name must be 10 characters or less");
    }
    
    if (!blockData.bays || blockData.bays <= 0) {
      errors.push("Number of bays must be greater than 0");
    }
    
    if (!blockData.rows || blockData.rows <= 0) {
      errors.push("Number of rows must be greater than 0");
    }
    
    if (!blockData.type) {
      errors.push("Block type is required");
    }
    
    if (blockData.tiers <= 0) {
      errors.push("Number of tiers must be greater than 0");
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Validate inputs
      const validationErrors = validateBlockData(newBlock);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "));
        return;
      }
      
      // Calculate capacity
      const capacity = newBlock.bays * newBlock.rows * newBlock.tiers;
      
      // Start a transaction
      const { data: blockData, error: blockError } = await supabase
        .from('blocks')
        .insert([{
          block_name: newBlock.block_name.trim(),
          bays: newBlock.bays,
          rows: newBlock.rows,
          tiers: newBlock.tiers,
          type: newBlock.type,
          capacity: capacity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (blockError) throw blockError;

      // Create slots for the new block
      const slotsToCreate = [];
      for (let bay = 1; bay <= newBlock.bays; bay++) {
        for (let row = 1; row <= newBlock.rows; row++) {
          for (let tier = 1; tier <= newBlock.tiers; tier++) {
            slotsToCreate.push({
              block_id: blockData.id,
              bay,
              row,
              tier,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      const { error: slotsError } = await supabase
        .from('slots')
        .insert(slotsToCreate);

      if (slotsError) throw slotsError;
      
      // Reset form
      setNewBlock({ 
        block_name: "", 
        bays: "", 
        rows: "", 
        type: "regular", 
        tiers: 4 
      });
      setShowForm(false);
      
      console.log("Block and slots created successfully!");
      
    } catch (error) {
      console.error("Error adding new block:", error);
      setError(error.message || "Failed to create block. Please try again.");
    }
  };

  // Navigate to block details page
  const navigateToBlockDetails = (blockId) => {
    try {
      if (!blockId) {
        console.error("Invalid block ID");
        return;
      }
      router.push(`/yard-manager/storage-blocks/${blockId}`);
    } catch (error) {
      console.error("Error navigating to block details:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading storage blocks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/yard-management')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-indigo-800">Storage Blocks</h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          {showForm ? "Cancel" : "Add New Block"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search blocks by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all shadow-sm"
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
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-indigo-500">
          <h2 className="text-lg font-semibold mb-4 text-indigo-800">Create New Block</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Block Name</label>
                <input
                  type="text"
                  name="block_name"
                  value={newBlock.block_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Block D"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Block Type</label>
                <select
                  name="type"
                  value={newBlock.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="regular">Regular</option>
                  <option value="reefer">Reefer</option>
                  <option value="hazardous">Hazardous</option>
                  <option value="empty">Empty</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Bays</label>
                <input
                  type="number"
                  name="bays"
                  value={newBlock.bays}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Number of bays (front to back)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Rows</label>
                <input
                  type="number"
                  name="rows"
                  value={newBlock.rows}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Number of rows (side to side)"
                />
              </div>
            </div>
            <div className="mt-4">
              <button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md transition-colors"
              >
                Create Block
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search results info */}
      {searchQuery && (
        <div className="mb-4 text-sm text-indigo-600">
          Found {filteredBlocks.length} {filteredBlocks.length === 1 ? 'block' : 'blocks'} matching &apos;{searchQuery}&apos;
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlocks.map(block => {
          const stats = blockStats[block.id] || { totalSlots: 0, occupiedSlots: 0 };
          const utilizationPercentage = stats.totalSlots > 0 
            ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100) 
            : 0;
          
          return (
            <div 
              key={block.id} 
              className="bg-white border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigateToBlockDetails(block.id)}
            >
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white p-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{block.block_name}</h3>
                  <div className="text-xs opacity-80">{block.bays} × {block.rows} × {block.tiers}</div>
                </div>
                <div className="bg-white text-indigo-800 px-2 py-1 rounded-full text-xs font-bold">
                  {block.type}
                </div>
              </div>
              <div className="p-4">
                <div className="relative" style={{ height: '180px', width: '100%' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center border-2 border-gray-300 rounded-lg">
                    <div className="text-center mb-2">
                      <div className="font-bold text-indigo-800">{stats.occupiedSlots} / {stats.totalSlots}</div>
                      <div className="text-sm text-gray-600">Containers</div>
                    </div>
                    
                    <div className="w-full px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${utilizationPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-center text-gray-600">
                        {utilizationPercentage}% utilized
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 