// Dummy data for blocks in the yard
export const initialBlocks = [
  { id: 1, name: "Block A", bay: 10, row: 5, tier: 4, type: "regular" },
  { id: 2, name: "Block B", bay: 8, row: 4, tier: 4, type: "emptyChasis" },
  { id: 3, name: "Block C", bay: 12, row: 6, tier: 4, type: "regular" },
  { id: 4, name: "Block D", bay: 2, row: 2, tier: 4, type: "regular" }
];

export const blockTypes = {
  regular: "Regular",
  emptyChasis: "Empty Chasis",
};


export const initialContainers = [
  { id: 1, containerNumber: "4567890123", type: "20GP", blockId: 1, status: "empty", consigneeName: "ABC Company", slot: "B01-R01-T01" },
  { id: 2, containerNumber: "4567890124", type: "40GP", blockId: 2, status: "empty", consigneeName: "ABC Company", slot: "B01-R01-T01" },
  { id: 3, containerNumber: "4567890125", type: "40HQ", blockId: 3, status: "empty", consigneeName: "ABC Company", slot: "B01-R01-T01" },
  //block D containers
  { id: 4, containerNumber: "4567890126", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B01-R01-T01" },
  { id: 5, containerNumber: "4567890127", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B01-R02-T01" },
  { id: 6, containerNumber: "4567890128", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B02-R01-T01" },
  { id: 7, containerNumber: "4567890129", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B02-R02-T01" },
  { id: 8, containerNumber: "4567890110", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B01-R01-T02" },
  { id: 9, containerNumber: "4567890111", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B01-R02-T02" },
  { id: 10, containerNumber: "4567890112", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B02-R01-T02" },
  { id: 11, containerNumber: "4567890113", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B02-R02-T02" },
  { id: 12, containerNumber: "4567890114", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B01-R01-T03" },
  { id: 13, containerNumber: "4567890115", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B01-R02-T03" },
  { id: 14, containerNumber: "4567890116", type: "40HQ", blockId: 4, status: "empty", consigneeName: "ABC Company", slot: "B02-R01-T03" },
];


