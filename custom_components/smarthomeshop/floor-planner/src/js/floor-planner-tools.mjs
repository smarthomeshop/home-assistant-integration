// Drawing tools that stay selected after something has been placed, so
// several walls, doors, windows, mirrors or zones can be added in a row.
export const repeatingTools = ['wall', 'door', 'window', 'mirror', 'zone'];

// Whether a tool stays active after placing. A tool that carries an existing
// item (moving a door along its wall, adding a part to a zone) is done after
// that one change.
export const toolRepeats = (tool, item = null) => repeatingTools.includes(tool) && !item;

// The tool a tool button switches to. Choosing the active tool again puts it
// away and goes back to selecting.
export const chosenTool = (active, chosen) => chosen === active ? 'edit' : chosen;
