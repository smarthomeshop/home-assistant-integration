// Finding the rooms on an uploaded floor plan needs an account service.
// Home Assistant passes its own through floorPlannerHost.recognise. A site
// that offers the planner on its own replaces this module with one that
// exports recognise(image): a function that takes the plan as a JPEG data URL
// and resolves to { recognition, quota }, or rejects with an error that has a
// code (and a quota when the service sent one).
export const recognise = null;
